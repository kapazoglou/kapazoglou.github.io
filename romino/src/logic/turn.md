---
module: turn
layer: logic
v: 1.9
date: 2026-07-19
deps: [state, settings, dice, confirm-anim]
---
# Turn

`rollDice`, `confirmTurn(onGameOver)`, `resetGame`, `handleRollButton(onGameOver)`, `evaluateGameOver(context)`, `shouldWarnOnLeave()`.

Game over when: `dicePool < nRoll` (idle roll click), or no legal tray placements (fresh roll). `nPlaces` still blocks new columns during play but does not end the game.
