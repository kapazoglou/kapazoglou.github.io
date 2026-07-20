---
module: handlers
layer: ui/display
v: 2.7
date: 2026-07-20
deps: [state, settings, row, turn, game-over, placement-anim, render, placement-input]
---
# Handlers — User Story

As a player, I want to tap dice and cards to select and place them.

## Exports
- `initHandlers()` — click listener for roll/confirm; hint/ghost placement when `directPlacement` is off; coordinate placement via `attemptPlacementAtPoint` when on; deselect on empty row tap. Die tap-to-select handled via drag-drop pointer-up (8px tap vs drag threshold)

## Related
[[state]] · [[settings]] · [[drag-drop]] · [[render]] · [[placement-input]]
