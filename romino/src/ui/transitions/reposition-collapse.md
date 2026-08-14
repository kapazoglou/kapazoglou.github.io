---
module: reposition-collapse
layer: ui/transitions
v: 1.10
date: 2026-08-14
deps: [state, settings, row, placement-row, domino-spot-strip, timing]
---
# Reposition Collapse

While a sole row die is dragged for reposition, the source column is taken out of flex flow (absolute) so the gap closes instantly; scroll is pinned to keep the row centred. Spot columns hide the seam domino via CSS class only (no strip rebuild during collapse).

Push-below return: dragging a placed push die back to the tray shifts upper dice down one stack step on drag start (bottom die stays in flex, hidden) so the column baseline matches the row.

## Exports
- `beginRepositionCollapse(dieId)` — on drag start (row, sole-die column only)
- `beginPushReturnCollapse(dieId)` — on drag start (push-below bottom die, multi-dice stack)
- `resetRepositionCollapse()` — state-only clear before full `render()` (includes push-return state)
- `resetPushReturnCollapse()` — push-return state-only clear
- `clearRepositionCollapse(animate?)` — DOM restore on drag cancel
- `clearPushReturnCollapse()` — restore vacated bottom die on drag cancel
- `isRepositionCollapseActive()`

## Related
[[drag-drop]] · [[placement-hover]] · [[placement-row]] · [[timing]]
