---
module: row
layer: logic
v: 1.19
date: 2026-07-20
deps: [state, settings]
---
# Row

Column placement, validity, return-to-bar. `tricolors`: third inner die on two non-matching inner dice → joker stack (one joker per row + one joker per suit per game). `countPlacesInRow()`, `countTilesInRow()`, `countDiceInRow()`, `hasAnyLegalPlacementForTray()`, `gapInsertAnimationsAllowed()` for cap + game-over checks.
