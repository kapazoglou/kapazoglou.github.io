---
module: dealt-strip
layer: ui/display
v: 1.1
date: 2026-08-01
deps: [dealt-strip.js, dice-visual.js, render.js]
---
# Dealt strip (display)

Renders `#dealt-strip` half-size overlapping tiles centred on the separator.

- `renderDealtStrip()` — rebuild from `state.dealtStrip`
- `startPairSweepAnimation(stripId)` — accent tap: sweep-up anim, no scoring
