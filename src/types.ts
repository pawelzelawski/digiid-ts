/**
 * Options for generating a DigiID URI.
 */
export interface DigiIDUriOptions {
  /** The full URL that the user's DigiID wallet will send the verification data back to. */
  callbackUrl: string;
  /** A unique, unpredictable nonce (number used once) for this authentication request. If not provided, a secure random one might be generated (implementation specific). */
  nonce?: string;
  /** Set to true for testing over HTTP (insecure), defaults to false (HTTPS required). */
  unsecure?: boolean;
}

/**
 * Data structure typically received from the DigiID wallet callback.
 */
export interface DigiIDCallbackData {
  /** The DigiByte address used for signing. */
  address: string;
  /** The DigiID URI that was originally presented to the user. */
  uri: string;
  /** The signature proving ownership of the address, signing the URI. */
  signature: string;
}

/**
 * Options for verifying a DigiID callback.
 */
export interface DigiIDVerifyOptions {
  /** The expected callback URL (or parts of it, like domain/path) that should match the one in the received URI. */
  expectedCallbackUrl: string | URL;
  /** The specific nonce that was originally generated for this authentication attempt, to prevent replay attacks. */
  expectedNonce?: string;
}

/**
 * Result of a successful DigiID verification.
 */
export interface DigiIDVerificationResult {
  /** Indicates the verification was successful. */
  isValid: true;
  /** The DigiByte address that was successfully verified. */
  address: string;
  /** The nonce extracted from the verified URI. */
  nonce: string;
}

/**
 * Represents an error during DigiID processing.
 */
export class DigiIDError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DigiIDError';
  }
}
