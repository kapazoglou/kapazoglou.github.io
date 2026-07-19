---
module: pip-anim
layer: ui/transitions
v: 1.0
date: 2026-07-19
deps: [state, settings, hud-v2, timing]
---
# Pip Anim

Salvaged from Square `card-anim` bank pips: ⭐ flies from `#hud-stars` to `#hud-points`.

## Exports
- `bankStarsToPoints(count, onDone)` — visual-only after state already updated

## Related
[[timing]] · [[hud-v2]] · [[sweep-anim]]
