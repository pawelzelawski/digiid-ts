import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';
import {
  DigiIDCallbackData,
  DigiIDError,
  DigiIDUriOptions,
  DigiIDVerificationResult,
  DigiIDVerifyOptions
} from './types';

/**
 * Base58 alphabet used for Bitcoin/DigiByte addresses
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode a base58 string to bytes
 */
function base58Decode(str: string): Uint8Array {
  const bytes: number[] = [0];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (!char) continue;
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) throw new Error('Invalid base58 character');

    for (let j = 0; j < bytes.length; j++) {
      bytes[j]! *= 58;
    }
    bytes[0]! += value;

    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      const byte = bytes[j]!;
      bytes[j] = byte + carry;
      carry = bytes[j]! >> 8;
      bytes[j]! &= 0xff;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Add leading zeros
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

/**
 * Decode a bech32 address (simplified for verification purposes)
 */
function decodeBech32(address: string): { version: number; program: Uint8Array } | null {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  const lowerAddr = address.toLowerCase();
  const parts = lowerAddr.split('1');
  if (parts.length !== 2) return null;

  const hrp = parts[0];
  const data = parts[1];
  if (!hrp || !data) return null;
  if (hrp !== 'dgb') return null;

  const values: number[] = [];
  for (const char of data) {
    const val = CHARSET.indexOf(char);
    if (val === -1) return null;
    values.push(val);
  }

  // Remove checksum (last 6 chars)
  const payload = values.slice(0, -6);
  if (payload.length < 1) return null;

  const version = payload[0];
  if (version === undefined) return null;

  // Convert from 5-bit to 8-bit
  const converted = convertBits(payload.slice(1), 5, 8, false);
  if (!converted) return null;

  return { version, program: new Uint8Array(converted) };
}

/**
 * Convert bits between different bit groups
 */
function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    if (value < 0 || value >> fromBits !== 0) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) result.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }

  return result;
}

/**
 * Hash message with Bitcoin/DigiByte message signing format
 */
function hashMessage(message: string, messagePrefix: string): Uint8Array {
  const prefixBuffer = new TextEncoder().encode(messagePrefix);
  const prefixLength = new Uint8Array([prefixBuffer.length]);

  const messageBuffer = new TextEncoder().encode(message);
  const messageLengthBytes: number[] = [];
  let messageLength = messageBuffer.length;

  // Encode message length as variable-length integer
  if (messageLength < 0xfd) {
    messageLengthBytes.push(messageLength);
  } else if (messageLength <= 0xffff) {
    messageLengthBytes.push(0xfd, messageLength & 0xff, (messageLength >> 8) & 0xff);
  } else if (messageLength <= 0xffffffff) {
    messageLengthBytes.push(
      0xfe,
      messageLength & 0xff,
      (messageLength >> 8) & 0xff,
      (messageLength >> 16) & 0xff,
      (messageLength >> 24) & 0xff
    );
  } else {
    throw new Error('Message too long');
  }

  const messageLengthBuffer = new Uint8Array(messageLengthBytes);

  // Concatenate: prefixLength + prefix + messageLengthBuffer + message
  const totalLength = prefixLength.length + prefixBuffer.length + messageLengthBuffer.length + messageBuffer.length;
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  combined.set(prefixLength, offset);
  offset += prefixLength.length;
  combined.set(prefixBuffer, offset);
  offset += prefixBuffer.length;
  combined.set(messageLengthBuffer, offset);
  offset += messageLengthBuffer.length;
  combined.set(messageBuffer, offset);

  // Double SHA256
  return sha256(sha256(combined));
}

/**
 * Recover public key from signature
 */
function recoverPublicKey(messageHash: Uint8Array, signature: Uint8Array): Uint8Array[] {
  if (signature.length !== 65) {
    throw new Error('Invalid signature length');
  }

  const firstByte = signature[0];
  if (firstByte === undefined) throw new Error('Invalid signature');

  const recoveryId = firstByte - 27;
  const compressed = recoveryId >= 4;
  const actualRecoveryId = recoveryId % 4;

  if (actualRecoveryId < 0 || actualRecoveryId > 3) {
    throw new Error('Invalid recovery ID');
  }

  const r = signature.slice(1, 33);
  const s = signature.slice(33, 65);

  // Create signature object
  const sig = new secp256k1.Signature(
    BigInt('0x' + Array.from(r).map(b => b.toString(16).padStart(2, '0')).join('')),
    BigInt('0x' + Array.from(s).map(b => b.toString(16).padStart(2, '0')).join(''))
  ).addRecoveryBit(actualRecoveryId);

  try {
    const point = sig.recoverPublicKey(messageHash);
    // Return both compressed and uncompressed versions to try both
    const compressedBytes = point.toBytes(true);
    const uncompressedBytes = point.toBytes(false);

    // Based on the recoveryId flag, return the appropriate format(s)
    if (compressed) {
      return [compressedBytes];
    } else {
      // For uncompressed signatures, try both formats as different wallets may encode differently
      return [uncompressedBytes, compressedBytes];
    }
  } catch (e) {
    throw new Error('Failed to recover public key: ' + (e instanceof Error ? e.message : String(e)));
  }
}

/**
 * Hash160: RIPEMD160(SHA256(data))
 */
function hash160(buffer: Uint8Array): Uint8Array {
  return ripemd160(sha256(buffer));
}

/**
 * Verify address matches public key
 */
function verifyAddress(address: string, publicKey: Uint8Array): boolean {
  // Legacy address (starts with D or S)
  if (address.startsWith('D') || address.startsWith('S')) {
    try {
      const decoded = base58Decode(address);
      if (decoded.length < 25) return false;

      const payload = decoded.slice(0, -4);
      const checksum = decoded.slice(-4);

      const hash = sha256(sha256(payload));
      const expectedChecksum = hash.slice(0, 4);

      // Verify checksum
      if (!checksum.every((byte, i) => byte === expectedChecksum[i])) {
        return false;
      }

      const pubKeyHash = payload.slice(1);
      const computedHash = hash160(publicKey);

      return pubKeyHash.every((byte, i) => byte === computedHash[i]);
    } catch {
      return false;
    }
  }

  // Bech32 address (starts with dgb1)
  if (address.toLowerCase().startsWith('dgb1')) {
    try {
      const decoded = decodeBech32(address);
      if (!decoded) return false;

      const { version, program } = decoded;

      if (version === 0) {
        // For witness v0 P2WPKH, use hash160 of compressed public key
        let pkToHash = publicKey;
        // If uncompressed (65 bytes), convert to compressed (33 bytes)
        if (publicKey.length === 65) {
          const isEven = publicKey[64]! % 2 === 0;
          pkToHash = new Uint8Array(33);
          pkToHash[0] = isEven ? 0x02 : 0x03;
          pkToHash.set(publicKey.slice(1, 33), 1);
        }

        const computedHash = hash160(pkToHash);
        return program.every((byte, i) => byte === computedHash[i]);
      }

      return false;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * INTERNAL: Verifies the signature using @noble/curves.
 * Exported primarily for testing purposes (mocking/spying).
 * @internal
 */
export async function _internalVerifySignature(
  uri: string,
  address: string,
  signature: string
): Promise<boolean> {
  // DigiByte Message Prefix
  const messagePrefix = '\x19DigiByte Signed Message:\n';

  try {
    // Decode base64 signature
    const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    if (sigBytes.length !== 65) {
      throw new Error('Invalid signature length');
    }

    // Hash the message
    const messageHash = hashMessage(uri, messagePrefix);

    // Recover public key from signature
    const publicKeys = recoverPublicKey(messageHash, sigBytes);

    // Verify that at least one recovered public key matches the address
    for (const pubKey of publicKeys) {
      if (verifyAddress(address, pubKey)) {
        return true;
      }
    }

    return false;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new DigiIDError(`Signature verification failed: ${errorMessage}`);
  }
}

/**
 * Generates a secure random nonce (hex string).
 * @param length - The number of bytes to generate (default: 16, resulting in 32 hex chars).
 * @returns A hex-encoded random string.
 */
function generateNonce(length = 16): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generates a DigiID authentication URI.
 *
 * @param options - Options for URI generation, including the callback URL.
 * @returns The generated DigiID URI string.
 * @throws {DigiIDError} If the callback URL is invalid or missing.
 */
export function generateDigiIDUri(options: DigiIDUriOptions): string {
  if (!options.callbackUrl) {
    throw new DigiIDError('Callback URL is required.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(options.callbackUrl);
  } catch (e) {
    throw new DigiIDError(`Invalid callback URL: ${(e as Error).message}`);
  }

  // DigiID spec requires stripping the scheme (http/https)
  const domainAndPath = parsedUrl.host + parsedUrl.pathname;

  const nonce = options.nonce || generateNonce();
  const unsecureFlag = options.unsecure ? '1' : '0'; // 1 for http, 0 for https

  // Validate scheme based on unsecure flag
  if (options.unsecure && parsedUrl.protocol !== 'http:') {
    throw new DigiIDError('Unsecure flag is true, but callback URL does not use http protocol.');
  }
  if (!options.unsecure && parsedUrl.protocol !== 'https:') {
    throw new DigiIDError('Callback URL must use https protocol unless unsecure flag is set to true.');
  }

  // Construct the URI
  // Example: digiid://example.com/callback?x=nonce_value&u=0
  const uri = `digiid://${domainAndPath}?x=${nonce}&u=${unsecureFlag}`;

  // Clean up potential trailing slash in path if no query params exist (though DigiID always has params)
  // This check might be redundant given DigiID structure, but good practice
  // const cleanedUri = uri.endsWith('/') && parsedUrl.search === '' ? uri.slice(0, -1) : uri;

  return uri;
}

/**
 * Verifies the signature and data received from a DigiID callback.
 *
 * @param callbackData - The data received from the wallet (address, uri, signature).
 * @param verifyOptions - Options for verification, including the expected callback URL and nonce.
 * @returns {Promise<DigiIDVerificationResult>} A promise that resolves with verification details if successful.
 * @throws {DigiIDError} If validation or signature verification fails.
 */
export async function verifyDigiIDCallback(
  callbackData: DigiIDCallbackData,
  verifyOptions: DigiIDVerifyOptions
): Promise<DigiIDVerificationResult> {
  const { address, uri, signature } = callbackData;
  const { expectedCallbackUrl, expectedNonce } = verifyOptions;

  if (!address || !uri || !signature) {
    throw new DigiIDError('Missing required callback data: address, uri, or signature.');
  }

  // 1. Parse the received URI
  let parsedReceivedUri: URL;
  try {
    // Temporarily replace digiid:// with http:// for standard URL parsing
    const parsableUri = uri.replace(/^digiid:/, 'http:');
    parsedReceivedUri = new URL(parsableUri);
  } catch (e) {
    throw new DigiIDError(`Invalid URI received in callback: ${(e as Error).message}`);
  }

  const receivedNonce = parsedReceivedUri.searchParams.get('x');
  const receivedUnsecure = parsedReceivedUri.searchParams.get('u'); // 0 or 1
  const receivedDomainAndPath = parsedReceivedUri.host + parsedReceivedUri.pathname;

  if (receivedNonce === null || receivedUnsecure === null) {
    throw new DigiIDError('URI missing nonce (x) or unsecure (u) parameter.');
  }

  // 2. Validate Callback URL
  let parsedExpectedUrl: URL;
  try {
    // Allow expectedCallbackUrl to be a string or URL object
    parsedExpectedUrl = typeof expectedCallbackUrl === 'string' ? new URL(expectedCallbackUrl) : expectedCallbackUrl;
  } catch (e) {
    throw new DigiIDError(`Invalid expectedCallbackUrl provided: ${(e as Error).message}`);
  }

  const expectedDomainAndPath = parsedExpectedUrl.host + parsedExpectedUrl.pathname;

  if (receivedDomainAndPath !== expectedDomainAndPath) {
    throw new DigiIDError(`Callback URL mismatch: URI contained "${receivedDomainAndPath}", expected "${expectedDomainAndPath}"`);
  }

  // Validate scheme consistency
  const expectedScheme = parsedExpectedUrl.protocol;
  if (receivedUnsecure === '1' && expectedScheme !== 'http:') {
    throw new DigiIDError('URI indicates unsecure (u=1), but expectedCallbackUrl is not http.');
  }
  if (receivedUnsecure === '0' && expectedScheme !== 'https:') {
    throw new DigiIDError('URI indicates secure (u=0), but expectedCallbackUrl is not https.');
  }

  // 3. Validate Nonce (optional)
  if (expectedNonce && receivedNonce !== expectedNonce) {
    throw new DigiIDError(`Nonce mismatch: URI contained "${receivedNonce}", expected "${expectedNonce}". Possible replay attack.`);
  }

  // 4. Verify Signature using internal helper
  try {
    const isValidSignature = await _internalVerifySignature(uri, address, signature);
    if (!isValidSignature) {
      // If the helper returns false, throw the standard invalid signature error
      throw new DigiIDError('Invalid signature.');
    }
  } catch (error) {
    // If _internalVerifySignature throws (e.g., due to format/checksum errors from the lib, or our re-thrown error),
    // re-throw it. It should already be a DigiIDError.
    if (error instanceof DigiIDError) {
      throw error;
    } else {
      // Catch any unexpected errors and wrap them
      throw new DigiIDError(`Unexpected error during signature verification: ${(error as Error).message}`);
    }
  }

  // 5. Return successful result
  return {
    isValid: true,
    address: address,
    nonce: receivedNonce, // Return the nonce from the URI
  };
}
