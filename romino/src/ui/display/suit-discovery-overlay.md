---
module: suit-discovery-overlay
layer: ui/display
v: 1.7
date: 2026-08-17
deps: [suit-tally, dice-visual, settings, music]
---
# Suit discovery overlay

Press-and-hold the HUD suit box (`sweptSuits` ON) to show a session swept-tile discovery grid. First column is the rank header column (V→A, bottom row A); suit cells inline with duplicates on one row. Overlay mounted only while held.

- `initSuitDiscoveryOverlay()` — pointer hold on `.hud-suit-row`; release or window blur unmounts overlay; LoFi music handoff while held (`syncMusicOverlayState`)
