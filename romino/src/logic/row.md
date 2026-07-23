---
module: row
layer: logic
v: 1.39
date: 2026-07-23
deps: [state, settings]
---
# Row

Column placement, validity, return-to-bar. Jokers: `rowHasJoker` — at most one committed joker (tile or full tricolor stack) on the row at a time; spent-suit full stacks do not count; 2-dice stacks no longer gate other columns (`jokerSuitBlocked` still blocks same suit). `jokerSuitsUsed` / `jokerSuitBlocked` — at most one joker per suit per game. `isAtSpotCap()` — row columns plus unplaced dealt tile at `nSpots`. `isTrayStuck()` — active bar dice remain but none have a legal slot. Stack removal/reposition: only the topmost die (`isTopDieInStack`, respects `stackBottomUp`). `getValidSlotsForDealtTile()`, `getDealtTileForPlacement()`, `getPlacedDealtTileCol()`, `placeDealtTile()`, `clearDealtThisTurnFlags()`, `isDicePlacementComplete()` / `isDealtTileInactive()` (inactive until N-place; active chrome even when row cap blocks placement), `canPlaceDealtTile()`, `liftDealtTileForReposition()`, `isPlacedDealtTileCol()`. Placed-this-turn dealt tile: `dealtThisTurn` column flag (survives column shifts); valid slots exclude its column (reposition before confirm); N-spots cap bypassed while repositioning; reposition allowed even if dice returned to bar. Unplaced dealt tile counts toward N-spots (not N-place). `passesNoDuplicateTile` blocks forming pending `dealtTile` identity via dice convert. Ace/joker stack completion requires one star per convert when `aceJokerStarCost` ON (`passesStarCostForStackCompletion`); `isStarBlockedPlacement()` for star-shortage flash UX.
