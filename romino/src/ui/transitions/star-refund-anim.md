---
module: star-refund-anim
layer: ui/transitions
v: 1.2
date: 2026-08-14
deps: [row, star-powers, pip-anim, render, hud-v2]
---
# Star Refund Anim

Star-power refund fly helpers — col/tray → `#hud-stars` via [[pip-anim]] as soon as the refund triggers.

## Exports
- `returnDieToBarWithStarRefund(dieId, keepSelected?)` — `returnDieToBar` + immediate `refundStarFromCol` for push-below / swap / flip refunds
- `playRepositionStarRefunds(repositionRefund, slot)` — push-below leave credit (+ target pay when repositioning to another `stack-below`)
- `peekStarPowerRepositionRefund` — re-export from [[row]]

## Related
[[pip-anim]] · [[stack-swap-anim]] · [[drag-drop]] · [[placement-anim]]
