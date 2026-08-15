---
module: domino-roll
layer: logic
v: 1.38
date: 2026-08-15
deps: [state, settings, deck-size, game-log]
---
# Domino Roll

Depleting multiset combo pools for `dominoRoll` ON when `nRoll` is 1, 2, 3, or 4.

**nRoll=1 hand** — deal 7 pair keys into `dominoHandKeys` (discard-row UI); **preview-on-select**: tap spawns pair tray immediately (`phase = rolled`); domino stays in hand until lock; switch domino → `revertHandPreviewTurn()`; **both dice on row** (`DOMINO_HAND_DICE_PLACE = 2`, empty tray) before confirm; roll button **lock + confirm** in one tap (debits pool on confirm); star reroll discards domino + locks hand (`dominoHandLocked`); then place both → confirm only; no idle roll; +1 hand refill on confirm; discards hidden; **Spots ON:** KO only when hand empty and pool cannot draw/refill (`isDominoHandAndPoolExhausted()`).

**Hand placement quota** — `dominoHandDicePlaceQuota()` returns 2 in hand mode (one domino per turn, not `settings.nPlace`).

**Both modes** — deck counter = active draw pool only; `dominoReshufflesRemaining` = 3 per game; reshuffle dots when domino roll countdown active.

**Domino Spots ON** — seam binding variant; pools always 21/56; sweep returns keys to pool (free); charged reshuffle merges discard when draw/assignment short.

**Domino Spots OFF** — tray combos only, no seam binding; charged reshuffle merges discard then full rebuild if still short.

**Seam-strip badge** (nRoll=4 or nRoll=2 + nPlace=2) — pool-only count; ticks down on roll-button pool draw only (not star-pay redraw); red below 2.

## Pools
- **Pairs** — 21 combos (`1≤a≤b≤6`); capped by `deckSize` when > 0 and Domino Spots OFF
- **Triples** — 56 combos (`1≤a≤b≤c≤6`); capped by `deckSize` when > 0 and Domino Spots OFF
- **Discard** — unassigned offers + confirm discards (Spots ON); Spots OFF confirm discards; charged reshuffle merges discard into pool
- Full rebuild from universe on init and on Spots OFF charged reshuffle when still too short

## Draw behaviour
| nRoll | Draw |
|-------|------|
| 1 | Hand preview: tap → known pair tray; lock on confirm (or star reroll); +1 pool draw on confirm |
| 2 | 1 random pair combo |
| 3 | 1 random triple combo |
| 4 | 2 random pair combos |
| Pool too short | Charged reshuffle (3/game): merge discard + shuffle; Spots OFF may full rebuild; 0 charges → draw blocked / game over |

## Settle / discard
- nRoll 2/3 confirm (no dominoSpots): offered combo → discard
- nRoll=4 confirm (no dominoSpots): unused pair → discard
- Vacate pre-confirm (dominoSpots): unbind column only; roll offers persist until confirm

## nRoll=1 hand preview
- `previewHandDomino(i)` — spawn tray pair; set `dominoOfferedKeys`; domino remains in `dominoHandKeys` until lock
- `revertHandPreviewTurn()` — purge preview row placements + spot vacate; clear tray preview dice
- `lockHandDomino()` — splice preview key from hand; set `dominoHandCommittedKey`; `dominoHandLocked = true`
- `dominoHandBothDicePlaced()`, `isDominoHandPreviewActive()`, `isDominoHandLocked()`, `clearHandPreviewState()`
- Star reroll: `discardOfferedDominoKeys()` removes preview domino from hand; `dominoHandLocked = true`
- `selectDominoHandIndex()` — alias to `previewHandDomino`

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
- `DOMINO_HAND_SIZE`, `DOMINO_HAND_DICE_PLACE`, `isDominoHandMode()`, `isDominoHandPlayable()`, `isDominoHandAndPoolExhausted()`, `initDominoHand()`, `previewHandDomino()`, `revertHandPreviewTurn()`, `lockHandDomino()`, `dominoHandDicePlaceQuota()`, `dominoHandBothDicePlaced()`, `isDominoHandPreviewActive()`, `isDominoHandLocked()`, `selectDominoHandIndex()`, `hasDominoHandSelection()`, `refillDominoHandOne()`, `clearHandPreviewState()`
- `DOMINO_RESHUFFLE_MAX`, `showDominoReshuffleDots()`
- `initDominoPools()`, `clearDominoTrayState()`, `drawDominoRoll(nRoll)`, `drawDominoKeyFromPool(nRoll)`, `canDrawDominoRoll(nRoll)`, `canDrawDominoKeyFromPool(nRoll)`, `settleDominoRollOnConfirm()`, `settleDominoQuadRoll(placedDieIds)`, `syncDominoDeckCount(nRoll)`, `syncDominoDeckRemaining(nRoll)`, `setCurrentRollOfferedKeys(keys)`, `discardDominoKey(key)`, `returnKeyToPool(key)`, `reshuffleDominoPoolAtSweep(nRoll)` (deprecated no-op), `parseDominoKey(key)`, `getDominoDiscardKeys(nRoll)`
- `canApplyDominoPairReroll()`, `canShowDominoPairReroll()`, `discardOfferedDominoKeys()`
- `isDominoPairRollTray()`, `isDominoPairTraySeamless()`
- `isDominoQuadRollActive()`, `getDominoPairIndex()`, `setDominoChosenPairFromDie()`, `clearDominoChosenPair()`, `getDominoEngagedPairIndex()`, `syncDominoTrayIdleUnlock()`, `onDominoDieReturnedToTray()`, `isDominoPairLocked()`
