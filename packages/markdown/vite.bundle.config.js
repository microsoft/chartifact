import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const commonOutputConfig = {
  format: 'umd',
  name: 'Chartifact',
  extend: true,
  globals: {
    'markdown-it': 'markdownit',
    'vega': 'vega',
    'vega-lite': 'vegaLite',
    'css-tree': 'csstree',
    'js-yaml': 'jsyaml',
  },
  entryFileNames: 'chartifact.markdown.umd.js',
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
      external: ['markdown-it', 'vega', 'vega-lite', 'tabulator-tables', 'css-tree', 'mermaid', 'js-yaml'],
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
