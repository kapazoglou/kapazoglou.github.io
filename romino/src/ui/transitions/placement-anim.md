---
module: placement-anim
layer: ui/transitions
v: 1.44
date: 2026-08-17
deps: [state, settings, row, render, timing, dice-visual, pip-anim]
---
# Placement Anim

Gap inserts spread the row when `gapInsertAnimationsAllowed()`; fly-in starts at 25% of spread and overlaps through landing. `stack-below`: no fly-in — the pusher always starts at the snap anchor (ghost promoted on release, or a flyer spawned there for tap). Star fly (`pushBelowStarCost()` flyers) runs in parallel while stack + pusher lift together (`PUSH_LIFT_MS`), then `placeDie` unshift. Return push die this turn → star refund at current cost. Row-edge inserts: fly-in only when `deckFlank` OFF — columns stay put until `render()`. With `deckFlank` ON, edge inserts spread **player columns**; adjacent flank stacks are **pushed** by the edge column (opposite transform on row-edge inserts so the snap gap opens between stack and die, same direction on interior gap spreads). Snap anchor is the gap between flank stack and adjacent die column. Stack / new-column fly only (no spread). Row reposition stays instant. Flyer stays visible until after `render()`.

## Exports
- `placeDieWithAnim(dieId, slot, existingFlyer?)` — validates, sets `phase: animating`, restores `phase: rolled` + `render()` on done; optional flyer handoff from drag (starts fly from current position)
- `placeDealtTileWithAnim(slot, existingFlyer?)` — bar placement or placed-this-turn row reposition (lifts column, flyer from row rect)
- `computeSpreadOffsets(slot, dieId?)` — gap spread; sole-die reposition excludes vanishing source column and remaps the insert slot

## CSS
- `.placement-col--spreading` — transform spread on columns shifting right
- `.placement-die-flyer` — straight `transform` tray → final slot (precomputed landing, not mid-spread rects)

## Related
[[timing]] · [[row]] · [[handlers]] · [[drag-drop]] · [[render]]
