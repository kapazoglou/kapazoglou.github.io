import { cp, copyFile, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');
const distAssets = join(distDir, 'assets');
const assetsDir = join(root, 'assets');

await copyFile(join(distDir, 'index.dev.html'), join(root, 'index.html'));

for (const name of await readdir(distAssets)) {
  await cp(join(distAssets, name), join(assetsDir, name), { recursive: true, force: true });
}

console.log('GitHub Pages sync: dist/index.html → index.html, dist/assets/* → assets/');
