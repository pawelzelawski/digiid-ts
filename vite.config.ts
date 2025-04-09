import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts'; // Plugin to generate consolidated .d.ts file
import { resolve } from 'path';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [
    dts({ // Generate declaration files
      insertTypesEntry: true, // Create a single entry point for types
    }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DigiIDTs', // Global variable name in UMD build
      formats: ['es', 'umd'], // Output formats (ES Module, Universal Module Definition)
      fileName: (format) => `digiid-ts.${format}.js`, // Output file names
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library (e.g., peer dependencies)
      external: ['crypto', 'module', 'digibyte-message'], // Externalize Node built-ins and the core dependency
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          crypto: 'crypto', // Map 'crypto' import to global 'crypto' (Node)
          module: 'module', // Map 'module' import to global 'module' (Node)
          'digibyte-message': 'DigibyteMessage' // Example global name if needed, might not be necessary for UMD if only used internally
        },
      },
    },
    sourcemap: true, // Generate source maps for debugging
    emptyOutDir: true, // Clean the dist directory before building
  },
}); 