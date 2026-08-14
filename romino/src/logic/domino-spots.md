---
module: domino-spots
layer: logic
v: 1.19
date: 2026-08-14
deps: [state, settings, domino-roll, row]
---
# Domino Spots

Logic-only relationship between domino combo pool and row columns when `dominoSpots` ON (requires `dominoRoll`).

## Invariant
- **Every live row column** (`state.row` stack or tile) **must** have a pool-drawn `dominoKey` until sweep
- Assignment via `ensureDominoSpotForCol` / `syncAllRowDominoSpots` — **no roll-offer rebind on render**
- Pool empty when a column needs a key → `dominoSpotAssignmentGameOverReason()` → game over
- Column vacated (pre-confirm return): key **`returnKeyToPool`** (not orphaned)
- Sweep: key → discard → `reshuffleDominoPoolAtSweep`

## Spots
- **Spot col** — any row column with dice/tile while domino spots ON
- **`dominoSpotKeys`** — authoritative col→key map; mirrors `column.dominoKey`
- **Roll offers** (`dominoOfferedKeys`) — tray combo keys only; all discarded on confirm (separate from column keys)

## Lifecycle
- Reset: `seedStartingDominoSpots()` → `syncAllRowDominoSpots()` for starting-dice columns
- Placement / reposition: `onTrayDiePlaced` / `onSpotColReposition` → `ensureDominoSpotForCol`
- Confirm: discard all tray offers; column keys persist
- Sweep: `releaseDominoKeysForCols`

## Exports
- `isDominoSpotsActive()`, `getRowDominoSpotCols()`, `getActiveDominoSpotCols()` (alias)
- `ensureDominoSpotForCol(col)`, `syncAllRowDominoSpots()`, `dominoSpotAssignmentGameOverReason()`
- `setDominoOfferedKeys()`, `clearDominoSpotsRollState()`, `clearAllDominoSpotBindings()`, `seedStartingDominoSpots()`
- `onTrayDiePlaced()`, `onColumnVacated()`, `onSpotColReposition()`, `shiftDominoSpotCols()`, `settleDominoSpotsOnConfirm()`, `releaseDominoKeysForCols()`
- `syncDominoSpotKeysFromEngagement()` — compat; runs `syncAllRowDominoSpots` only
- `getDominoKeyForCol()`, `getDominoSpotKey()`, `getDominoKeyForDie()`, `isDieFromUsedDomino()`
