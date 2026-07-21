---
module: row
layer: logic
v: 1.30
date: 2026-07-21
deps: [state, settings]
---
# Row

Column placement, validity, return-to-bar. `getValidSlotsForDealtTile()`, `getDealtTileForPlacement()`, `placeDealtTile()`, `isDicePlacementComplete()` / `isDealtTileInactive()` (inactive until N-place; active chrome even when row cap blocks placement), `canPlaceDealtTile()`, `liftDealtTileForReposition()`, `isPlacedDealtTileCol()`. Placed-this-turn dealt tile: valid slots exclude its column (reposition before confirm); N-spots cap bypassed while repositioning. Unplaced dealt tile counts toward N-spots (not N-place). `passesNoDuplicateTile` blocks forming pending `dealtTile` identity via dice convert. Ace/joker stack completion requires one star per convert (`passesStarCostForStackCompletion`); `isStarBlockedPlacement()` for star-shortage flash UX.
