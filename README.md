# digiid-ts

A modern TypeScript implementation of the DigiID authentication protocol, inspired by the original [digiid-js](https://github.com/digibyte-core/digiid-js).

Provides utilities for generating DigiID URIs for QR code display and verifying the callback data signed by a user's DigiID-compatible wallet.

## Features

*   Written in TypeScript with types included.
*   Modern tooling (Vitest, ESLint, Prettier).
*   Generates DigiID URIs according to the specification.
*   Verifies DigiID callback signatures and data.
*   Uses standard Node.js `crypto` for nonce generation.

## Installation

As this package is not yet published on NPM, you can install it directly from GitHub:

```bash
npm install pawelzelawski/digiid-ts
# or using yarn
yarn add pawelzelawski/digiid-ts
# or using pnpm
pnpm add pawelzelawski/digiid-ts
```

## Usage

### Generating a DigiID URI

Typically used on the server-side to generate a unique URI for each login attempt.

```typescript
import { generateDigiIDUri, DigiIDError } from 'digiid-ts';

// Define options for the URI
const options = {
  // Your backend endpoint URL where the wallet will POST the signed data
  // **Must be a full URL including the scheme (e.g., 'https://' or 'http://')**
  callbackUrl: 'https://yourdomain.com/api/digiid/callback',
  // Optional: Provide your own cryptographically secure nonce
  // nonce: 'your-securely-generated-nonce',
  // Optional: Set to true only for testing with HTTP callback URL (default: false)
  // unsecure: false,
};

try {
  const digiidUri = generateDigiIDUri(options);
  console.log('Generated DigiID URI:', digiidUri);
  // Example output: digiid://yourdomain.com/api/digiid/callback?x=GENERATED_NONCE&u=0

  // Now, display this URI as a QR code for the user to scan.
  // You can use libraries like 'qrcode' for this.

} catch (error) {
  if (error instanceof DigiIDError) {
    console.error('Failed to generate DigiID URI:', error.message);
  } else {
    console.error('An unexpected error occurred:', error);
  }
}
```

### Verifying the DigiID Callback

When the user scans the QR code and approves, their wallet sends a POST request to your `callbackUrl`. Your backend needs to verify this data.

```typescript
import { verifyDigiIDCallback, DigiIDError, DigiIDCallbackData } from 'digiid-ts';

// Example using Express.js - adapt for your framework
app.post('/api/digiid/callback', async (req, res) => {
  const callbackData: DigiIDCallbackData = req.body; // { address, uri, signature }

  // Retrieve the nonce associated with this login attempt from your session/database
  const expectedNonce = getNonceForSession(req.sessionID); // Implement this function

  const verifyOptions = {
    // Must match the full URL (including scheme) used during URI generation
    expectedCallbackUrl: 'https://yourdomain.com/api/digiid/callback', 
    expectedNonce: expectedNonce, // Crucial for preventing replay attacks
  };

  try {
    const verificationResult = await verifyDigiIDCallback(callbackData, verifyOptions);

    if (verificationResult.isValid) {
      console.log(`Successfully verified DigiID login for address: ${verificationResult.address}`);
      // Proceed with user login/session creation for verificationResult.address
      // Mark the nonce as used
      markNonceAsUsed(expectedNonce); // Implement this function

      res.status(200).send({ success: true, address: verificationResult.address });
    } else {
      // This case should ideally not be reached as errors are thrown,
      // but included for completeness.
      console.warn('Verification returned invalid, but no error was thrown.');
      res.status(400).send({ success: false, message: 'Verification failed.' });
    }

  } catch (error) {
    if (error instanceof DigiIDError) {
      // Specific DigiID error (e.g., signature invalid, nonce mismatch, URL mismatch)
      console.error('DigiID verification failed:', error.message);
      res.status(400).send({ success: false, message: `Verification failed: ${error.message}` });
    } else {
      // Unexpected error during verification
      console.error('An unexpected error occurred during verification:', error);
      res.status(500).send({ success: false, message: 'Internal server error.' });
    }
  }
});
```

## API Reference

### Functions

*   `generateDigiIDUri(options: DigiIDUriOptions): string`
    *   Generates the `digiid://` URI.
*   `verifyDigiIDCallback(callbackData: DigiIDCallbackData, verifyOptions: DigiIDVerifyOptions): Promise<DigiIDVerificationResult>`
    *   Verifies the data received from the wallet callback. Resolves on success, throws `DigiIDError` on failure.

### Core Types

*   `DigiIDUriOptions`: Options for `generateDigiIDUri`.
*   `DigiIDCallbackData`: Shape of data expected from the wallet callback.
*   `DigiIDVerifyOptions`: Options for `verifyDigiIDCallback`.
*   `DigiIDVerificationResult`: Shape of the success result from `verifyDigiIDCallback`.
*   `DigiIDError`: Custom error class thrown on failures.

(Refer to `src/types.ts` for detailed interface definitions)

## Dependencies

This library currently uses a specific commit from a fork of `bitcore-message` (`digicontributer/bitcore-message`) for signature verification, matching the original `digiid-js` library. This is an older dependency.

**Future work is planned to replace this with modern, actively maintained cryptographic libraries.**

## Testing

Run tests using Vitest:

```bash
npm test
```

Run tests with coverage:

```bash
npm run coverage
```

*(Note: Some unit tests related to mocking the internal signature verification outcome are currently skipped due to challenges with mocking the legacy CJS dependency. These scenarios will be covered by future integration tests.)*

## License

[MIT](LICENSE)