---
module: handlers
layer: ui/display
v: 2.14
date: 2026-08-14
deps: [state, settings, row, turn, end-game-prompt, placement-anim, render, placement-input, stack-swap-anim]
---
# Handlers — User Story

As a player, I want to tap dice and cards to select and place them.

## Exports
- `initHandlers()` — click listener for roll/confirm/KO confirm; hint/ghost placement when `directPlacement` is off; coordinate placement via `attemptPlacementAtPoint` when on; deselect on empty row tap (not on `.placement-tile--returnable`). Die tap-to-select handled via drag-drop pointer-up (8px tap vs drag threshold). `consumeRowClickBlock()` runs first (all modes): a tap that already returned/refunded a die swallows its trailing click so it can't re-trigger push-below or placement on the same target (fixes tap-to-return of a pushed die getting instantly re-pushed). Click on a swap-paid stack of settled dice (`isSwapRefundableDie` and not returnable) → `tryRefundSwapStack` (reverse + refund); this-turn swapped dice are draggable so they route through drag-drop instead. Roll wrap: warning-red number tap → arm KO bar; armed number tap → disarm; KO tap → `commitRollButtonGameOver`; normal roll returning `{ pendingEndGame }` → auto-arm.

## Related
[[state]] · [[settings]] · [[drag-drop]] · [[render]] · [[placement-input]]
