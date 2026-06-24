---
module: sweep-anim
layer: ui/transitions
v: 1.3
date: 2026-06-23
deps: [state, settings, cards, sweeps, timing, phase, render]
---
# Sweep Anim — User Story

As a player, I want filled cards that form a scoring line to visually pop and then fly off the board in their sweep direction (horizontal, vertical, diagonal) before the next round begins.

## Exports
- `startScoringExitAnimation(lineSlots, ruleId, cardIds)` — begins beat + sweep sequence
- `commitScoringExit()` — called when sweep animation finishes; clears grid slots, drains queue
- `resolveOneScoringSet()` — detects all simultaneous matching lines, starts first sweep
- `resolveAllScoringSets()` — entry point; delegates to `resolveOneScoringSet`

## Animation sequence
1. **Beat phase** (`BEAT_MS`): cards pop to 108% scale
2. **Run phase** (`SWEEP_MS`): cards translate along sweep axis and fade out
3. `commitScoringExit()` clears slots, fires next queued sweep (cross-line), calls `maybeOfferPostSweepCard()` when done, then offers post-sweep cards or `checkPhaseTransition()`

## CSS classes
- `grid-slot--score-pending` → beat scale animation
- `grid-slot--score-sweep--h/v/d1/d2` → directional sweep keyframes
- `#app.is-scoring-exit` → pointer-events: none during animation
- `html.square-cards` → alternate sweep keyframes tuned for 110×110 grid cells

## Related
[[timing]] · [[sweeps]] · [[phase]] · [[render]] · [[card-anim]]
