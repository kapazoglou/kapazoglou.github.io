---
module: state
layer: logic
v: 2.40
date: 2026-08-15
deps: []
---
# State

Single source of truth for v2 row game.

## Key fields
- `dicePool` — unrolled dice remaining in pool
- `diceWithheld` — virtual dice locked by converted tiles when `tileDiceHold` ON; released on sweep/pair-sweep
- `actionBar` — die IDs in tray this turn
- `dealtStrip` — half-size between-zone tiles `{ suit, rank, rankSum, bottomValue, stripId }[]`
- `dealtStripWarningIds`, `rowTileWarningCols` — transient duplicate-block chrome
- `tileDeckRemaining` — shuffled deck keys for cadence deals
- `deckRemaining` — conversions left when `deckSize` > 0 (non-domino); domino mode: active pool length only
- `flankStackLeft`, `flankStackRight` — `{ remaining, top }` virtual deck-flank stacks
- `dominoPairPool`, `dominoTriplePool` — available combo keys when `dominoRoll` ON
- `dominoPairDiscard`, `dominoTripleDiscard` — swept / unbound-offer keys; Spots ON: merge into pool on sweep; Spots OFF: cleared on full rebuild when draw is short
- `dominoReshufflesRemaining` — charged reshuffles per game (3 when domino roll active); dots UI in action bar
- `dominoPairGroups`, `dominoChosenPairIndex`, `dominoPairComboKeys` — nRoll=4 dual-pair tray + confirm settle
- `dominoPairRerollAvailable` — nRoll=2 ↺ reroll once per roll
- `dominoHandKeys`, `dominoHandSelectedIndex`, `dominoHandCommittedKey`, `dominoHandPreviewKey`, `dominoHandLocked`, `dominoHandPreviewDieIds`, `newDominoHandKeys` — nRoll=1 hand preview/lock mode
- `dominoOfferedKeys`, `dominoUsedKey`, `dominoUnusedKey`, `dominoStarRerollUsedKey`, `dominoSpotCols`, `dominoSpotKeys`, `dominoColSpotSlot`, `dominoColVacatedSlot`, `startingDominoSpotCols`, `dominoSpotsCreatedThisTurn`, `newDominoSpotCols` — domino spots roll state when `dominoSpots` ON
- `pushBelowDieIds` — dies placed via push-below this turn (return refunds `pushBelowStarCost()`)
- `swapStackCols` — columns star-paid stack swap this turn (tap refunds 1 star + reverses order)
- `flippedDieIds` — tray dice star-flipped (odd flips) this turn (return to bar refunds 1 star + reverts face)
- `buggerPendingCols` — lone 1/6 columns awaiting push-below when `buggerSingles` ON
- `buggerOuterStackLockedCols` — 2+ all-outer stacks that need push-below before convert
- Column `dominoKey` — mirror of `dominoSpotKeys[col]` on stack/tile until sweep
- `row` — `Record<colIndex, Column>` (0 = center)
- `stars`, `points`, `suitTally`
- `jokerSuitsUsed` — suits that already produced a joker this session (one per suit per game)
- `sweepHistory` — game-over sweep summary
- `convertSweepTiles` — Switcher Joker converts counted as swept (`sweptSuits` discovery grid)
- `rollCount` — successful rolls this session (game-over stat)
- `fullSweepCount` — scoring sweeps that emptied the player row (game-over multiplier = 1 + count)
- `phase` — `'idle' | 'rolled' | 'animating' | 'replay'`
- `placedDieIds` — unconfirmed placements this turn
- `draggingDieId`, `snapGhostSlot` — UI-only drag / snap-ghost preview flags
- `pairSweepExit` — accent pair-sweep anim state
- `sweepExit` — `{ cols, flankSides, stripIds, phase, suitFlownCols, onDone }` row/flank sweep anim; `sweepExitBeatTimer`, `sweepExitPreludeTimer`, `sweepExitDoneTimer`
