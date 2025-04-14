import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import necessary functions and types from the main export
import { DigiIDError, generateDigiIDUri, verifyDigiIDCallback } from '../index';
// Import Buffer constructor
import { Buffer } from 'buffer';

// Perform dynamic import at top level to access internal function for spying
const digiidModule = await import('../digiid');

// Mock crypto.randomBytes for predictable nonce generation in tests
vi.mock('crypto', () => ({
  // Mock implementation - ignore size parameter as we return a fixed value
  randomBytes: vi.fn((/* size: number */): Buffer => {
    // Return a fixed Buffer matching the expectedDefaultNonce below
    return Buffer.from('61616161616161616161616161616161', 'hex');
  }),
}));

describe('generateDigiIDUri', () => {
  const defaultOptions = {
    callbackUrl: 'https://example.com/callback',
  };
  // Matches the fixed buffer returned by the mock (16 bytes of 'a' / 0x61)
  const expectedDefaultNonce = '61616161616161616161616161616161';

  it('should generate a valid DigiID URI with default nonce and secure flag', () => {
    const uri = generateDigiIDUri(defaultOptions);
    expect(uri).toBe(`digiid://example.com/callback?x=${expectedDefaultNonce}&u=0`);
  });

  it('should use the provided nonce', () => {
    const customNonce = 'my-custom-nonce-123';
    const uri = generateDigiIDUri({ ...defaultOptions, nonce: customNonce });
    expect(uri).toBe(`digiid://example.com/callback?x=${customNonce}&u=0`);
  });

  it('should handle callback URL with path', () => {
    const uri = generateDigiIDUri({ callbackUrl: 'https://sub.domain.org/deep/path/auth' });
    expect(uri).toBe(`digiid://sub.domain.org/deep/path/auth?x=${expectedDefaultNonce}&u=0`);
  });

  it('should set unsecure flag (u=1) when unsecure option is true and protocol is http', () => {
    const uri = generateDigiIDUri({ callbackUrl: 'http://localhost:3000/login', unsecure: true });
    expect(uri).toBe(`digiid://localhost:3000/login?x=${expectedDefaultNonce}&u=1`);
  });

  it('should throw error if callbackUrl is missing', () => {
    // Use 'as any' for testing invalid input where required properties are missing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => generateDigiIDUri({} as any)).toThrow(DigiIDError);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => generateDigiIDUri({} as any)).toThrow('Callback URL is required.');
  });

  it('should throw error for invalid callback URL format', () => {
    expect(() => generateDigiIDUri({ callbackUrl: 'invalid-url' })).toThrow(DigiIDError);
    expect(() => generateDigiIDUri({ callbackUrl: 'invalid-url' })).toThrow(/^Invalid callback URL:/);
  });

  it('should throw error if unsecure is true but protocol is https', () => {
    expect(() => generateDigiIDUri({ callbackUrl: 'https://example.com', unsecure: true })).toThrow(DigiIDError);
    expect(() => generateDigiIDUri({ callbackUrl: 'https://example.com', unsecure: true })).toThrow(
      'Unsecure flag is true, but callback URL does not use http protocol.'
    );
  });

  it('should throw error if unsecure is false (default) but protocol is http', () => {
    expect(() => generateDigiIDUri({ callbackUrl: 'http://example.com' })).toThrow(DigiIDError);
    expect(() => generateDigiIDUri({ callbackUrl: 'http://example.com' })).toThrow(
      'Callback URL must use https protocol unless unsecure flag is set to true.'
    );
  });
});

// --- Verification Tests --- //

// Spy on the internal signature verification helper from the dynamically imported module
// Let assignment define the type implicitly - no explicit type annotation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let signatureVerifySpy: any;

beforeEach(async () => {
  // Recreate the spy before each test in this suite
  // Target the internal function using the dynamic import
  signatureVerifySpy = vi.spyOn(digiidModule, '_internalVerifySignature');
  // Default mock implementation for most tests
  signatureVerifySpy.mockResolvedValue(true);
});

afterEach(() => {
  // Restore the spy after each test
  signatureVerifySpy?.mockRestore();
});

// Restore all mocks after the entire suite is done
afterAll(() => {
  vi.restoreAllMocks();
});

describe('verifyDigiIDCallback', () => {
  // Use a syntactically valid Legacy address format
  const defaultAddress = 'D7dVskXFpH8gTgZG9sN3d6dPUbJtZfJ2Vc';
  const defaultNonce = '61616161616161616161616161616161'; // Matches the mock
  const defaultCallback = 'https://example.com/callback';
  const defaultUri = `digiid://example.com/callback?x=${defaultNonce}&u=0`;
  // Use a syntactically valid Base64 string placeholder
  const defaultSignature = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiYw==';

  const defaultCallbackData = {
    address: defaultAddress,
    uri: defaultUri,
    signature: defaultSignature,
  };

  const defaultVerifyOptions = {
    expectedCallbackUrl: defaultCallback,
    expectedNonce: defaultNonce,
  };

  // Test valid case (signature verification mocked to true)
  it('should resolve successfully with valid data and signature (mocked)', async () => {
    const result = await verifyDigiIDCallback(defaultCallbackData, defaultVerifyOptions);
    expect(result).toEqual({
      isValid: true,
      address: defaultAddress,
      nonce: defaultNonce,
    });
    // Check if the internal verification function was called correctly
    expect(signatureVerifySpy).toHaveBeenCalledWith(defaultUri, defaultAddress, defaultSignature);
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });

  it('should throw if required callback data is missing (address)', async () => {
    const data = { ...defaultCallbackData, address: '' };
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      'Missing required callback data: address, uri, or signature.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if required callback data is missing (uri)', async () => {
    const data = { ...defaultCallbackData, uri: '' };
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      'Missing required callback data: address, uri, or signature.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if required callback data is missing (signature)', async () => {
    const data = { ...defaultCallbackData, signature: '' };
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      'Missing required callback data: address, uri, or signature.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw for invalid URI format in callback data', async () => {
    const data = { ...defaultCallbackData, uri: 'invalid-uri-format' };
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      /^Invalid URI received in callback:/);
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if URI is missing nonce (x)', async () => {
    const uriWithoutNonce = `digiid://example.com/callback?u=0`;
    const data = { ...defaultCallbackData, uri: uriWithoutNonce };
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      'URI missing nonce (x) or unsecure (u) parameter.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if URI is missing unsecure (u)', async () => {
    const uriWithoutUnsecure = `digiid://example.com/callback?x=${defaultNonce}`;
    const data = { ...defaultCallbackData, uri: uriWithoutUnsecure };
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      'URI missing nonce (x) or unsecure (u) parameter.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw for invalid expectedCallbackUrl format', async () => {
    const options = { ...defaultVerifyOptions, expectedCallbackUrl: 'invalid-url' };
    await expect(verifyDigiIDCallback(defaultCallbackData, options)).rejects.toThrow(
      /^Invalid expectedCallbackUrl provided:/);
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if callback URL domain/path mismatch', async () => {
    const options = { ...defaultVerifyOptions, expectedCallbackUrl: 'https://different.com/callback' };
    await expect(verifyDigiIDCallback(defaultCallbackData, options)).rejects.toThrow(
      'Callback URL mismatch: URI contained "example.com/callback", expected "different.com/callback"'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if URI indicates unsecure (u=1) but expected URL is https', async () => {
    const unsecureUri = `digiid://example.com/callback?x=${defaultNonce}&u=1`;
    const data = { ...defaultCallbackData, uri: unsecureUri };
    // Expected URL is still https
    await expect(verifyDigiIDCallback(data, defaultVerifyOptions)).rejects.toThrow(
      'URI indicates unsecure (u=1), but expectedCallbackUrl is not http.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should throw if URI indicates secure (u=0) but expected URL is http', async () => {
    const options = { ...defaultVerifyOptions, expectedCallbackUrl: 'http://example.com/callback' };
    // URI is secure (u=0), but expected is http
    await expect(verifyDigiIDCallback(defaultCallbackData, options)).rejects.toThrow(
      'URI indicates secure (u=0), but expectedCallbackUrl is not https.'
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should succeed if URI indicates unsecure (u=1) and expected URL is http', async () => {
    const unsecureUri = `digiid://example.com/callback?x=${defaultNonce}&u=1`;
    const data = { ...defaultCallbackData, uri: unsecureUri };
    const options = { ...defaultVerifyOptions, expectedCallbackUrl: 'http://example.com/callback' };

    const result = await verifyDigiIDCallback(data, options);
    expect(result.isValid).toBe(true);
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });

  it('should throw if nonce mismatch', async () => {
    const options = { ...defaultVerifyOptions, expectedNonce: 'different-nonce' };
    await expect(verifyDigiIDCallback(defaultCallbackData, options)).rejects.toThrow(
      `Nonce mismatch: URI contained "${defaultNonce}", expected "different-nonce". Possible replay attack.`
    );
    expect(signatureVerifySpy).not.toHaveBeenCalled();
  });

  it('should not throw if nonce matches when expectedNonce is provided', async () => {
    const options = { ...defaultVerifyOptions, expectedNonce: defaultNonce }; // Explicitly matching
    const result = await verifyDigiIDCallback(defaultCallbackData, options);
    expect(result.isValid).toBe(true);
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });

  it('should not check nonce if expectedNonce is not provided', async () => {
    const options = { expectedCallbackUrl: defaultCallback }; // No expectedNonce
    const result = await verifyDigiIDCallback(defaultCallbackData, options);
    expect(result.isValid).toBe(true);
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });

  it('should throw "Invalid signature." if internal verification returns false', async () => {
    signatureVerifySpy.mockResolvedValue(false); // Simulate invalid signature from internal check
    await expect(verifyDigiIDCallback(defaultCallbackData, defaultVerifyOptions)).rejects.toThrow(
      'Invalid signature.'
    );
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });

  it('should re-throw DigiIDError from internal verification', async () => {
    const internalError = new DigiIDError('Internal checksum failed');
    signatureVerifySpy.mockRejectedValue(internalError); // Simulate internal lib throwing specific error
    await expect(verifyDigiIDCallback(defaultCallbackData, defaultVerifyOptions)).rejects.toThrow(
      internalError // Expect the exact error instance to be re-thrown
    );
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });

  it('should wrap unexpected errors from internal verification', async () => {
    const unexpectedError = new Error('Unexpected network issue');
    signatureVerifySpy.mockRejectedValue(unexpectedError); // Simulate unexpected error
    await expect(verifyDigiIDCallback(defaultCallbackData, defaultVerifyOptions)).rejects.toThrow(
      'Unexpected error during signature verification: Unexpected network issue'
    );
    expect(signatureVerifySpy).toHaveBeenCalledOnce();
  });
});
// Ensure no trailing characters or unclosed comments below this line
