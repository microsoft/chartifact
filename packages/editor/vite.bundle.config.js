import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const commonOutputConfig = {
  format: 'umd',
  name: 'Chartifact',
  extend: true,
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'markdown-it': 'markdownit',
    'vega': 'vega',
    'vega-lite': 'vegaLite',
  },
  entryFileNames: 'chartifact.editor.umd.js',
};

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  build: {
    lib: {
      entry: './umd.ts',
    },
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['react', 'react-dom', 'vega', 'vega-lite'],
      output: [
        {
          ...commonOutputConfig,
          dir: './dist/umd',
        },
        {
          ...commonOutputConfig,
          dir: '../../docs/dist/v1',
        },
      ],
    },
  },
});
