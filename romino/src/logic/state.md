---
module: state
layer: logic
v: 2.7
date: 2026-07-21
deps: []
---
# State

Single source of truth for v2 row game.

## Key fields
- `dicePool` — unrolled dice remaining in pool
- `actionBar` — die IDs in tray this turn
- `dealtTile` — tile identity in action bar awaiting placement
- `placedDealtTileCol` — row column of dealt tile placed this turn (repositionable until confirm)
- `tileDeckRemaining` — shuffled deck keys for cadence deals
- `row` — `Record<colIndex, Column>` (0 = center)
- `stars`, `points`, `suitTally`
- `jokerSuitsUsed` — suits that already produced a joker this session (one per suit per game)
- `sweepHistory` — game-over sweep summary
- `rollCount` — successful rolls this session (game-over stat)
- `phase` — `'idle' | 'rolled' | 'animating' | 'replay'`
- `placedDieIds` — unconfirmed placements this turn
