---
module: state
layer: logic
v: 1.11
date: 2026-07-11
deps: []
---
# State — User Story

As the game engine, I need a single mutable object that holds the complete game snapshot at any moment, so that all modules can read and write it without passing data through function arguments.

## Exports
- `state` — main game snapshot object (grid, cards, dice, phase, scores, flags)
- `forbiddenDieSlots` — Set of die IDs currently occupying paid/forbidden slots
- `clearScoreExitTimers()` — cancels pending sweep-animation timers stored on state

## Key fields
- `state.grid` — array of cardIds (or null) for each grid slot
- `state.cards` — array of card objects `{ id, slots, filled, squareLayout?, … }`
- `state.dice` — array of die objects `{ id, value }`
- `state.phase` — current game phase: `'place-card' | 'place-dice' | 'replay'`
- `state.score` — running coin total (resets to 0 when banked on sweep)
- `state.sweptPoints` — cumulative coins banked from completed sweeps
- `state.scoringExit` — active sweep animation descriptor (null when idle)
- `state.discoveredCards` — unique filled card IDs in first-discovery order (game-over summary)
- `state.selectedCardId` — card selected for placement/reposition
- `state.peekUnconvertedCards` — Set of filled grid card ids currently showing pre-conversion layout (`peekUnconvertedLayout`)
- `state.showGameOverCard` / `state.newGameOverCard` — stuck: clickable game-over card in action-bar ghost slot
- `state.finalizingStuck` — guard while finalize pipeline runs
- `state.chooseDiceAwaitingCard` — 3 dice placed; tray card pending grid placement
- `state.chooseDiceAwaitingLastChance` — all 6 placed; Last Chance card in tray pending click
- `state.chooseDicePostLastChance` — after Last Chance: offer capacity cards until 6 adjacency slots

## Related
[[settings]] · [[phase]] · [[cards]] · [[dice]]
