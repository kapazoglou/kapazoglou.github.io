---
module: stars
layer: logic
v: 1.9
date: 2026-08-14
deps: [state, settings, row]
---
# Stars

Detects star-earning die pairs after placement. Horizontal: adjacent columns, same row. Vertical (`verticalStars` ON): adjacent stack rows within one column. Tiles excluded except `diceAndCubes` ON: horizontal row-0 match between tile `bottomValue` (suit die) and adjacent stack die. Value match follows `consecutiveStars` (same value vs ±1 / 1↔6). Requires ≥1 eligible die per pair: tray placements this turn (push-below tray commits excluded when `pushSwapStars` OFF). When OFF, any paid swap column is fully muted — no stars even for this-turn dice in that stack; push columns still allow normal tray placements but block push-settled partners.

## Exports
- `getStarEligibleDieIds()` — placed dice; + full stacks in push-below / swap columns when `pushSwapStars` ON
- `findStarMatches(newDieIds)` — list of `{ axis: 'h', leftCol, rightCol, row }` or `{ axis: 'v', col, row }`
- `detectAndAddStars(newDieIds)` — increments `state.stars` (legacy; confirm pipeline uses `findStarMatches` directly)
