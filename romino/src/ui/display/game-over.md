---
module: game-over
layer: ui/display
v: 1.2
date: 2026-07-19
deps: [discovery, dice-visual, turn, render]
---
# Game Over

Bottom sheet when the dice pool cannot fill a full roll (`dicePool < nRoll`). Rendered inside `.viewport-inner` (412×412 design frame), same as settings panel.

## Exports
- `initGameOver()` — handle minimize + PLAY AGAIN → `resetGame()`
- `showGameOver(reason?)` — populate swept points, discovery grid, sweeps; reveal overlay
- `discoveryGridHTML()` / `sweepListHTML()` — shared markup builders

## DOM
- `#go-score-value` — final `state.points` (swept points only)
- `#go-cards-grid` — 4×13 mini tiles
- `#go-sweeps` — comma-separated sweep groups
