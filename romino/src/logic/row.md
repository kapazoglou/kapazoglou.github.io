---
module: row
layer: logic
v: 1.20
date: 2026-07-20
deps: [state, settings]
---
# Row

Column placement, validity, return-to-bar. `tricolors`: three distinct inner dice (2–5) → joker (suit = missing inner die). `tricolorSevens` (requires Tricolors): second + third must sum to 7; suit = bottom die. One joker per row + one joker per suit per game. `countPlacesInRow()`, `countTilesInRow()`, `countDiceInRow()`, `hasAnyLegalPlacementForTray()`, `gapInsertAnimationsAllowed()` for cap + game-over checks.
