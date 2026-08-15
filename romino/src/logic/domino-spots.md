---
module: domino-spots
layer: logic
v: 1.33
date: 2026-08-15
deps: [state, settings, domino-roll, row, star-powers]
---
# Domino Spots

Logic-only relationship between domino combo pool and row columns when `dominoSpots` ON (requires `dominoRoll`).

## Invariant
- **Every live row column** must have a `dominoKey` until sweep
- **nRoll=4 + nPlace=2** — both columns bind from roll **offers** (used / unused)
- **nRoll=1 hand** — 1st column = **used offer** (selected domino preview); 2nd column = **pool draw**; star reroll → spot 0 = **reserved offer** (not discarded until confirm); spot 1 = pool draw; discard reserved on confirm if 0 new cols; revert on hand switch vacates spot cols
- **Settled columns** — confirmed prior-turn cols keep `dominoKey` until sweep; new dice (place/move/stack/return) must never rebind them; turn slot metadata cleared on confirm
- **Invariant** — exactly one **this-turn** spot col → **used** domino on seam; pool reserve unbinds to `dominoUnusedKey` (incl. reposition col→col merge, return-to-bar); confirmed prior-turn cols excluded
- **Starting Dice** columns: pool draw via `startingDominoSpotCols`
- **Bugger Singles** lone-outer columns: offer bind when slots free
- Assignment on **placement/vacate events** — no offer rebind on render
- Offer slots exhausted when a column needs a key → `dominoSpotAssignmentGameOverReason()` → game over (**nRoll=1 hand:** deferred while `dominoHandKeys` non-empty)
- Pre-confirm vacate: offer keys **unbind**; pool reserve cached in **`dominoUnusedKey`**; **col→slot remembered** in `dominoColVacatedSlot` for same-col re-place; starting keys **`returnKeyToPool`**
- v1.14 stack rebind → **used** — nRoll=4: unused offer promoted; nRoll 1/2/3: pool reserve unbinds to `dominoUnusedKey`, column shows used only
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
- Confirm: `settleDominoSpotsOnConfirm` discards unassigned **offers**; unassigned turn **pool reserve** → `returnKeyToPool`; assigned keys from live `dominoColSpotSlot` cols
- Sweep: `releaseDominoKeysForCols` → `returnKeyToPool`

## Exports
- `isDominoSpotsActive()`, `getRowDominoSpotCols()`, `getActiveDominoSpotCols()` (alias)
- `ensureDominoSpotForCol(col)`, `syncAllRowDominoSpots()`, `dominoSpotAssignmentGameOverReason()`
- `setDominoOfferedKeys()`, `clearDominoSpotsRollState()`, `clearAllDominoSpotBindings()`, `seedStartingDominoSpots()`
- `onTrayDiePlaced()`, `onColumnVacated()`, `onSpotColReposition()`, `shiftDominoSpotCols()`, `settleDominoSpotsOnConfirm()`, `releaseDominoKeysForCols()`
- `maybeRebindDominoSpotToUsed(col, dieId)` — v1.14 stack rebind
- `syncDominoSpotInvariants()` — post-placement single-column used rule
- `syncDominoSpotKeysFromEngagement()` — compat; runs `syncAllRowDominoSpots` only
- `getDominoKeyForCol()`, `getDominoSpotKey()`, `getDominoKeyForDie()`, `isDieFromUsedDomino()`
