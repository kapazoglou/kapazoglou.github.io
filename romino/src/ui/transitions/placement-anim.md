---
module: placement-anim
layer: ui/transitions
v: 1.9
date: 2026-07-19
deps: [state, settings, row, render, timing, dice-visual]
---
# Placement Anim

Two-phase bar placement: gap inserts spread the row; fly-in starts at 25% of spread and overlaps through landing. Stack / new-column fly only (no spread). Row reposition stays instant.

## Exports
- `placeDieWithAnim(dieId, slot)` — validates, sets `phase: animating`, restores `phase: rolled` + `render()` on done

## CSS
- `.placement-col--spreading` — transform spread on columns shifting right
- `.placement-die-flyer` — straight `transform` tray → final slot (precomputed landing, not mid-spread rects)

## Related
[[timing]] · [[row]] · [[handlers]] · [[drag-drop]] · [[render]]
