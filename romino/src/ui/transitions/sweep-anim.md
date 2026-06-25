---
module: sweep-anim
layer: ui/transitions
v: 1.5
date: 2026-06-24
deps: [state, settings, cards, sweeps, timing, phase, render]
---
# Sweep Anim — User Story

As a player, I want filled cards that form a scoring line to visually pop and then fly off the board in their sweep direction (horizontal, vertical, diagonal) before the next round begins.

## Exports
- `startScoringExitAnimation(lineSlots, ruleId, cardIds)` — begins beat + sweep sequence
- `commitScoringExit()` — called when sweep animation finishes; clears grid slots, drains queue
- `resolveOneScoringSet()` — calls `collectScoringMatches()` in sweeps.js; starts first sweep, queues rest
- `resolveAllScoringSets()` — entry point; delegates to `resolveOneScoringSet`

## Animation sequence
1. **Beat phase** (`BEAT_MS`): cards pop to 108% scale
2. **Run phase** (`SWEEP_MS`): cards translate along sweep axis and fade out
3. `commitScoringExit()` clears slots, fires next queued sweep (cross-line), calls `tryOfferCapacityCard()` when done, then `checkPhaseTransition()` if no card was dealt

## CSS classes
- `grid-slot--score-pending` → beat scale animation
- `grid-slot--score-sweep--h/v/d1/d2` → directional sweep keyframes
- `#app.is-scoring-exit` → pointer-events: none during animation
- `html.square-cards` → alternate sweep keyframes tuned for 110×110 grid cells

## Related
[[timing]] · [[sweeps]] · [[phase]] · [[render]] · [[card-anim]]
