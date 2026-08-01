---
module: tile-deck
layer: logic
v: 1.1
date: 2026-08-01
deps: [state.js, settings.js, dice-visual.js]
---
# Tile deck

Finite 48/52 tile deck for `tileDealtEvery` cadence deals.

- `buildFullDeck(tricolors)` — 4 suits × (A + ranks 2–12 [+ `*` when tricolors])
- `initTileDeck()` — shuffle into `state.tileDeckRemaining`
- `resolveCadenceDeal()` — draw one tile without replacement; `{ tile, deckDepleted }`
- `drawFromDeck()` — random splice from remaining keys
