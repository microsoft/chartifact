import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
        popup: resolve(__dirname, 'src/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      },
      external: [
        '@microsoft/chartifact-sandbox',
        '@microsoft/chartifact-compiler'
      ]
    },
    target: 'es2020',
    minify: false, // Keep readable for debugging
    sourcemap: false
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});