---
module: flip-tray-anim
layer: ui/transitions
v: 1.0
date: 2026-08-14
deps: [state, star-powers, pip-anim, game-log, render]
---
# Flip Tray Anim

Star-pay flip of tray die 2–5 to opposite face (`7 - value`). Phase `animating` → `rolled`.

## Exports
- `tryStarFlipTrayPay(dieId)` — gate + start anim
- `flipTrayDieWithAnim(dieId)` — HUD star fly → deduct → flip → `newTrayDieIds` pop
