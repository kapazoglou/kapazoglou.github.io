---
module: domino-spots
layer: logic
v: 1.24
date: 2026-08-15
deps: [state, settings, domino-roll, row, star-powers]
---
# Domino Spots

Logic-only relationship between domino combo pool and row columns when `dominoSpots` ON (requires `dominoRoll`).

## Invariant
- **Every live row column** must have a `dominoKey` until sweep
- **nRoll=4 + nPlace=2** — both columns bind from roll **offers** (used / unused)
- **nRoll=1 hand** — both columns bind **used offer** from preview (`bindDominoSpotFromOffer(col, 0, { force: true })`); same domino key on two cols allowed this turn; star reroll (no offer) falls back to pool draw; revert on hand switch vacates spot cols
- **nRoll=2 or 3 + nPlace=2** — 1st column = **used offer**; 2nd column = **pool draw**
- **Starting Dice** columns: pool draw via `startingDominoSpotCols`
- **Bugger Singles** lone-outer columns: offer bind when slots free
- Assignment on **placement/vacate events** — no offer rebind on render
- Offer slots exhausted when a column needs a key → `dominoSpotAssignmentGameOverReason()` → game over (**nRoll=1 hand:** deferred while `dominoHandKeys` non-empty)
- Pre-confirm vacate: offer keys **unbind** (slot freed); starting keys **`returnKeyToPool`**
- v1.14 — used die stacked onto unused-slot column → rebind to **used**
- v1.15 — vacate used-slot → promote remaining unused-slot column to **used**
- **Sweep:** column key → **returnKeyToPool** (free; not discard merge)

## Spots
- **Spot col** — any row column with dice/tile while domino spots ON
- **`dominoSpotKeys`** — authoritative col→key map; mirrors `column.dominoKey`
- **Roll offers** (`dominoOfferedKeys`) — tray combo keys drawn at roll; **unassigned** offers → discard pile on confirm

## Lifecycle
- Reset: `seedStartingDominoSpots()` marks `startingDominoSpotCols` → pool draw per seeded column
- Placement / reposition: `onTrayDiePlaced` / `onSpotColReposition` → `assignDominoForNewColumn`
- Confirm: `settleDominoSpotsOnConfirm` discards offers not bound to columns this turn
- Sweep: `releaseDominoKeysForCols` → `returnKeyToPool`

## Exports
- `isDominoSpotsActive()`, `getRowDominoSpotCols()`, `getActiveDominoSpotCols()` (alias)
- `ensureDominoSpotForCol(col)`, `syncAllRowDominoSpots()`, `dominoSpotAssignmentGameOverReason()`
- `setDominoOfferedKeys()`, `clearDominoSpotsRollState()`, `clearAllDominoSpotBindings()`, `seedStartingDominoSpots()`
- `onTrayDiePlaced()`, `onColumnVacated()`, `onSpotColReposition()`, `shiftDominoSpotCols()`, `settleDominoSpotsOnConfirm()`, `releaseDominoKeysForCols()`
- `maybeRebindDominoSpotToUsed(col, dieId)` — v1.14 stack rebind
- `syncDominoSpotKeysFromEngagement()` — compat; runs `syncAllRowDominoSpots` only
- `getDominoKeyForCol()`, `getDominoSpotKey()`, `getDominoKeyForDie()`, `isDieFromUsedDomino()`
