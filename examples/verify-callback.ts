/**
 * Example: Verifying a Digi-ID Callback
 * 
 * This example demonstrates how to verify a callback from a Digi-ID compatible wallet.
 * The callback contains a signature that needs to be verified against the original challenge.
 */

// This example assumes you have a basic Express.js server setup.
// Run with: ts-node examples/verify-callback.ts

// Import only what's needed

// In-memory store for demo purposes. Replace with a database in production.
// Store nonce => { expectedUrl: string, timestamp: number }
const nonceStore = new Map<string, { expectedUrl: string; timestamp: number }>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ... existing code ... 