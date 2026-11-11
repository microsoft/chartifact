import { defineConfig } from 'vite';

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
  entryFileNames: 'chartifact.sandbox.umd.js',
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
      external: ['vega', 'vega-lite', 'css-tree', 'js-yaml'],
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
