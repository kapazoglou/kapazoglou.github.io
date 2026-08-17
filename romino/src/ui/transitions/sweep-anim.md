---
module: sweep-anim
layer: ui/transitions
v: 1.19
date: 2026-08-17
deps: [state, settings, sweeps-row, game-log, render, timing, pip-anim, domino-spot-strip, cube-fly, dice-visual, pool-return-effect]
---
# Sweep Anim

Beat pop → (Dice & Cubes: suit-cube fade + bottom-die arc fly to roll btn, staggered per col) → upward tile sweep → collapse. **Chain sweeps:** `sweep_beat` / `sweep_beat_2`, `sweep_rise` / `sweep_rise_2`, `sweep_collapse` / `sweep_collapse_2` alternate per run (0-based). **`tileDiceHold` ON:** alternating pool-return SFX after each player-col sweep.

## Exports
- `startRowSweepAnimation(cols, onDone, runIndex?)` — alternating beat / rise by run index; optional cube prelude when `diceAndCubes` ON
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
