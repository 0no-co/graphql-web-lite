import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      graphql: path.resolve('..', './dist')
    }
  },
  build: {
    outDir: './dist-lite'
  }
});
