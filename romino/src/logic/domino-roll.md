---
module: domino-roll
layer: logic
v: 1.14
date: 2026-08-03
deps: [state, settings, deck-size, game-log]
---
# Domino Roll

Depleting multiset combo pools for `dominoRoll` ON when `nRoll` is 2, 3, or 4. Deck counter (`state.deckRemaining`) = draw pool + discard pile + tray offers (excludes locked row spots).

## Pools
- **Pairs** — up to 21 combos (`1≤a≤b≤6`); capped by `deckSize` when > 0
- **Triples** — up to 56 combos (`1≤a≤b≤c≤6`); capped by `deckSize` when > 0
- **Discard** — `dominoPairDiscard` / `dominoTripleDiscard`; swept + unbound-offer keys; merged into pool when draw is short
- When `deckSize` is 0, full pair/triple universe is used
- Full rebuild from universe only on `initDominoPools()` / reset

## Draw behaviour
| nRoll | Draw |
|-------|------|
| 2 | 1 random pair combo |
| 3 | 1 random triple combo |
| 4 | 2 random pair combos |
| Pool too short | Merge discard → shuffle → draw; `null` if still insufficient |

## Settle / discard
- nRoll=4 confirm (no dominoSpots): unused pair → discard
- Vacate pre-confirm (dominoSpots): bound key → pool end via `returnKeyToPool`

## nRoll=4 tray lock
- `state.dominoPairGroups` — `[[dieId,dieId],[dieId,dieId]]` after roll
- `state.dominoChosenPairIndex` — `0 | 1 | null`; tracks chosen pair for confirm settle; set on tray die select/drag
- `getDominoEngagedPairIndex()` — dragging → selected → row-placed pair drives lock
- `isDominoPairLocked(dieId)` — other pair inactive while one pair is engaged
- `onDominoDieReturnedToTray(dieId)` — clears selection on tray return; idle unlock when all quad dice in tray

## Exports
- `initDominoPools()`, `clearDominoTrayState()`, `drawDominoRoll(nRoll)`, `settleDominoQuadRoll(placedDieIds)`, `syncDominoDeckCount(nRoll)`, `syncDominoDeckRemaining(nRoll)`, `setCurrentRollOfferedKeys(keys)`, `discardDominoKey(key)`, `returnKeyToPool(key)`, `parseDominoKey(key)`
- `isDominoQuadRollActive()`, `getDominoPairIndex()`, `setDominoChosenPairFromDie()`, `clearDominoChosenPair()`, `getDominoEngagedPairIndex()`, `syncDominoTrayIdleUnlock()`, `onDominoDieReturnedToTray()`, `isDominoPairLocked()`
