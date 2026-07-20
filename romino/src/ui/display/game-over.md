---
module: game-over
layer: ui/display
v: 1.5
date: 2026-07-20
deps: [dice-visual, highscores, turn, render]
---
# Game Over

Bottom sheet when the dice pool cannot fill a full roll (`dicePool < nRoll`), tile cap exceeded, or tray is stuck. Rendered inside `.viewport-inner` (412×412 design frame).

## Exports
- `initGameOver()` — handle minimize + PLAY AGAIN → `resetGame()`
- `showGameOver(reason?)` — populate swept points, session stats, sweeps; record + render leaderboard; reveal overlay
- `sweepListHTML()` — sweep row markup
- `leaderboardHTML(currentId?)` — top-10 highscore rows

## DOM
- `#go-score-value` — final `state.points` (swept points only)
- `#go-rolls-value`, `#go-sweeps-count-value` — session roll / sweep counts
- `#go-sweeps` — wrapped sweep groups within sheet width
- `#go-leaderboard` — local top-10 (date, rolls, sweeps, score)
