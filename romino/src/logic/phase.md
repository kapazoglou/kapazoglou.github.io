---
module: phase
layer: logic
v: 1.23
date: 2026-07-04
deps: [state, settings, cards, dice, sweeps, scoring, sweep-anim, render, preview-anim, hud, card-anim, grid, handlers]
---
# Phase — User Story

As a player, I need the game to automatically advance between phases (place-card → place-dice → place-card → …) after each action, handling all edge cases: full-grid rounds, post-sweep card offers, stuck detection, and game-over.

## Exports
- `checkPhaseTransition()` — evaluates state and advances the phase if criteria are met
- `spawnFullGridDiceRound()` — enters a dice-only round when grid is full
- `fillOneCard(cardId)` — marks filled; records discovery via `snapshotCardIdentity` + `discoveryKey`; calls `maybeEndFillDiscovery()` when `fillDiscovery` ON
- `maybeEndFillDiscovery()` — ends game when fill-discovery win condition met
- `convertFilledCards(onDone, force)` — triggers fill animations for ready cards
- `convertAllGridCards(onDone)` — bulk-fill for endgame
- `isAllDicePlaced()` / `hasLegalMove()` / `checkStuck()` — round-end checks; stuck escalates ghost label to "game over"
- `isEndgameGhost()` / `endgameGhostLabel()` / `clearEndgameFlags()` — endgame ghost slot (full-grid dice or stuck)
- `finalizeFromEndgame()` — player taps ghost: forced conversion + sweeps, overlay if grid still full
- `finalizeFromStuck()` — deprecated alias for `finalizeFromEndgame`
- `showReplay(reason)` — sets phase to `'replay'`, populates game-over overlay
- `maybeAutoplayFirstTwo()` — auto-places first two cards when setting is on
- `revertPostDiceCardPhase()` — undo place-dice → place-card when a die is returned to an empty tray
- `countEmptyDiceSlots()` — total empty die slots on grid cards (raw count, no adjacency)
- `isGridSpatiallyFull()` — every grid cell holds a card (no empty grid slot)
- `tryOfferCapacityCard()` — deals a card when adjacency-available slots &lt; 6 and grid has a free cell; returns false on full grid so callers spawn tray dice
- `maybeOfferPostSweepCard()` — legacy flag setter (prefer `tryOfferCapacityCard`)
- `resetGame()` — full state reset + re-render

## Related
[[state]] · [[dice]] · [[sweeps]] · [[sweep-anim]] · [[card-anim]] · [[handlers]] · [[EVENTS]]
