# digiid-ts

A modern TypeScript implementation of the Digi-ID authentication protocol, inspired by the original [digiid-js](https://github.com/digibyte-core/digiid-js).

Provides utilities for generating Digi-ID URIs for QR code display and verifying the callback data signed by a user's Digi-ID-compatible wallet.

## Features

*   Generates Digi-ID URIs according to the specification.
*   Verifies Digi-ID callback signatures and data.
*   Verifies signatures from all standard DigiByte address types (Legacy, SegWit P2SH, Native SegWit/Bech32).
*   Full TypeScript support with comprehensive type definitions.
*   Modern ES modules support.
*   Minimal dependencies, relying on standard cryptographic libraries.
*   Comprehensive test coverage.
*   Detailed error messages for debugging.

## Installation

```bash
# Using npm
npm install digiid-ts

# Using yarn
yarn add digiid-ts

# Using pnpm
pnpm add digiid-ts
```

The package provides both ESM and UMD builds, with full TypeScript type definitions.

### Requirements
- Node.js 16.0.0 or higher
- TypeScript 4.5 or higher (for TypeScript users)

## Usage

### Generating a Digi-ID URI

```typescript
import { generateDigiIDUri, DigiIDError } from 'digiid-ts';

const options = {
  callbackUrl: 'https://your-site.com/auth/callback',
  // Optional parameters:
  nonce: 'custom-nonce', // Defaults to random UUID
  unsecure: false, // Defaults to false (requires HTTPS)
};

try {
  const digiidUri = generateDigiIDUri(options);
  console.log('Generated Digi-ID URI:', digiidUri);
  // Display this URI as a QR code for the user to scan
} catch (error) {
  if (error instanceof DigiIDError) {
    console.error('Failed to generate Digi-ID URI:', error.message);
  }
}
```

### Verifying the Digi-ID Callback

```typescript
import { verifyDigiIDCallback, DigiIDError, DigiIDCallbackData } from 'digiid-ts';

// In your Express route handler:
app.post('/auth/callback', async (req, res) => {
  const callbackData: DigiIDCallbackData = req.body; // { address, uri, signature }
  
  const verifyOptions = {
    expectedCallbackUrl: 'https://your-site.com/auth/callback',
    expectedNonce: 'your-stored-nonce', // The nonce you generated earlier
  };

  try {
    const verificationResult = await verifyDigiIDCallback(callbackData, verifyOptions);
    
    // Verification successful!
    console.log(`Successfully verified Digi-ID login for address: ${verificationResult.address}`);
    
    // Store the verified address in your session/database
    // Redirect to success page
    res.redirect('/dashboard');
  } catch (error) {
    if (error instanceof DigiIDError) {
      // Specific Digi-ID error (e.g., signature invalid, nonce mismatch, URL mismatch)
      console.error('Digi-ID verification failed:', error.message);
      res.status(400).json({ error: error.message });
    } else {
      // Unexpected error
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

## API Reference

### Core Functions

*   `generateDigiIDUri(options: DigiIDUriOptions): string`
    *   Generates a Digi-ID URI for QR code display.
*   `verifyDigiIDCallback(callbackData: DigiIDCallbackData, verifyOptions: DigiIDVerifyOptions): Promise<DigiIDVerificationResult>`
    *   Verifies the data received from the wallet callback. Resolves on success, throws `DigiIDError` on failure.

### Type Definitions

*   `DigiIDUriOptions`: Options for `generateDigiIDUri`.
*   `DigiIDCallbackData`: Shape of data expected from the wallet callback.
*   `DigiIDVerifyOptions`: Options for `verifyDigiIDCallback`.
*   `DigiIDVerificationResult`: Shape of the success result from `verifyDigiIDCallback`.
*   `DigiIDError`: Custom error class thrown on failures.

## Development

### Prerequisites

*   Node.js 18+
*   npm 9+

### Setup

1.  Clone the repository
2.  Install dependencies: `npm install`
3.  Run tests: `npm test`

### Project Structure

*   `src/` - Source code
    *   `digiid.ts` - Core implementation
    *   `types.ts` - TypeScript type definitions
*   `test/` - Test files
*   `examples/` - Usage examples
*   `dist/` - Built files (generated)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.