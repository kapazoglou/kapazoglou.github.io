---
module: placement-hover
layer: ui/transitions
v: 1.12
date: 2026-07-28
deps: [state, settings, row, placement-row, placement-anim, timing]
---
# Placement Hover

Direct-placement gap preview: while **dragging** a die or dealt tile over a valid **between-column** insert, adjacent columns spread when `gapInsertAnimationsAllowed()` (dice: below N-place and N-spots cap, or row die reposition drag; dealt tile: row room after N-place). Clears only when leaving a gap (not every pointermove). With `deckFlank` ON, row-edge inserts (left/right of leftmost/rightmost die) also preview-spread player columns; adjacent flank stacks are pushed with the edge column (not a separate symmetric spread). Plain row-edge inserts (no flank) do not preview-spread. Selected die + hover alone does not spread.

## Exports
- `updateInsertHoverSpread(clientX, clientY, validSlots, dieId?, forcedSlot?)` — `validSlots` from `getValidSlotsForDie` or `getValidSlotsForDealtTile`; optional `dieId` for row-reposition spread offset; optional `forcedSlot` for snap-ghost preview (skips pointer re-resolve)
- `handoffInsertHoverSpread(keepCols)` — commit handoff: instant-clear non-commit cols, keep spread on commit cols
- `resetInsertHoverSpread()` / `clearInsertHoverSpread(animate?, touchDom?)` — skip DOM when `render()` follows

Wired from `drag-drop` (drag pointer move only) and cleared on `render` / placement anim start.
