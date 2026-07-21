---
module: invalid-flash
layer: ui/transitions
v: 1.1
date: 2026-07-21
deps: [settings, state]
---
# Invalid Flash

Brief full-viewport red overlay when direct-placement tap/drag hits the row but the move is not allowed (illegal slot, failed rules, or unplaceable zone). Duration respects `spd()`. Uses `--warning-red-rgb` in `base.css`.

`flashStarShortagePlacement()` — same viewport flash; when `state.stars === 0`, also pulses `#hud-stars` warning red.
