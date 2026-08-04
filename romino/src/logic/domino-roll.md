---
module: domino-roll
layer: logic
v: 1.20
date: 2026-08-04
deps: [state, settings, deck-size, game-log]
---
# Domino Roll

Depleting multiset combo pools for `dominoRoll` ON when `nRoll` is 2, 3, or 4.

**Domino Spots ON** — deck counter = active draw pool only; pools always 21/56; discard returns on sweep only.

**Domino Spots OFF** — deck counter = pool + discard + tray offers; pools capped by `deckSize` when > 0; short draw merges discard into pool.

## Pools
- **Pairs** — 21 combos (`1≤a≤b≤6`); capped by `deckSize` when > 0 and Domino Spots OFF
- **Triples** — 56 combos (`1≤a≤b≤c≤6`); capped by `deckSize` when > 0 and Domino Spots OFF
- **Discard** — `dominoPairDiscard` / `dominoTripleDiscard`; swept + unbound-offer keys; merged into pool when draw is short (Domino Spots OFF), or on sweep when `dominoSpots` ON
- Full rebuild from universe only on `initDominoPools()` / reset

## Draw behaviour
| nRoll | Draw |
|-------|------|
| 2 | 1 random pair combo |
| 3 | 1 random triple combo |
| 4 | 2 random pair combos |
| Pool too short | Domino Spots OFF: merge discard → shuffle → draw; `null` if still insufficient. Domino Spots ON: no merge on draw — `null` when active pool insufficient (discard returns on sweep) |

## Settle / discard
- nRoll=4 confirm (no dominoSpots): unused pair → discard
- Vacate pre-confirm (dominoSpots): unbind column only; roll offers persist until confirm

## nRoll=4 tray lock
- `state.dominoPairGroups` — `[[dieId,dieId],[dieId,dieId]]` after roll
- `state.dominoChosenPairIndex` — `0 | 1 | null`; tracks chosen pair for confirm settle; set on tray die select/drag
- `getDominoEngagedPairIndex()` — dragging → selected → row-placed pair drives lock
- `isDominoPairLocked(dieId)` — other pair inactive while one pair is engaged
- `onDominoDieReturnedToTray(dieId)` — clears selection on tray return; idle unlock when all quad dice in tray

## Exports
- `initDominoPools()`, `clearDominoTrayState()`, `drawDominoRoll(nRoll)`, `canDrawDominoRoll(nRoll)`, `settleDominoQuadRoll(placedDieIds)`, `syncDominoDeckCount(nRoll)`, `syncDominoDeckRemaining(nRoll)`, `setCurrentRollOfferedKeys(keys)`, `discardDominoKey(key)`, `returnKeyToPool(key)`, `reshuffleDominoPoolAtSweep(nRoll)`, `parseDominoKey(key)`, `getDominoDiscardKeys(nRoll)`
- `isDominoQuadRollActive()`, `getDominoPairIndex()`, `setDominoChosenPairFromDie()`, `clearDominoChosenPair()`, `getDominoEngagedPairIndex()`, `syncDominoTrayIdleUnlock()`, `onDominoDieReturnedToTray()`, `isDominoPairLocked()`
