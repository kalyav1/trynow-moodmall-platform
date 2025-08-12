// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Vite config options
  resolve: {
    alias: {
      // In Vite, a common way to handle this is to use an alias to an empty module
      'fs': 'fs-browser' // Assuming you have a shim or a mock for fs-browser
    }
  },
  // Or, a more direct approach to remove it
  build: {
    rollupOptions: {
      external: ['fs'],
    },
  },
});