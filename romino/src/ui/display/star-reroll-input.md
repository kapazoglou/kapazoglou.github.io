---
module: star-reroll-input
layer: ui/display
v: 1.2
date: 2026-08-10
deps: [state, settings, dice-visual, reroll-outer-anim, invalid-flash, game-over, render]
---
# Star Reroll Input

When `rerollOuter` is ON: pay a star from `#hud-star-pay` to reroll a tray 1 or 6. When nRoll=2 domino offer is active: pay a star to redraw **both** dice as a new pair (drag/tap either die; both highlight on hover).

## Exports
- `initStarRerollInput()` — pointer handlers for HUD star tap + drag
- `isHudStarPayDraggable()` — HUD star icon draggable when outer reroll or domino pair reroll is available

## Interaction
- Select tray 1/6, then **tap** `#hud-star-pay` → reroll selected die
- **Domino offer:** drag/tap star onto either pair die → whole pair redraw; both dice accent on hover
- **Drag** star onto `.die--rerollable` (outer) or `.die--domino-rerollable` (pair)
- Zero stars → `flashStarShortagePlacement`

## Related
[[hud-v2]] · [[reroll-outer-anim]] · [[domino-reroll-anim]] · [[drag-drop]] · [[action-bar]]
