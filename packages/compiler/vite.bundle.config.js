import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const commonOutputConfig = {
  format: 'umd',
  name: 'Chartifact',
  extend: true,
  globals: {
    'vega': 'vega',
    'vega-lite': 'vegaLite',
    'js-yaml': 'jsyaml',
  },
  entryFileNames: 'chartifact.compiler.umd.js',
};

export default defineConfig({
  build: {
    lib: {
      entry: './umd.ts',
    },
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['vega', 'vega-lite', 'js-yaml'],
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
      plugins: [
        resolve(),   // Resolves Node modules
        commonjs(),  // Converts CommonJS to ES6
      ],
    },
  },
});
