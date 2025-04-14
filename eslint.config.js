import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  // Global ignores (apply first)
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'examples/verify-callback-example.ts',
      'examples/verify-callback.ts', // Ignore this file too
      'examples/generate-uri.ts' // Ignore this file too
    ]
  },
  // Default JS rules for all JS/TS files
  js.configs.recommended,
  {
    // Apply TS rules specifically to .ts files within src and tests
    files: ['src/**/*.ts'], // Adjusted to include tests
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: ['./tsconfig.json'], // Apply project-based parsing only here
        tsconfigRootDir: '.',
      },
      globals: { // Define Node.js globals if needed
        NodeJS: true
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules, // Apply TS recommended rules
      '@typescript-eslint/no-explicit-any': 'error', // Make this an error now
    },
  },
  // Prettier rules (apply last)
  prettier,
]; 