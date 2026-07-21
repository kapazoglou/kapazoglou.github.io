---
module: placement-anim
layer: ui/transitions
v: 1.22
date: 2026-07-21
deps: [state, settings, row, render, timing, dice-visual]
---
# Placement Anim

Gap inserts spread the row when `gapInsertAnimationsAllowed()`; fly-in starts at 25% of spread and overlaps through landing. Commit anim handoffs from hover spread (no collapse-then-re-spread). Row-edge inserts: fly-in only — columns stay put until `render()` (no full-row spread/collapse jitter). Stack / new-column fly only (no spread). Row reposition stays instant. Flyer stays visible until after `render()`.

## Exports
- `placeDieWithAnim(dieId, slot, existingFlyer?)` — validates, sets `phase: animating`, restores `phase: rolled` + `render()` on done; optional flyer handoff from drag (starts fly from current position)
- `placeDealtTileWithAnim(slot, existingFlyer?)` — bar placement or placed-this-turn row reposition (lifts column, flyer from row rect)
- `computeSpreadOffsets(slot, dieId?)` — gap spread; sole-die reposition excludes vanishing source column and remaps the insert slot

## CSS
- `.placement-col--spreading` — transform spread on columns shifting right
- `.placement-die-flyer` — straight `transform` tray → final slot (precomputed landing, not mid-spread rects)

## Related
[[timing]] · [[row]] · [[handlers]] · [[drag-drop]] · [[render]]
