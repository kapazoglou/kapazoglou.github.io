---
module: domino-spots
layer: logic
v: 1.15
date: 2026-08-03
deps: [state, settings, domino-roll, row]
---
# Domino Spots

Logic-only relationship between offered domino combos and placement when `dominoSpots` ON (requires `dominoRoll`).

## Spots
- **Spot created** — a distinct row column that receives tray dice (`dominoSpotCols`); persists across confirms until sweep
- **Spot this turn** — cols that gained a spot this roll cycle (`dominoSpotsCreatedThisTurn`)
- **Spot 1 key (USED)** — engaged/selected pair combo at spot creation; rebinding only fills unbound this-turn spots
- **Spot 2 key (UNUSED)** — other nRoll=4 offer (`dominoUnusedKey`); bound to second spot column this turn when two spots created
- **Locked binding** — once a column has `dominoKey`, it never changes — except when the used-spot column vacates (tray return or stack onto unused-spot col): remaining unused-spot column rebinds to USED
- **`dominoSpotKeys`** — authoritative col→key map until sweep; survives column recreate, convert, reposition

## Lifecycle
- Roll: `dominoOfferedKeys` set; persistent spot cols + seam dominoes unchanged
- First tray die on a column creates a spot and binds domino; further dice on same column reuse spot (domino locked)
- Pre-confirm vacate: remove spot col; unbind column `dominoKey`; roll offers unchanged until confirm
- Reposition: spot col moves; persistent spots transfer `dominoKey`; merge onto existing spot keeps target key unless vacated col had USED (remaining unused-spot col promotes to USED)
- Gap insert remaps cols via `shiftDominoSpotCols`
- Confirm: unbound offers → discard; spot cols + column `dominoKey` persist
- Sweep: bound `dominoKey` on swept column → discard; spot col removed

## Exports
- `isDominoSpotsActive()`, `setDominoOfferedKeys()`, `clearDominoSpotsRollState()`, `clearAllDominoSpotBindings()`
- `onTrayDiePlaced()`, `onColumnVacated()`, `onSpotColReposition()`, `shiftDominoSpotCols()`, `settleDominoSpotsOnConfirm()`, `releaseDominoKeysForCols()`
- `syncDominoSpotKeysFromEngagement()`, `getActiveDominoSpotCols()`, `getDominoSpotKey()`, `getDominoKeyForCol()`, `getDominoKeyForDie()`, `isDieFromUsedDomino()`
