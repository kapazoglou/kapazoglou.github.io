---
module: handlers
layer: ui/display
v: 2.10
date: 2026-08-03
deps: [state, settings, row, turn, end-game-prompt, placement-anim, render, placement-input]
---
# Handlers — User Story

As a player, I want to tap dice and cards to select and place them.

## Exports
- `initHandlers()` — click listener for roll/confirm/KO confirm; hint/ghost placement when `directPlacement` is off; coordinate placement via `attemptPlacementAtPoint` when on; deselect on empty row tap (not on `.placement-tile--returnable`). Die tap-to-select handled via drag-drop pointer-up (8px tap vs drag threshold). Roll wrap: warning-red number tap → arm KO bar; armed number tap → disarm; KO tap → `commitRollButtonGameOver`; normal roll returning `{ pendingEndGame }` → auto-arm.

## Related
[[state]] · [[settings]] · [[drag-drop]] · [[render]] · [[placement-input]]
