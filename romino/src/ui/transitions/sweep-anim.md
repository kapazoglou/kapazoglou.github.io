---
module: sweep-anim
layer: ui/transitions
v: 1.4
date: 2026-07-23
deps: [state, settings, sweeps-row, render, timing, pip-anim]
---
# Sweep Anim

Beat pop → upward tile sweep → remaining columns collapse inward.

## Exports
- `startRowSweepAnimation(cols, onDone)` — beat then sweep run
- `resolveSweepsAnimated(onDone)` — beat + sweep each run, re-scan after every apply; track max `sweepStarMultiplier` across runs; bank `stars × maxMult` with pips

## CSS
- `#app.is-sweep-exit` — input freeze
- `.placement-col--sweep-pending` — beat scale
- `.placement-col--sweep` — `row-sweep-v` exit (upward)
- `.placement-col--collapsing` — post-sweep FLIP slide

## Related
[[timing]] · [[sweeps-row]] · [[pip-anim]] · [[confirm-anim]]
