import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig(({ command, mode }) => {
  return {
    build: {

      sourcemap: ['serve', 'dev'].includes(command) ? true : false,
      minify: ['serve', 'dev'].includes(command) ? false : true,

      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'browser_logger',
        fileName: 'browser_logger',
      },
    },
    plugins: [
      dts(),

      nodePolyfills({
        // To exclude specific polyfills, add them to this list.
        exclude: [
          'fs', // Excludes the polyfill for `fs` and `node:fs`.
        ],
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true, // can also be 'build', 'dev', or false
          // global: true,
          // process: true,
        },
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      })

    ],
  }
});
