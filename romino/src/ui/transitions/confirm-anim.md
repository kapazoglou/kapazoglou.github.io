---
module: confirm-anim
layer: ui/transitions
v: 1.3
date: 2026-07-19
deps: [stars, render, convert-anim, sweep-anim, pip-anim, placement-row]
---
# Confirm Anim

Post-confirm pipeline: collect row stars (pip) → convert stacks → sweep tiles → bank pips.

## Exports
- `runConfirmAnimations(onDone)`

## Related
[[turn]] · [[convert-anim]] · [[sweep-anim]] · [[stars]]
