---
module: tile-deck
layer: logic
v: 1.0
date: 2026-07-21
deps: [state.js, settings.js, dice-visual.js]
---
# Tile deck

Finite 48/52 tile deck for `tileDealtEvery` cadence deals.

- `buildFullDeck(tricolors)` — 4 suits × (A + ranks 2–12 [+ `*` when tricolors])
- `initTileDeck()` — shuffle into `state.tileDeckRemaining`
- `resolveCadenceDeal({ chainDraw })` — draw without replacement; duplicate-on-row discards; chain redraw when toggle on
- `isDuplicateOnRow(tile)` — `(suit, rank)` already on row
