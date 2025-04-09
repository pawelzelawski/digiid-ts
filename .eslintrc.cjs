module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Add prettier last to override other formatting rules
  ],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Add any specific rule overrides here
    '@typescript-eslint/no-explicit-any': 'warn', // Allow any, but warn
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Warn unused vars, ignore if starts with _
  },
  ignorePatterns: ["dist/", "node_modules/", "*.cjs", "vitest.config.ts"], // Ignore config files and output
}; 