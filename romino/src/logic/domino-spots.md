---
module: domino-spots
layer: logic
v: 1.2
date: 2026-08-03
deps: [state, settings, domino-roll, row]
---
# Domino Spots

Logic-only relationship between offered domino combos and placement when `dominoSpots` ON (requires `dominoRoll`).

## Spots
- **Spot created** — a distinct row column that receives tray dice this turn (`dominoSpotCols`)
- **Spot 1 key (USED)** — engaged pair combo (`dominoUsedKey`); bound to first spot column
- **Spot 2 key (UNUSED)** — other nRoll=4 offer (`dominoUnusedKey`); bound to second spot column when two spots created

## Lifecycle
- Roll: `dominoOfferedKeys` set; deck counter does **not** tick on roll
- First tray die on a column creates a spot; stacks on same column reuse the spot
- Pre-confirm vacate: remove spot col; return that column’s `dominoKey` to pool end
- Confirm: `tickDominoDeckBy(spot count)`; unbound offers → pool end (0 spots → both discarded)
- Sweep: bound `dominoKey` on swept column → pool end

## Exports
- `isDominoSpotsActive()`, `setDominoOfferedKeys()`, `clearDominoSpotsRollState()`, `clearAllDominoSpotBindings()`
- `onTrayDiePlaced()`, `onColumnVacated()`, `settleDominoSpotsOnConfirm()`, `releaseDominoKeysForCols()`
- `getDominoSpotKey()`, `getDominoKeyForCol()`, `getDominoKeyForDie()`, `isDieFromUsedDomino()`
