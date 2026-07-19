---
module: drag-drop
layer: ui/display
v: 2.9
date: 2026-07-19
deps: [state, settings, cards, sweeps, scoring, dice, phase, sweep-anim, render, hud, card-anim, preview-anim, haptics]
---
# Drag-Drop — User Story

As a player, I want to drag dice from the tray into card slots and drag hand cards onto grid slots. While dragging a die, forbidden slots show a visual indicator. Dropping in a valid slot updates state and advances the game phase. I can drop a die back onto the action bar to return it to the tray. With `coinFlipDice` on, I can drag a coin from the HUD onto a tray die to flip it (costs 1 coin). When `allowFirstExtreme` is off, I can drag a coin onto a tray 1 or 6 to reroll it to 2–5 (costs 1 coin; takes precedence over flip on extremes). Entering a valid drop target (die slot, empty grid cell, action-bar return zone, or flippable/rerollable tray die) triggers device haptics once per target.

## Exports
- `initDragDrop()` — attaches `pointerdown / pointermove / pointerup / pointercancel` listeners
- `markForbiddenHolders(dieId)` — adds `.is-forbidden` / `.is-hard-forbidden` CSS classes to DOM slots
- `clearForbiddenHolders()` — removes all forbidden classes

## Drag types
- **card drag** — from `.in-tray` or `.converter-card--grid-draggable`; drops onto empty `.grid-slot`
- **die drag** — from `.die--action` or returnable `.die--placed`; 8px movement starts drag; tap toggles selection (tray) or returns to bar (placed-this-turn); drops onto placement hints or action bar return zone
- **coin drag** — from `#score-display.is-coin-draggable`; drops onto tray `.die-wrapper` (no slot): flip die value when `coinFlipDice` on (1↔6, 2↔5, 3↔4), or reroll 1/6 → 2–5 when `allowFirstExtreme` off (1 coin each; reroll wins on extremes)

## Related
[[state]] · [[cards]] · [[phase]] · [[handlers]] · [[render]]
