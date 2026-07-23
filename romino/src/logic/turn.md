---
module: turn
layer: logic
v: 2.6
date: 2026-07-23
deps: [state, settings, dice, tile-deck, confirm-anim, deal-discard-anim]
---
# Turn

`rollDice`, `confirmTurn(onGameOver)`, `resetGame`, `initialStarCount()`, `handleRollButton(onGameOver)`, `evaluateGameOver(context)`, `shouldWarnOnLeave()`, `finishRollAfterDiscard(onGameOver)`.

Game over when: `dicePool < nRoll` (idle roll click), deck depleted on cadence deal, or no legal dealt-tile placements after N-place (auto). Tray stuck: warning-red roll border; tap roll opens game over (`isTrayStuck` in row.js). Dealt-tile stuck check runs only after N-place dice placed. `canConfirm()` requires `placedThisTurn >= nPlace` and no unplaced `dealtTile`.

`resetGame()` sets `state.stars` to `nPlace` when `rerollOuter` ON, else 0.

`rollDice()` returns `'ok' | 'deck-depleted' | 'discard-anim' | null`.
