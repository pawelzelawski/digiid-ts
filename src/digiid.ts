import { randomBytes } from 'crypto';
import { 
  DigiIDUriOptions, 
  DigiIDError, 
  DigiIDCallbackData, 
  DigiIDVerifyOptions, 
  DigiIDVerificationResult 
} from './types';

// Moved require inside the function that uses it to potentially help mocking
// and avoid top-level side effects if require itself does something complex.

/**
 * INTERNAL: Verifies the signature using the digibyte-message library.
 * Exported primarily for testing purposes (mocking/spying).
 * @internal
 */
export async function _internalVerifySignature(
  uri: string,
  address: string,
  signature: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Message = require('digibyte-message');
  try {
    const messageInstance = new Message(uri);
    // Assuming synchronous based on common bitcore patterns, but wrapping for safety
    const isValidSignature = await Promise.resolve(
      messageInstance.verify(address, signature)
    );
    return !!isValidSignature; // Ensure boolean return
  } catch (e: any) {
    // Re-throw specific errors (like format/checksum errors) from the underlying library
    // to be caught by the main verification function.
    throw new DigiIDError(`Signature verification failed: ${e.message || e}`);
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
