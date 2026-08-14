---
module: hud-v2
layer: ui/display
v: 1.13
date: 2026-08-14
deps: [state, settings, deck-size, dice-visual, star-reroll-input]
---
# HUD v2

Swept-suit box at HUD horizontal center with points (left) and stars (right) when `sweptSuits` ON; stars + points centered together when OFF. Optional deck counter absolute left. Triple-tap left points score opens settings.

- `renderHUD()` — rebuilds `#hud` from `state` + `settings`
