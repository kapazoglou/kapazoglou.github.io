---
module: confirm-anim
layer: ui/transitions
v: 1.6
date: 2026-07-28
deps: [stars, render, convert-anim, sweep-anim, pip-anim, placement-row]
---
# Confirm Anim

Post-confirm pipeline: collect row stars (pip) → convert stacks (flank top discard on identity match) → sweep tiles (incl. deck-flank tops) → bank pips.

## Exports
- `runConfirmAnimations(onDone)` — `onDone('well-done')` when both flank stacks depleted after sweeps

## Related
[[turn]] · [[convert-anim]] · [[sweep-anim]] · [[stars]]
