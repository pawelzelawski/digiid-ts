/**
 * Example: Verifying a Digi-ID Callback
 * 
 * This example demonstrates how to verify a callback from a Digi-ID compatible wallet.
 * The callback contains a signature that needs to be verified against the original challenge.
 */

// Import directly from src for running locally before publishing
// In a real project, you'd import from 'digiid-ts' after installing
import { verifyDigiIDCallback, DigiIDError } from '../src/index';

// ... existing code ... 