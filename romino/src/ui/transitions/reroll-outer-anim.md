---
module: reroll-outer-anim
layer: ui/transitions
v: 1.6
date: 2026-07-28
deps: [state, settings, dice, turn, pip-anim, render, hud-v2]
---
# Reroll Outer Anim

When `rerollOuter` is ON, select a tray 1 or 6 then pay from `#hud-star-pay` (tap or drag star onto die).

## Exports
- `selectedOuterTrayDieId()` — selected tray die if value is 1 or 6
- `tryRerollOuterPay(dieId, onGameOver)` — guard + start anim
- `rerollOuterDieWithAnim(dieId, onGameOver)` — `phase: animating` → pay → reroll → `evaluateGameOver` → `triggerGameOver` when stuck (same rules as Flank OFF)

## Related
[[pip-anim]] · [[drag-drop]] · [[action-bar]] · [[dice]] · [[turn]]
