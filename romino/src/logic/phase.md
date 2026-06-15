---
module: phase
layer: logic
v: 1.15
date: 2026-06-15
deps: [state, settings, cards, dice, sweeps, scoring, sweep-anim, render, preview-anim, hud, card-anim, grid, handlers]
---
# Phase — User Story

As a player, I need the game to automatically advance between phases (place-card → place-dice → place-card → …) after each action, handling all edge cases: full-grid rounds, post-sweep card offers, stuck detection, and game-over.

## Exports
- `checkPhaseTransition()` — evaluates state and advances the phase if criteria are met
- `spawnFullGridDiceRound()` — enters a dice-only round when grid is full
- `fillOneCard(cardId)` — marks filled; records discovery via `snapshotCardIdentity` + `discoveryKey`
- `convertFilledCards(onDone, force)` — triggers fill animations for ready cards
- `convertAllGridCards(onDone)` — bulk-fill for endgame
- `isAllDicePlaced()` / `hasLegalMove()` / `checkStuck()` — round-end checks
- `showReplay(reason)` — sets phase to `'replay'`, populates game-over overlay
- `maybeAutoplayFirstTwo()` — auto-places first two cards when setting is on
- `revertPostDiceCardPhase()` — undo place-dice → place-card when a die is returned to an empty tray
- `countEmptyDiceSlots()` — total empty die slots on grid cards
- `maybeOfferFourSquarePostSweepCard()` — 4-square: sets `pendingPostSweepCards` when post-sweep empty slots &lt; 6
- `resetGame()` — full state reset + re-render

## Related
[[state]] · [[dice]] · [[sweeps]] · [[sweep-anim]] · [[card-anim]] · [[handlers]] · [[EVENTS]]
