import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/brady-runs/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true
  }
});
