---
module: turn
layer: logic
v: 2.4
date: 2026-07-21
deps: [state, settings, dice, tile-deck, confirm-anim, deal-discard-anim]
---
# Turn

`rollDice`, `confirmTurn(onGameOver)`, `resetGame`, `handleRollButton(onGameOver)`, `evaluateGameOver(context)`, `shouldWarnOnLeave()`, `finishRollAfterDiscard(onGameOver)`.

Game over when: `dicePool < nRoll` (idle roll click), deck depleted on cadence deal, or no legal tray/tile placements (fresh roll). Dealt-tile stuck check runs only after N-place dice placed. `canConfirm()` requires `placedThisTurn >= nPlace` and no unplaced `dealtTile`.

`rollDice()` returns `'ok' | 'deck-depleted' | 'discard-anim' | null`.
