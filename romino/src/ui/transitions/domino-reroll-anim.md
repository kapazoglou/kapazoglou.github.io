---
module: domino-reroll-anim
layer: ui/transitions
v: 1.3
date: 2026-08-10
deps: [state, domino-roll, turn, game-log, pip-anim, render]
---
# Domino Reroll Anim

Star-pay fly → deduct → `rerollDominoPairOffer()` (discard offer + random tray pair; **no pool draw** — deck counter unchanged).

## Exports
- `canDominoPairStarReroll(dieId)` — either tray die when `canShowDominoPairReroll()`
- `tryDominoPairStarReroll(dieId)` — `payStarForDominoPair` then `rerollDominoPairOffer()`

## Related
[[star-reroll-input]] · [[domino-roll]] · [[turn]] · [[pip-anim]]
