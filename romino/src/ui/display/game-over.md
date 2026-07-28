---
module: game-over
layer: ui/display
v: 2.1
date: 2026-07-28
deps: [dice-visual, highscores, game-log, turn, render]
---
# Game Over

Bottom sheet when the dice pool cannot fill a full roll (`dicePool < nRoll`), tile cap exceeded, or tray is stuck. Rendered inside `.viewport-inner` (variable width × 412px design height).

## Exports
- `initGameOver()` — handle minimize + PLAY AGAIN → `resetGame()`; tile matrix segmented toggle
- `showGameOver(reason?)` — persist game log + lifetime stats; populate session + lifetime blocks; record highscore; reveal overlay; title **WELL DONE** when `reason === 'well-done'`, else **GAME OVER**
- `sweepListHTML()` — sweep row markup
- `leaderboardHTML(currentId?)` — top-10 highscore rows

## DOM
- `#go-score-value` — final `state.points` (swept points only)
- `#go-rolls-value`, `#go-sweeps-count-value` — session roll / sweep counts
- `#go-sweeps` — wrapped sweep groups within sheet width
- `#go-leaderboard` — local top-10 (date, rolls, sweeps, score)
- `#go-lifetime` — last on sheet: summary, stars, this-run vs avg, dice bars, segmented tile matrix (converted / swept)
- `.go-tile-matrix-seg` — toggles `tileCounts` vs `sweepTileCounts` on the 13×4 rank×suit grid
