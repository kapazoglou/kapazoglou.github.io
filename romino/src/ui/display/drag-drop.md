---
module: drag-drop
layer: ui/display
v: 2.3
date: 2026-06-21
deps: [state, settings, cards, sweeps, scoring, dice, phase, sweep-anim, render, hud, card-anim, preview-anim, haptics]
---
# Drag-Drop — User Story

As a player, I want to drag dice from the tray into card slots and drag hand cards onto grid slots. While dragging a die, forbidden slots show a visual indicator. Dropping in a valid slot updates state and advances the game phase. I can drop a die back onto the action bar to return it to the tray. With `coinFlipDice` on, I can drag a coin from the HUD onto a tray die to flip it (costs 1 coin). Entering a valid drop target (die slot, empty grid cell, action-bar return zone, or flippable tray die) triggers device haptics once per target.

## Exports
- `initDragDrop()` — attaches `pointerdown / pointermove / pointerup / pointercancel` listeners
- `markForbiddenHolders(dieId)` — adds `.is-forbidden` / `.is-hard-forbidden` CSS classes to DOM slots
- `clearForbiddenHolders()` — removes all forbidden classes

## Drag types
- **card drag** — from `.in-tray` or `.converter-card--grid-draggable`; drops onto empty `.grid-slot`
- **die drag** — from `.die-wrapper`; drops onto `.holder-dice` slot, swaps tray order, or returns to tray via `#action-bar` drop (hover shows die in tray + post-dice hand card as ghost, selected on release)
- **coin drag** — from `#score-display.is-coin-draggable`; drops onto tray `.die-wrapper` (no slot) to flip die value (1↔6, 2↔5, 3↔4) for 1 coin

## Related
[[state]] · [[cards]] · [[phase]] · [[handlers]] · [[render]]
