---
module: stars
layer: logic
v: 1.4
date: 2026-07-22
deps: [state, settings, row]
---
# Stars

Detects star-earning die pairs after placement. Horizontal: adjacent columns, same row. Vertical (`verticalStars` ON): adjacent stack rows within one column. Tiles excluded. Value match follows `consecutiveStars` (same value vs ±1 / 1↔6). Requires ≥1 die from the current turn in each pair.

## Exports
- `findStarMatches(newDieIds)` — list of `{ axis: 'h', leftCol, rightCol, row }` or `{ axis: 'v', col, row }`
- `detectAndAddStars(newDieIds)` — increments `state.stars` (legacy; confirm pipeline uses `findStarMatches` directly)
