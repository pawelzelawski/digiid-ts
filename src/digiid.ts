import { randomBytes } from 'crypto';
import { DigiIDUriOptions, DigiIDError } from './types';

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
