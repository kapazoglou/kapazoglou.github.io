---
module: star-reroll-input
layer: ui/display
v: 1.0
date: 2026-07-23
deps: [state, settings, dice-visual, reroll-outer-anim, invalid-flash, game-over, render]
---
# Star Reroll Input

When `rerollOuter` is ON: pay a star from `#hud-star-pay` to reroll a tray 1 or 6.

## Exports
- `initStarRerollInput()` — pointer handlers for HUD star tap + drag

## Interaction
- Select tray 1/6, then **tap** `#hud-star-pay` (count + icon) → reroll selected die
- **Drag** star onto any tray `.die--rerollable` → reroll that die; hover uses `die--action-selected` accent border
- Zero stars → `flashStarShortagePlacement`

## Related
[[hud-v2]] · [[reroll-outer-anim]] · [[drag-drop]] · [[action-bar]]
