---
module: sweep-anim
layer: ui/transitions
v: 1.17
date: 2026-08-14
deps: [state, settings, sweeps-row, game-log, render, timing, pip-anim, domino-spot-strip, cube-fly, dice-visual]
---
# Sweep Anim

Beat pop → (Dice & Cubes: suit-cube fade + bottom-die arc fly to roll btn, staggered per col) → upward tile sweep → `popFlankStack` for swept flank tops (count −1, next card revealed) → remaining columns collapse inward (domino spot strip tracks via `syncDominoSpotStripDuringMotion`). Flank reveal uses `newFlankSides` + `.placement-tile.is-new` pop.

## Exports
- `startRowSweepAnimation(cols, onDone)` — beat, optional cube prelude (`diceAndCubes` ON), then sweep run
- `animateFlankStackSweep(flankSides, onDone)` — same beat/sweep on flank tops only; `popFlankStack` + reveal; returns `'well-done'` when both stacks empty
- `resolveSweepsAnimated(onDone)` — beat + sweep each run, re-scan after every apply; log bank cycle to `game-log`; sum each run’s `sweepLengthFactor` (tricolor flushes always ×1); bank `effectiveStars × totalFactor` with pip anim when at least one sweep ran (0 stars score as 1)

## State (`sweepExit`)
- `phase`: `'wait'` | `'run'`
- `suitFlownCols`: cols whose suit die already arc-flew (hide on re-render via `.placement-tile-cube--suit-flown`)
- Timers: `sweepExitBeatTimer`, `sweepExitPreludeTimer`, `sweepExitDoneTimer`

## CSS
- `#app.is-sweep-exit` — input freeze
- `.placement-col--sweep-pending` — beat scale
- `.placement-col--sweep` — `row-sweep-v` exit (upward)
- `.placement-tile-cube--sweep-prelude` — relative positioning context for fade overlay
- `.cube-sweep-suit-cube` — suit cube persists on tile after bottom die flies
- `.placement-col--collapsing` — post-sweep FLIP slide

## Related
[[timing]] · [[sweeps-row]] · [[pip-anim]] · [[confirm-anim]] · [[cube-fly]]
