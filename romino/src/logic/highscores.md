---
module: highscores
layer: logic
v: 1.1
date: 2026-08-15
deps: []
---
# Highscores

Local top-10 leaderboard persisted to `localStorage` (`romino-v2-highscores`).

## Exports
- `getHighscores()` — sorted entries (score desc, rolls asc, sweeps asc, newer wins ties)
- `recordHighscore({ score, rolls, sweeps })` — append, trim to 10, return `{ entry, rank, saved }`
- `clearHighscores()` — remove all entries from localStorage

## Entry shape
`{ id, score, rolls, sweeps, at }` — `at` is ISO-8601 timestamp.
