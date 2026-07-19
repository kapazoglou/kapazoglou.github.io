---
module: game-over
layer: ui/display
v: 1.4
date: 2026-07-19
deps: [dice-visual, turn, render]
---
# Game Over

Bottom sheet when the dice pool cannot fill a full roll (`dicePool < nRoll`), tile cap exceeded, or tray is stuck. Rendered inside `.viewport-inner` (412×412 design frame).

## Exports
- `initGameOver()` — handle minimize + PLAY AGAIN → `resetGame()`
- `showGameOver(reason?)` — populate swept points, sweeps; reveal overlay
- `sweepListHTML()` — sweep row markup

## DOM
- `#go-score-value` — final `state.points` (swept points only)
- `#go-sweeps` — wrapped sweep groups within sheet width
