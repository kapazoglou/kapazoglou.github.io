---
module: render
layer: ui/display
v: 1.8
date: 2026-08-14
deps: [state, cards, grid, action-bar, hud, tutorial, domino-spots, turn]
---
# Render — User Story

As the UI system, I need a single `render()` function that re-paints the entire game view from state, so that any module can trigger a full redraw with one call.

## Exports
- `render()` — calls `renderPlacementRow()`, `syncAllRowDominoSpots()` (game over if any column unassigned), `renderDealtStrip()`, …
- `renderSelection()` — selection-only path: updates die selection classes, edge ghosts, hints, domino spot strip, and action bar without rebuilding row columns/tiles

## Notes
- During `state.phase === 'replay'` the action bar is frozen; only grid/hud/discards are refreshed.
- All render functions are idempotent — calling `render()` twice produces the same DOM.

## Related
[[grid]] · [[action-bar]] · [[hud]] · [[state]] · [[phase]]
