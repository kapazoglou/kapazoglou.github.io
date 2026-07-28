---
module: viewport-controls
layer: ui/display
v: 1.0
date: 2026-07-28
deps: []
---
# Viewport Controls

Floating **− / + / ⛶** bar on touch phones (`hover: none`, `pointer: coarse`). Hidden on desktop.

## Exports
- `initViewportControls()` — mount controls on `#app`; wire zoom (`--user-zoom` on `<html>`) and Fullscreen API on `#app`

## Behaviour
- Zoom: 0.75–1.5 in 0.05 steps via `.viewport { transform: scale() }`
- Full screen: `requestFullscreen` on `#app`; toggles `html.is-browser-fullscreen` for edge-to-edge layout on phone portrait
