---
module: placement-hover
layer: ui/transitions
v: 1.6
date: 2026-07-20
deps: [state, settings, row, placement-row, placement-anim, timing]
---
# Placement Hover

Direct-placement gap preview: while **dragging** over a valid **between-column** insert, adjacent columns spread — only when `gapInsertAnimationsAllowed()` (below N-place and N-places caps). Clears only when leaving a gap (not every pointermove). Row-edge inserts do not preview-spread. Selected die + hover alone does not spread.

## Exports
- `updateInsertHoverSpread(dieId, clientX, clientY)`
- `handoffInsertHoverSpread(keepCols)` — commit handoff: instant-clear non-commit cols, keep spread on commit cols
- `resetInsertHoverSpread()` / `clearInsertHoverSpread(animate?, touchDom?)` — skip DOM when `render()` follows

Wired from `drag-drop` (drag pointer move only) and cleared on `render` / placement anim start.
