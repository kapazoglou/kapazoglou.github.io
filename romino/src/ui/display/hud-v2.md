---
module: hud-v2
layer: ui/display
v: 1.11
date: 2026-08-13
deps: [state, settings, deck-size, dice-visual, star-reroll-input]
---
# HUD v2

Swept-suit box at HUD horizontal center with stars (left) and points (right) when `sweptSuits` ON; stars + points centered together when OFF. Optional deck counter absolute left. Triple-tap score opens settings.

- `renderHUD()` — rebuilds `#hud` from `state` + `settings`
