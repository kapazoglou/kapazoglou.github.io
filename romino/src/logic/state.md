---
module: state
layer: logic
v: 2.1
date: 2026-07-19
deps: []
---
# State

Single source of truth for v2 row game.

## Key fields
- `dicePool` — remaining dice (shown on roll button)
- `actionBar` — die IDs in tray this turn
- `row` — `Record<colIndex, Column>` (0 = center)
- `stars`, `points`, `suitTally`
- `sweepHistory` — game-over sweep summary
- `phase` — `'idle' | 'rolled' | 'animating' | 'replay'`
- `placedDieIds` — unconfirmed placements this turn
