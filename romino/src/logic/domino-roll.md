---
module: domino-roll
layer: logic
v: 1.5
date: 2026-08-01
deps: [state, settings, deck-size, game-log]
---
# Domino Roll

Depleting multiset combo pools for `dominoRoll` ON when `nRoll` is 2, 3, or 4. HUD deck counter (`state.deckRemaining`) ticks down **once per roll-button roll** — not on confirm, settle, or pool draws.

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
- `state.dominoChosenPairIndex` — `0 | 1 | null`; set on tray die select, cleared on deselect
- `isDominoPairLocked(dieId)` — other pair inactive until deselect

## Exports
- `initDominoPools()`, `clearDominoTrayState()`, `drawDominoRoll(nRoll)`, `settleDominoQuadRoll(placedDieIds)`, `tickDominoDeckOnRoll(nRoll)`
- `isDominoQuadRollActive()`, `getDominoPairIndex()`, `setDominoChosenPairFromDie()`, `clearDominoChosenPair()`, `isDominoPairLocked()`
