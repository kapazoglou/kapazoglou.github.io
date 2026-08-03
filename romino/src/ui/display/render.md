---
module: render
layer: ui/display
v: 1.7
date: 2026-08-03
deps: [state, cards, grid, action-bar, hud, tutorial]
---
# Render — User Story

As the UI system, I need a single `render()` function that re-paints the entire game view from state, so that any module can trigger a full redraw with one call.

## Exports
- `render()` — calls `renderPlacementRow()`, `renderDealtStrip()`, `renderDominoSpotStrip()`, `renderHUD()`, `renderActionBar()`, toggles `.separator.is-spots-full`; positions edge ghosts + hints + domino spot strip in rAF; `onTutorialRender()` when tutoria active
- `renderSelection()` — selection-only path: updates die selection classes, edge ghosts, hints, domino spot strip, and action bar without rebuilding row columns/tiles

## Notes
- During `state.phase === 'replay'` the action bar is frozen; only grid/hud/discards are refreshed.
- All render functions are idempotent — calling `render()` twice produces the same DOM.

## Related
[[grid]] · [[action-bar]] · [[hud]] · [[state]] · [[phase]]
