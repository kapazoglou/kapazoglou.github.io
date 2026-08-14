---
module: flip-tray-anim
layer: ui/transitions
v: 1.1
date: 2026-08-14
deps: [state, star-powers, pip-anim, game-log, render]
---
# Flip Tray Anim

Star-pay flip of tray die to opposite face (`7 - value`); all faces; outer 1/6 gated when `rerollOuter` ON. Phase `animating` → `rolled`. Records flip in `flippedDieIds` (via `recordFlip`) so returning the placed die refunds the star + reverts the face.

## Exports
- `tryStarFlipTrayPay(dieId)` — gate + start anim
- `flipTrayDieWithAnim(dieId)` — HUD star fly → deduct → flip → `recordFlip` → keeps selection → `newTrayDieIds` pop
