---
module: game-over
layer: ui/display
v: 2.4
date: 2026-08-14
deps: [dice-visual, highscores, game-log, turn, end-game-prompt, render, lifetime-stats-view, suit-tally, settings]
---
# Game Over

Bottom sheet when the dice pool cannot fill a full roll (`dicePool < nRoll`), tile cap exceeded, or tray is stuck. Rendered inside `.viewport-inner` (variable width × 412px design height).

## Exports
- `initGameOver()` — handle minimize + PLAY AGAIN → `disarmEndGamePrompt()` + `resetGame()`; tile matrix segmented toggle
- `showGameOver(reason?)` — suit-cap end (`sweptSuits` + tally > 12): apply end bonus, show score breakdown; persist game log + lifetime stats; record highscore; reveal overlay
- `sweepListHTML()` — sweep row markup
- `leaderboardHTML(currentId?)` — top-10 highscore rows

## DOM
- `#go-score-value` — final total (`state.points` after end bonus when suit-cap)
- `#go-score-breakdown` — suit-cap only: swept + unique − duplicates + lowest suit → total
- `#go-rolls-value`, `#go-sweeps-count-value` — session roll / sweep counts
- `#go-sweeps` — wrapped sweep groups within sheet width
- `#go-leaderboard` — local top-10 (date, rolls, sweeps, score)
- `#go-lifetime` — last on sheet: summary, stars, this-run vs avg, dice bars, segmented tile matrix (converted / swept)
- `.go-tile-matrix-seg` — toggles `tileCounts` vs `sweepTileCounts` on the 13×4 rank×suit grid
