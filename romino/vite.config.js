import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/romino/',
  build: {
    rollupOptions: {
      input: resolve(root, 'index.dev.html'),
    },
  },
});
