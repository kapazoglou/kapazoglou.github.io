# romino

Phone-first dice puzzle — [play](https://kapazoglou.github.io/romino/).

## Local dev

```bash
npm install
npm run dev
```

Opens `index.dev.html` at http://127.0.0.1:5173/

## Deploy

**Push source via GitHub Desktop** — CI builds and deploys the site.

GitHub Actions (`.github/workflows/deploy-pages.yml`) runs Vite on push to `master`, bundles `manifest.json` imports into JS (fixes the Pages MIME error), builds Jekyll, and deploys.

**One-time setup:** GitHub repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Optional local production preview: `npm run build:pages` (writes `index.html` + hashed assets — not required for deploy).
