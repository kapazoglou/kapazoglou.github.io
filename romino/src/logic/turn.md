---
module: turn
layer: logic
v: 2.5
date: 2026-07-23
deps: [state, settings, dice, tile-deck, confirm-anim, deal-discard-anim]
---
# Turn

`rollDice`, `confirmTurn(onGameOver)`, `resetGame`, `initialStarCount()`, `handleRollButton(onGameOver)`, `evaluateGameOver(context)`, `shouldWarnOnLeave()`, `finishRollAfterDiscard(onGameOver)`.

`resetGame()` sets `state.stars` to `nPlace` when `rerollOuter` ON, else 0.

Game over when: `dicePool < nRoll` (idle roll click), deck depleted on cadence deal, or no legal tray/tile placements (fresh roll). Dealt-tile stuck check runs only after N-place dice placed. `canConfirm()` requires `placedThisTurn >= nPlace` and no unplaced `dealtTile`.

`rollDice()` returns `'ok' | 'deck-depleted' | 'discard-anim' | null`.
