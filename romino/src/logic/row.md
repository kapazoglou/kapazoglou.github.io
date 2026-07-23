---
module: row
layer: logic
v: 1.34
date: 2026-07-23
deps: [state, settings]
---
# Row

Column placement, validity, return-to-bar. Stack removal/reposition: only the topmost die (`isTopDieInStack`, respects `stackBottomUp`). `getValidSlotsForDealtTile()`, `getDealtTileForPlacement()`, `getPlacedDealtTileCol()`, `placeDealtTile()`, `clearDealtThisTurnFlags()`, `isDicePlacementComplete()` / `isDealtTileInactive()` (inactive until N-place; active chrome even when row cap blocks placement), `canPlaceDealtTile()`, `liftDealtTileForReposition()`, `isPlacedDealtTileCol()`. Placed-this-turn dealt tile: `dealtThisTurn` column flag (survives column shifts); valid slots exclude its column (reposition before confirm); N-spots cap bypassed while repositioning; reposition allowed even if dice returned to bar. Unplaced dealt tile counts toward N-spots (not N-place). `passesNoDuplicateTile` blocks forming pending `dealtTile` identity via dice convert. Ace/joker stack completion requires one star per convert when `aceJokerStarCost` ON (`passesStarCostForStackCompletion`); `isStarBlockedPlacement()` for star-shortage flash UX.
