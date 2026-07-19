---
module: turn
layer: logic
v: 1.5
date: 2026-07-19
deps: [state, settings, dice, confirm-anim]
---
# Turn

`rollDice`, `confirmTurn` (animated via [[confirm-anim]]), `resetGame`, `handleRollButton(onGameOver)`.

When `dicePool < nRoll` in idle, roll button stays enabled but click opens game over (no partial roll). Post-confirm auto-roll uses the same rule.
