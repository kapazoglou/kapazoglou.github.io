---
module: hud
layer: ui/display
v: 1.1
date: 2026-06-12
deps: [state, cards, dice]
---
# HUD — User Story

As a player, I need to see my remaining deck size (card countdown) on the left and my current coin score on the right, updated after every game action.

## Exports
- `renderHUD()` — updates `#card-count` (deck remaining: card deck when `diceDecks` on, die combo deck otherwise) and `#score-display` (coins)
- `renderDiscards()` — updates the hidden discard-stacks DOM (data for potential future UI)
- `initDiscards()` — builds discard label row and calls `renderDiscards()`

## Related
[[state]] · [[dice]] · [[cards]] · [[scoring]] · [[card-anim]]
