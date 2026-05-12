import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commonOutputConfig = {
  format: 'umd',
  name: 'Chartifact',
  extend: true,
  globals: {
    'vega': 'vega',
    'vega-lite': 'vegaLite',
  },
  entryFileNames: 'chartifact.host.umd.js',
};

export default defineConfig({
  resolve: {
    alias: [
      // The MCP SDK's server pulls in an ajv-based JSON Schema validator that does not bundle cleanly
      // for browsers (ajv interop issue under rollup-plugin-commonjs). We use zod schemas via
      // McpServer.tool(), so the ajv validator is never executed at runtime — safe to stub out.
      {
        find: /.*\/validation\/ajv-provider\.js$/,
        replacement: path.resolve(__dirname, './src/ajv-provider-stub.js'),
      },
    ],
  },
  build: {
    lib: {
      entry: './umd.ts',
    },
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['vega', 'vega-lite'],
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
        commonjs({   // Converts CommonJS to ES6
          transformMixedEsModules: true,
          defaultIsModuleExports: true,
          requireReturnsDefault: 'auto',
        }),
      ],
    },
  },
});
