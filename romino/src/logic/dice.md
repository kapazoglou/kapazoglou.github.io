---
module: dice
layer: logic
v: 2.1
date: 2026-07-23
deps: [state]
---
# Dice

Spawn random 1–6 dice into `state.dice`.

## Exports
- `isOuterDieValue(value)` — true for 1 or 6
- `rerollDieValue(dieId)` — mutates die to `rollValue()`; false when die missing
