---
module: reposition-collapse
layer: ui/transitions
v: 1.3
date: 2026-07-20
deps: [state, settings, row, placement-row, timing]
---
# Reposition Collapse

While a sole row die is dragged for reposition, the source column is taken out of flex flow (absolute) so the gap closes instantly; scroll is pinned to keep the row centred.

## Exports
- `beginRepositionCollapse(dieId)` — on drag start (row, sole-die column only)
- `resetRepositionCollapse()` — state-only clear before full `render()` (no column snap)
- `clearRepositionCollapse(animate?)` — DOM restore on drag cancel
- `isRepositionCollapseActive()`

## Related
[[drag-drop]] · [[placement-hover]] · [[placement-row]] · [[timing]]
