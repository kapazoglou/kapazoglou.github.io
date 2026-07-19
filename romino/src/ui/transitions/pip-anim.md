---
module: pip-anim
layer: ui/transitions
v: 1.1
date: 2026-07-19
deps: [state, settings, hud-v2, timing]
---
# Pip Anim

Salvaged from Square `card-anim` bank pips: ⭐ flies from `#hud-stars` to `#hud-points`. Row gap → HUD collect uses faster `STAR_COLLECT_*` timings.

## Exports
- `bankStarsToPoints(count, onDone)` — visual-only after state already updated
- `collectStarsToHUD(count, fromRects, onDone)` — row gap → `#hud-stars` after confirm

## Related
[[timing]] · [[hud-v2]] · [[sweep-anim]]
