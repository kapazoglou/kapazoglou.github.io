---
module: placement-hover
layer: ui/transitions
v: 1.9
date: 2026-07-21
deps: [state, settings, row, placement-row, placement-anim, timing]
---
# Placement Hover

Direct-placement gap preview: while **dragging** a die or dealt tile over a valid **between-column** insert, adjacent columns spread when `gapInsertAnimationsAllowed()` (dice: below N-place and N-spots cap; dealt tile: row room after N-place). Clears only when leaving a gap (not every pointermove). Row-edge inserts do not preview-spread. Selected die + hover alone does not spread.

## Exports
- `updateInsertHoverSpread(clientX, clientY, validSlots, dieId?)` — `validSlots` from `getValidSlotsForDie` or `getValidSlotsForDealtTile`; optional `dieId` for row-reposition spread offset
- `handoffInsertHoverSpread(keepCols)` — commit handoff: instant-clear non-commit cols, keep spread on commit cols
- `resetInsertHoverSpread()` / `clearInsertHoverSpread(animate?, touchDom?)` — skip DOM when `render()` follows

Wired from `drag-drop` (drag pointer move only) and cleared on `render` / placement anim start.
