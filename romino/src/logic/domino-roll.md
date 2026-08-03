---
module: domino-roll
layer: logic
v: 1.9
date: 2026-08-03
deps: [state, settings, deck-size, game-log]
---
# Domino Roll

Depleting multiset combo pools for `dominoRoll` ON when `nRoll` is 2, 3, or 4. Deck counter (`state.deckRemaining`) starts at list cap (21 pairs / 56 triples); ticks down **once per roll from the 2nd roll onward** (first roll shows full cap) — not on confirm, settle, or pool draws.

## Pools
- **Pairs** — up to 21 combos (`1≤a≤b≤6`); capped by `deckSize` when > 0
- **Triples** — up to 56 combos (`1≤a≤b≤c≤6`); capped by `deckSize` when > 0
- When `deckSize` is 0, full pair/triple universe is used
- Empty pool before nRoll=4 draw → rebuild capped list from top (full reshuffle)
- nRoll=2/3 empty pool → rebuild capped list from top

## Draw behaviour
| nRoll | Draw |
|-------|------|
| 2 | 1 random pair combo |
| 3 | 1 random triple combo |
| 4 (≥2 left) | 2 random pair combos (1 consumed on confirm; unused returned to end of list) |
| 4 (1 left) | last combo + random from fresh shuffle after depletion |
| 4 confirm | unused pair combo pushed to end of list → net −1 per roll |

## nRoll=4 tray lock
- `state.dominoPairGroups` — `[[dieId,dieId],[dieId,dieId]]` after roll
- `state.dominoChosenPairIndex` — `0 | 1 | null`; tracks chosen pair for confirm settle; set on tray die select/drag
- `getDominoEngagedPairIndex()` — dragging → selected → row-placed pair drives lock
- `isDominoPairLocked(dieId)` — other pair inactive while one pair is engaged
- `onDominoDieReturnedToTray(dieId)` — clears selection on tray return; idle unlock when all quad dice in tray

## Exports
- `initDominoPools()`, `clearDominoTrayState()`, `drawDominoRoll(nRoll)`, `settleDominoQuadRoll(placedDieIds)`, `tickDominoDeckOnRoll(nRoll)`, `tickDominoDeckBy(count, nRoll)`, `returnKeyToPool(key)`
- `isDominoQuadRollActive()`, `getDominoPairIndex()`, `setDominoChosenPairFromDie()`, `clearDominoChosenPair()`, `getDominoEngagedPairIndex()`, `syncDominoTrayIdleUnlock()`, `onDominoDieReturnedToTray()`, `isDominoPairLocked()`
