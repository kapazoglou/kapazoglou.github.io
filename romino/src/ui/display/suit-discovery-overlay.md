---
module: suit-discovery-overlay
layer: ui/display
v: 1.5
date: 2026-08-13
deps: [suit-tally, dice-visual, settings]
---
# Suit discovery overlay

Press-and-hold the HUD suit box (`sweptSuits` ON) to show a session swept-tile discovery grid. First column is the rank header column (A–12, V); suit cells inline with duplicates on one row. Overlay mounted only while held.

- `initSuitDiscoveryOverlay()` — pointer hold on `.hud-suit-row`; release or window blur unmounts overlay
