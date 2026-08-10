---
module: domino-roll
layer: logic
v: 1.29
date: 2026-08-10
deps: [state, settings, deck-size, game-log]
---
# Domino Roll

Depleting multiset combo pools for `dominoRoll` ON when `nRoll` is 2, 3, or 4.

**Domino Spots ON** — deck counter = active draw pool only; pools always 21/56; discard returns on sweep only.

**Seam-strip badge** (nRoll=4 or nRoll=2 + nPlace=2) — pool-only count; ticks down on **roll-button** pool draw only (not star-pay redraw); red below 2.

**Domino Spots OFF** (HUD badge only) — deck counter = pool + discard + tray offers; pools capped by `deckSize` when > 0; short draw merges discard into pool.

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
| Pool too short | Domino Spots OFF: merge discard → shuffle → draw; full pool rebuild if still insufficient (no game over). Domino Spots ON: no merge on draw — `null` when active pool insufficient (discard returns on sweep) |

## Settle / discard
- nRoll 2/3 confirm (no dominoSpots): offered combo → discard
- nRoll=4 confirm (no dominoSpots): unused pair → discard
- Vacate pre-confirm (dominoSpots): unbind column only; roll offers persist until confirm

## nRoll=2 domino pair tray
- Seamless pair (0 gap) on initial roll offer only (`isDominoPairTraySeamless()`); after star-pay redraw, normal 20px gap
- Star-pay: discard offered combo → two random tray dice; **no pool draw** (deck counter unchanged); once per roll
- `canApplyDominoPairReroll()`, `canShowDominoPairReroll()`, `discardOfferedDominoKeys()`
- `isDominoPairRollTray()`, `isDominoPairTraySeamless()`

## nRoll=4 tray lock
- `state.dominoPairGroups` — `[[dieId,dieId],[dieId,dieId]]` after roll
- `state.dominoChosenPairIndex` — `0 | 1 | null`; tracks chosen pair for confirm settle; set on tray die select/drag
- `getDominoEngagedPairIndex()` — dragging → selected → row-placed pair drives lock
- `isDominoPairLocked(dieId)` — other pair inactive while one pair is engaged
- `onDominoDieReturnedToTray(dieId)` — clears selection on tray return; idle unlock when all quad dice in tray

## Exports
- `initDominoPools()`, `clearDominoTrayState()`, `drawDominoRoll(nRoll)`, `canDrawDominoRoll(nRoll)`, `settleDominoRollOnConfirm()`, `settleDominoQuadRoll(placedDieIds)`, `syncDominoDeckCount(nRoll)`, `syncDominoDeckRemaining(nRoll)`, `setCurrentRollOfferedKeys(keys)`, `discardDominoKey(key)`, `returnKeyToPool(key)`, `reshuffleDominoPoolAtSweep(nRoll)`, `parseDominoKey(key)`, `getDominoDiscardKeys(nRoll)`
- `canApplyDominoPairReroll()`, `canShowDominoPairReroll()`, `discardOfferedDominoKeys()`
- `isDominoPairRollTray()`, `isDominoPairTraySeamless()`
- `isDominoQuadRollActive()`, `getDominoPairIndex()`, `setDominoChosenPairFromDie()`, `clearDominoChosenPair()`, `getDominoEngagedPairIndex()`, `syncDominoTrayIdleUnlock()`, `onDominoDieReturnedToTray()`, `isDominoPairLocked()`
