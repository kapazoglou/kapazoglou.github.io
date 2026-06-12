---
module: drag-drop
layer: ui/display
v: 1.2
date: 2026-06-12
deps: [state, settings, cards, sweeps, scoring, dice, phase, sweep-anim, render, hud, card-anim]
---
# Drag-Drop — User Story

As a player, I want to drag dice from the tray into card slots and drag hand cards onto grid slots. While dragging a die, forbidden slots show a visual indicator. Dropping in a valid slot updates state and advances the game phase.

## Exports
- `initDragDrop()` — attaches `pointerdown / pointermove / pointerup / pointercancel` listeners
- `markForbiddenHolders(dieId)` — adds `.is-forbidden` / `.is-hard-forbidden` CSS classes to DOM slots
- `clearForbiddenHolders()` — removes all forbidden classes

## Drag types
- **card drag** — from `.in-tray` or `.converter-card--grid-draggable`; drops onto empty `.grid-slot`
- **die drag** — from `.die-wrapper`; drops onto `.holder-dice` slot or swaps tray order

## Related
[[state]] · [[cards]] · [[phase]] · [[handlers]] · [[render]]
