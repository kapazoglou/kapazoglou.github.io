---
module: game-over
layer: ui/display
v: 1.16
date: 2026-07-10
deps: [phase]
---
# Game Over — User Story

As a player, when the game ends I want to see a bottom sheet slide up showing my final score, the cards I discovered, and a breakdown of sweeps by type. I can minimize the sheet or tap "play again" to restart.

## Exports
- `initGameOver()` — attaches click listeners to `#go-handle` (minimize toggle) and `#game-over-restart` (calls `resetGame()`)

## DOM populated by `showReplay()` in phase.js
- `#game-over-reason` — reason string (e.g. "no legal moves remaining")
- `#go-cards-count` — unique discovered cards (count matches grid)
- `#go-cards-grid` — one mini thumbnail per unique identity; 2-slot shows domino dice at game over; `fourSquare` ON → fixed 4×13 grid (rows Z/X/Y/W, cols suit-only/2–12/A)
- `#go-sweeps` — sweep breakdown; `fourSquare` ON → centred inline sweep groups (4px between tiles, 32px between groups/lines); otherwise type counts

## Related
[[phase]] · [[grid]] · [[sweeps]] · [[state]]
