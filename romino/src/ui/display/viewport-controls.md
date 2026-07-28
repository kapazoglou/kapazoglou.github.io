---
module: viewport-controls
layer: ui/display
v: 1.2
date: 2026-07-29
deps: []
---
# Viewport Controls

Floating **⛶** full-screen button on touch phones (`hover: none`, `pointer: coarse`). Hidden on desktop.

## Exports
- `initViewportControls()` — mount control on `#app`; Fullscreen API on `#app`

## Behaviour
- Full screen: `requestFullscreen` on `#app`; toggles `html.is-browser-fullscreen` for edge-to-edge layout on phone portrait
