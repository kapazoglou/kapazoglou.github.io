---
module: discovery
layer: logic
v: 1.0
date: 2026-07-19
deps: [state]
---
# Discovery

Tracks unique tile identities (suit + rank) discovered on convert. Builds the 4×13 game-over grid (rows Z/X/Y/W, cols suit-only→2–12→A) — same layout as Square v1.

## Exports
- `recordTileDiscovery(tile)` — append unique identity on convert
- `buildDiscoveryGrid(tiles)` — 4×13 cell grid for game-over UI
