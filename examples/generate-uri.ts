// examples/generate-uri.ts

/**
 * Example: Generating a Digi-ID URI
 * 
 * This example demonstrates how to generate a Digi-ID URI that can be displayed as a QR code
 * for users to scan with their Digi-ID compatible wallet.
 */

// Import directly from src for running locally before publishing
// In a real project, you'd import from 'digiid-ts' after installing
// Revert extension, ts-node should handle this when configured
import { generateDigiIDUri, DigiIDError } from '../src/index'; 

console.log('--- DigiID URI Generation Example ---');

// --- Example 1: Secure Callback (HTTPS) ---
const secureOptions = {
  callbackUrl: 'https://myapp.example.com/api/auth/digiid',
};

try {
  const secureUri = generateDigiIDUri(secureOptions);
  console.log('\nSecure URI (HTTPS):');
  console.log(`  Callback: ${secureOptions.callbackUrl}`);
  console.log(`  Generated: ${secureUri}`);
  // Typically, you would now generate a QR code from secureUri
} catch (error) {
  console.error('Error generating secure URI:', (error as Error).message);
}

// --- Example 2: Unsecure Callback (HTTP) for Testing ---
const unsecureOptions = {
  callbackUrl: 'http://localhost:8080/dev/callback',
  unsecure: true, // Must set this flag for http
};

try {
  const unsecureUri = generateDigiIDUri(unsecureOptions);
  console.log('\nUnsecure URI (HTTP) for testing:');
  console.log(`  Callback: ${unsecureOptions.callbackUrl}`);
  console.log(`  Generated: ${unsecureUri}`);
} catch (error) {
  console.error('Error generating unsecure URI:', (error as Error).message);
}

// --- Example 3: Providing a Custom Nonce ---
const customNonceOptions = {
  callbackUrl: 'https://anotherapp.com/verify',
  nonce: 'my-unique-secret-nonce-per-request-12345'
};

try {
  const customNonceUri = generateDigiIDUri(customNonceOptions);
  console.log('\nURI with Custom Nonce:');
  console.log(`  Callback: ${customNonceOptions.callbackUrl}`);
  console.log(`  Nonce:    ${customNonceOptions.nonce}`);
  console.log(`  Generated: ${customNonceUri}`);
} catch (error) {
  console.error('Error generating URI with custom nonce:', (error as Error).message);
}

// --- Example 4: Invalid URL (Missing Scheme) ---
const invalidUrlOptions = {
  callbackUrl: 'myapi.com/auth' // Missing https://
};

console.log('\nAttempting URI with Invalid URL (expecting error):');
try {
  generateDigiIDUri(invalidUrlOptions as any);
} catch (error) {
  if (error instanceof DigiIDError) {
    console.log(`  Caught expected DigiIDError: ${error.message}`);
  } else {
    console.error('  Caught unexpected error:', error);
  }
}

console.log('\n--- End of Generation Example ---');
