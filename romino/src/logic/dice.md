---
module: dice
layer: logic
v: 2.3
date: 2026-08-01
deps: [state, game-log]
---
# Dice

Spawn random 1–6 dice into `state.dice`. Every `rollValue()` outcome is logged to `game-log`.

## Exports
- `spawnKnownDie(value)` — spawn fixed face + log outcome (domino roll)
- `isOuterDieValue(value)` — true for 1 or 6
- `rerollDieValue(dieId)` — mutates die to `rollValue()`; false when die missing
