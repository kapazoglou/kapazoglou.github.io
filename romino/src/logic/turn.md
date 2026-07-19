---
module: turn
layer: logic
v: 1.6
date: 2026-07-19
deps: [state, settings, dice, confirm-anim]
---
# Turn

`rollDice`, `confirmTurn(onGameOver)`, `resetGame`, `handleRollButton(onGameOver)`, `evaluateGameOver(context)`.

Game over when: `dicePool < nRoll` (idle roll click), `countTilesInRow() > nTiles` (after sweeps), or no legal tray placements (fresh roll).
