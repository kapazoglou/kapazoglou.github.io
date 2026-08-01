---
module: state
layer: logic
v: 2.15
date: 2026-08-01
deps: []
---
# State

Single source of truth for v2 row game.

## Key fields
- `dicePool` — unrolled dice remaining in pool
- `actionBar` — die IDs in tray this turn
- `dealtStrip` — half-size between-zone tiles `{ suit, rank, rankSum, bottomValue, stripId }[]`
- `dealtStripWarningIds`, `rowTileWarningCols` — transient duplicate-block chrome
- `tileDeckRemaining` — shuffled deck keys for cadence deals
- `deckRemaining` — conversions left this session when `deckSize` setting > 0; else `null`
- `flankStackLeft`, `flankStackRight` — `{ remaining, top }` virtual deck-flank stacks
- `dominoPairPool`, `dominoTriplePool` — depleting combo keys when `dominoRoll` ON
- `dominoPairGroups`, `dominoChosenPairIndex`, `dominoPairComboKeys` — nRoll=4 dual-pair tray + confirm settle
- `row` — `Record<colIndex, Column>` (0 = center)
- `stars`, `points`, `suitTally`
- `jokerSuitsUsed` — suits that already produced a joker this session (one per suit per game)
- `sweepHistory` — game-over sweep summary
- `rollCount` — successful rolls this session (game-over stat)
- `phase` — `'idle' | 'rolled' | 'animating' | 'replay'`
- `placedDieIds` — unconfirmed placements this turn
- `draggingDieId`, `snapGhostSlot` — UI-only drag / snap-ghost preview flags
- `pairSweepExit` — accent pair-sweep anim state
