---
module: reroll-outer-anim
layer: ui/transitions
v: 1.0
date: 2026-07-23
deps: [state, settings, dice, turn, pip-anim, render, hud-v2]
---
# Reroll Outer Anim

When `rerollOuter` is ON, tap a tray 1 or 6 to spend one star and reroll to a random 1–6.

## Exports
- `rerollOuterDieWithAnim(dieId, onGameOver)` — `phase: animating` → `payStarForTrayDie` → deduct star + `rerollDieValue` + `is-new` render → post-roll stuck check

## Related
[[pip-anim]] · [[drag-drop]] · [[action-bar]] · [[dice]] · [[turn]]
