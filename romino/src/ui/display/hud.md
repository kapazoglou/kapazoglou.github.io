---
module: hud
layer: ui/display
v: 1.3
date: 2026-06-15
deps: [state, cards, dice, grid]
---
# HUD — User Story

As a player, I need to see my remaining deck size (card countdown) on the left and my current coin score on the right, updated after every game action. In 4-square mode, a live 4×13 discovery grid sits above the HUD and fills in as cards convert.

## Exports
- `renderHUD()` — updates `#card-count` (deck remaining, or ∞ when random dice) and `#score-display` (coins)
- `renderDiscoveryGrid()` — updates `#discovery-grid` (4×13 suit/rank grid when `fourSquare` ON)
- `discoveryGridHTML()` — shared markup for live + game-over 4-square grids
- `renderDiscards()` — updates the hidden discard-stacks DOM (data for potential future UI)
- `initDiscards()` — builds discard label row and calls `renderDiscards()`

## Related
[[state]] · [[dice]] · [[cards]] · [[scoring]] · [[card-anim]]
