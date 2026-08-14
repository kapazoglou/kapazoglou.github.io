---
module: domino-spots
layer: logic
v: 1.20
date: 2026-08-14
deps: [state, settings, domino-roll, row, star-powers]
---
# Domino Spots

Logic-only relationship between domino combo pool and row columns when `dominoSpots` ON (requires `dominoRoll`).

## Invariant
- **Every live row column** must have a `dominoKey` until sweep
- **New columns this turn** (tray placement / insert / reposition) + **Bugger Singles** lone-outer columns bind from roll **offers**: 1st → **used**, 2nd → **unused** (`dominoColSpotSlot`: 0 | 1)
- **Starting Dice** columns only: pool draw via `startingDominoSpotCols`
- Assignment on **placement/vacate events** — no offer rebind on render (`syncAllRowDominoSpots` repairs starting-cols only)
- Offer slots exhausted when a column needs a key → `dominoSpotAssignmentGameOverReason()` → game over
- Pre-confirm vacate: offer keys **unbind** (slot freed); starting keys **`returnKeyToPool`**
- v1.14 — used die stacked onto unused-slot column → rebind to **used**
- v1.15 — vacate used-slot → promote remaining unused-slot column to **used**
- Sweep: column key → discard → `reshuffleDominoPoolAtSweep`

## Spots
- **Spot col** — any row column with dice/tile while domino spots ON
- **`dominoSpotKeys`** — authoritative col→key map; mirrors `column.dominoKey`
- **Roll offers** (`dominoOfferedKeys`) — tray combo keys drawn at roll; **unassigned** offers discarded on confirm

## Lifecycle
- Reset: `seedStartingDominoSpots()` marks `startingDominoSpotCols` → pool draw per seeded column
- Placement / reposition: `onTrayDiePlaced` / `onSpotColReposition` → `assignDominoForNewColumn` (offer bind)
- Confirm: `settleDominoSpotsOnConfirm` discards offers not bound to `dominoSpotsCreatedThisTurn` cols
- Sweep: `releaseDominoKeysForCols`

## Exports
- `isDominoSpotsActive()`, `getRowDominoSpotCols()`, `getActiveDominoSpotCols()` (alias)
- `ensureDominoSpotForCol(col)`, `syncAllRowDominoSpots()`, `dominoSpotAssignmentGameOverReason()`
- `setDominoOfferedKeys()`, `clearDominoSpotsRollState()`, `clearAllDominoSpotBindings()`, `seedStartingDominoSpots()`
- `onTrayDiePlaced()`, `onColumnVacated()`, `onSpotColReposition()`, `shiftDominoSpotCols()`, `settleDominoSpotsOnConfirm()`, `releaseDominoKeysForCols()`
- `maybeRebindDominoSpotToUsed(col, dieId)` — v1.14 stack rebind
- `syncDominoSpotKeysFromEngagement()` — compat; runs `syncAllRowDominoSpots` only
- `getDominoKeyForCol()`, `getDominoSpotKey()`, `getDominoKeyForDie()`, `isDieFromUsedDomino()`
