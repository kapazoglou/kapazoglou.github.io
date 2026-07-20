---
module: drag-drop
layer: ui/display
v: 2.20
date: 2026-07-20
deps: [state, settings, row, dice-visual, placement-anim, render, placement-input]
---
# Drag-Drop — User Story

As a player, I want to drag dice from the tray onto the row. Dropping in a valid slot updates state. I can drop a die back onto the action bar to return it to the tray.

## Exports
- `initDragDrop()` — attaches `pointerdown / pointermove / pointerup / pointercancel` listeners
- `consumeRowClickBlock()` — one-shot guard so return-to-bar tap is not followed by a row click re-place

## Die drag
- Tap on returnable (this-turn) placed die returns it to the tray and keeps it selected; tray die tap still toggles selection
- Drag to action bar still clears selection
- Drag uses the same `.placement-die-flyer` as commit placement — spawns at the source die's exact position in `.viewport-inner`, then follows the pointer; hands off on drop (no separate `#drag-ghost`)
- Tray die removed from action bar on drag start
- Sole-die row reposition: source gap closes on drag via `reposition-collapse`
- **`directPlacement` ON** — gap spread preview **during drag only**; drop resolves slot from pointer coordinates via `attemptPlacementAtPoint` (uses flyer top edge, not finger Y)
- **`directPlacement` OFF** — drop onto `.placement-hint` buttons

## Related
[[state]] · [[handlers]] · [[render]] · [[placement-input]]
