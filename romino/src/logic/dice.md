---
module: dice
layer: logic
v: 2.2
date: 2026-07-28
deps: [state, game-log]
---
# Dice

Spawn random 1–6 dice into `state.dice`. Every `rollValue()` outcome is logged to `game-log`.

## Exports
- `isOuterDieValue(value)` — true for 1 or 6
- `rerollDieValue(dieId)` — mutates die to `rollValue()`; false when die missing
