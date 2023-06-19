import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig(({ command, mode }) => {
  return {
    build: {

      sourcemap: ['serve', 'dev'].includes(command) ? true : false,
      minify: ['serve', 'dev'].includes(command) ? false : false,

      lib: {
        entry: resolve(__dirname, 'src/browser_logger/index.ts'),
        name: 'browser_logger',
        fileName: 'browser_logger',
      },
    },
    plugins: [dts()],
  }
});
