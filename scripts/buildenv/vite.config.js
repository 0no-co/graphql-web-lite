import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  rollupOutputOptions: {
    chunkFileNames: '[name].js',
    entryFileNames: '[name].js',
  },
  build: {
    outDir: './dist-graphql',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
