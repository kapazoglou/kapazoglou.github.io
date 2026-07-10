---
module: grid-coins
layer: ui/display
v: 1.7
date: 2026-07-10
deps: [state, settings, hud, card-anim]
---
# Grid Coins — User Story

When SQUARE and Scoring are both on, coins appear between directly opposite dice on adjacent cards. Classic 3-slot: horizontal slot 1↔0, vertical slot 2↔1. Four-square adds horizontal 2↔3 and vertical 3↔0 (full 2×2 edge coverage). With `gridCoinsDiffColor` ON, adjacent opposite dice must have different tile colors; pairs involving 1 or 6 never qualify. When OFF they must match (equal value), including 1 and 6 pairs.

## Exports
- `gridCoinEdgeSlots(key)` — parse `"gridA:gridB:slotA:slotB"`
- `gridCoinCenterPx(key)` — fallback local centre for coin key `"gridA:gridB"`
- `syncGridCoinPositions()` — after render, centre coins on actual dice midpoints (all rows/columns)
- `collectGridCoins()` — parallel fly-to-score on tray → grid placement; marks edges collected

## Related
[[state]] · [[cards]] · [[grid]] · [[handlers]] · [[drag-drop]] · [[card-anim]]
