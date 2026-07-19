---
module: turn
layer: logic
v: 1.4
date: 2026-07-19
deps: [state, settings, dice, confirm-anim]
---
# Turn

`rollDice`, `confirmTurn` (animated via [[confirm-anim]]), `resetGame`, `handleRollButton`.

Confirm sets `phase: animating` until the transition pipeline finishes; roll-on-same-click chains in the callback.
