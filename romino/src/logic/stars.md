---
module: stars
layer: logic
v: 1.5
date: 2026-08-10
deps: [state, settings, row]
---
# Stars

Detects star-earning die pairs after placement. Horizontal: adjacent columns, same row. Vertical (`verticalStars` ON): adjacent stack rows within one column. Tiles excluded except `diceAndCubes` ON: horizontal row-0 match between tile `bottomValue` (suit die) and adjacent stack die. Value match follows `consecutiveStars` (same value vs ±1 / 1↔6). Requires ≥1 die from the current turn in each pair (stack side when a tile is involved).

## Exports
- `findStarMatches(newDieIds)` — list of `{ axis: 'h', leftCol, rightCol, row }` or `{ axis: 'v', col, row }`
- `detectAndAddStars(newDieIds)` — increments `state.stars` (legacy; confirm pipeline uses `findStarMatches` directly)
