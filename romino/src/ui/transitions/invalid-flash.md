---
module: invalid-flash
layer: ui/transitions
v: 1.2
date: 2026-08-01
deps: [settings, state, dealt-strip.js, render.js]
---
# Invalid Flash

Brief full-viewport red overlay when direct-placement tap/drag hits the row but the move is not allowed. Duration respects `spd()`.

- `flashInvalidPlacement()` — viewport red flash
- `flashStarShortagePlacement()` — viewport flash + `#hud-stars` warning when stars === 0
- `flashDuplicateBlocked(suit, rank)` — viewport flash + 3s warning border on strip or row tile
