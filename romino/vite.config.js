import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Dev: `/` serves production index.html; send root to index.dev.html instead. */
function devRootPlugin() {
  return {
    name: 'dev-root-to-index-dev',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') req.url = '/index.dev.html';
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/romino/',
  plugins: command === 'serve' ? [devRootPlugin()] : [],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: resolve(root, 'index.dev.html'),
    },
  },
}));
