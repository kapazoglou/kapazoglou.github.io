---
module: row
layer: logic
v: 1.17
date: 2026-07-20
deps: [state, settings]
---
# Row

Column placement, validity, return-to-bar. `tricolors`: third inner die on two non-matching inner dice → joker stack (one joker per row). `countPlacesInRow()`, `countTilesInRow()`, `countDiceInRow()`, `hasAnyLegalPlacementForTray()`, `gapInsertAnimationsAllowed()` for cap + game-over checks.
