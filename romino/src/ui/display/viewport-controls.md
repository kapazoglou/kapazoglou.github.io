---
module: viewport-controls
layer: ui/display
v: 1.7
date: 2026-08-17
deps: [settings]
---
# Viewport Controls

Fullscreen API wiring for `#app`. No on-screen button — toggled via **Full screen** in settings (Keep group).

## Exports
- `initViewportControls()` — fullscreen change listeners; boot enter when saved pref is on (may fail without user gesture)
- `setFullscreenEnabled(want)` — enter/exit full screen; syncs `html.is-browser-fullscreen`

## Behaviour
- Full screen: `requestFullscreen` on `#app`; toggles `html.is-browser-fullscreen` for edge-to-edge layout
- Layout: width-first fit (`design-width-min` scaled to frame width); design height extends for tall screens; ultrawide expands design width at base height
- Frame + scale synced from `#app` client box on enter/resize/exit
- Exiting via browser chrome clears saved `fullScreen` pref
- Changing `fullScreen` in settings applies on close without page reload
