---
module: sweep-anim
layer: ui/transitions
v: 1.9
date: 2026-07-28
deps: [state, settings, sweeps-row, game-log, render, timing, pip-anim]
---
# Sweep Anim

Beat pop → upward tile sweep → `popFlankStack` for swept flank tops (count −1, next card revealed) → remaining columns collapse inward. Flank reveal uses `newFlankSides` + `.placement-tile.is-new` pop.

## Exports
- `startRowSweepAnimation(cols, onDone)` — beat then sweep run
- `animateFlankStackSweep(flankSides, onDone)` — same beat/sweep on flank tops only; `popFlankStack` + reveal; returns `'well-done'` when both stacks empty
- `resolveSweepsAnimated(onDone)` — beat + sweep each run, re-scan after every apply; log bank cycle to `game-log`; track max `sweepStarMultiplierForRun` across runs (tricolor flushes always ×1); bank `stars × maxMult` with pips **only when at least one sweep ran and stars > 0**

## CSS
- `#app.is-sweep-exit` — input freeze
- `.placement-col--sweep-pending` — beat scale
- `.placement-col--sweep` — `row-sweep-v` exit (upward)
- `.placement-col--collapsing` — post-sweep FLIP slide

## Related
[[timing]] · [[sweeps-row]] · [[pip-anim]] · [[confirm-anim]]
