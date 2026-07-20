---
module: invalid-flash
layer: ui/transitions
v: 1.0
date: 2026-07-20
deps: [settings]
---
# Invalid Flash

Brief full-viewport red overlay when direct-placement tap/drag hits the row but the move is not allowed (illegal slot, failed rules, or unplaceable zone). Duration respects `spd()`. Uses `--warning-red-rgb` in `base.css`.
