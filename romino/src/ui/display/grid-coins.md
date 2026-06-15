---
module: grid-coins
layer: ui/display
v: 1.6
date: 2026-06-15
deps: [state, settings, hud, card-anim]
---
# Grid Coins — User Story

When SQUARE and Scoring are both on, coins appear between directly opposite dice on adjacent cards. Classic 3-slot: horizontal slot 1↔0, vertical slot 2↔1. Four-square adds horizontal 2↔3 and vertical 3↔0 (full 2×2 edge coverage). By default dice must match; with `gridCoinsSum7` ON they must differ. Pairs involving 1 or 6 never qualify.

## Exports
- `gridCoinEdgeSlots(key)` — parse `"gridA:gridB:slotA:slotB"`
- `gridCoinCenterPx(key)` — fallback local centre for coin key `"gridA:gridB"`
- `syncGridCoinPositions()` — after render, centre coins on actual dice midpoints (all rows/columns)
- `collectGridCoins()` — parallel fly-to-score on tray → grid placement; marks edges collected

## Related
[[state]] · [[cards]] · [[grid]] · [[handlers]] · [[drag-drop]] · [[card-anim]]
