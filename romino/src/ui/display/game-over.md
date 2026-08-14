---
module: game-over
layer: ui/display
v: 2.10
date: 2026-08-14
deps: [dice-visual, highscores, game-log, turn, end-game-prompt, render, suit-tally, settings, sweeps-row]
---
# Game Over

Bottom sheet when the dice pool cannot fill a full roll (`dicePool < nRoll`), tile cap exceeded, or tray is stuck. Rendered inside `.viewport-inner` (variable width × 412px design height).

## Exports
- `initGameOver()` — handle minimize + PLAY AGAIN → `disarmEndGamePrompt()` + `resetGame()`
- `showGameOver(reason?)` — when `sweptSuits` ON: end bonus + score breakdown on every game over; discovery win titles WINNER / FLAWLESS (+1 / +2 multiplier bonus); full sweeps multiply final total `×(1 + fullSweepCount + discoveryBonus)` after bonus; persist game log + lifetime stats (settings panel only); record highscore; reveal overlay
- `sweepListHTML()` — sweep row markup
- `leaderboardHTML(currentId?)` — top-10 highscore rows

## DOM
- `#go-score-breakdown` — when `sweptSuits` ON and/or full sweeps > 0: swept + end bonus lines + optional `full sweeps ×N` → total
- `#go-rolls-value`, `#go-sweeps-count-value` — session roll / sweep counts
- `#go-sweeps` — wrapped sweep groups within sheet width
- `#go-leaderboard` — local top-10 (date, rolls, sweeps, score)
