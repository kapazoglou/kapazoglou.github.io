---
module: viewport-controls
layer: ui/display
v: 1.4
date: 2026-08-13
deps: []
---
# Viewport Controls

Floating square-frame full-screen button on touch phones (`hover: none`, `pointer: coarse`). Bottom-left in all orientations. Hidden on desktop.

## Exports
- `initViewportControls()` — mount control on `#app`; Fullscreen API on `#app`

## Behaviour
- Full screen: `requestFullscreen` on `#app`; toggles `html.is-browser-fullscreen` for edge-to-edge layout on phone portrait
