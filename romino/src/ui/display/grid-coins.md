---
module: grid-coins
layer: ui/display
v: 1.2
date: 2026-06-14
deps: [state, settings, hud, card-anim]
---
# Grid Coins — User Story

When SQUARE and Scoring are both on, coins appear between directly opposite matching dice on adjacent cards (horizontal: slot 1↔0; vertical: slot 2↔1 — no diagonal pairs). Placing a card from the tray collects all visible coins at once.

## Exports
- `gridCoinEdgeSlots(key)` — parse `"gridA:gridB:slotA:slotB"`
- `gridCoinCenterPx(key)` — fallback local centre for coin key `"gridA:gridB"`
- `syncGridCoinPositions()` — after render, centre coins on actual dice midpoints (all rows/columns)
- `collectGridCoins()` — parallel fly-to-score on tray → grid placement; marks edges collected

## Related
[[state]] · [[cards]] · [[grid]] · [[handlers]] · [[drag-drop]] · [[card-anim]]
