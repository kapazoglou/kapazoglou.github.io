---
module: lifetime-stats-view
layer: ui/display
v: 1.0
date: 2026-07-28
deps: [game-log, dice-visual]
---
# Lifetime Stats View

Shared DOM renderer for per-config lifetime aggregates (summary, stars, dice bars, tile matrix).

## Exports
- `formatAvg(value)` — integer or one-decimal display
- `lifetimeTileMatrixHTML(tileCounts)` — 13×4 rank×suit table
- `lifetimeDiceBarsHTML(dicePct)` — six-bar distribution chart
- `updateMatrixSegUI(segEl, mode)` — sync converted/swept toggle chrome
- `renderLifetimeStatsView(opts)` — populate summary/stars/dice/tiles (+ optional compare block) for a settings snapshot

## Used by
[[game-over]] · [[settings-panel]]
