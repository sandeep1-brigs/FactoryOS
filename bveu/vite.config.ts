import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: ['@capacitor-community/barcode-scanner']
    }

  },
  server: {
    host: '0.0.0.0',
  }
});
