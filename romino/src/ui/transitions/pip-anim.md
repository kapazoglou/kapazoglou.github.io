---
module: pip-anim
layer: ui/transitions
v: 1.4
date: 2026-07-23
deps: [state, settings, hud-v2, timing, dice-visual]
---
# Pip Anim

Row gap → HUD and HUD stars → swept points. Uses convert-style fly (`CONVERT_FLY_MS`, scale + fade); all stars launch together; counter jumps by full total on arrival.

## Exports
- `bankStarsToPoints(count, onDone)` — visual-only after state already updated
- `collectStarsToHUD(count, fromRects, onDone)` — row gap → `#hud-stars` after confirm
- `payStarForConvert(col, onDone)` — `#hud-stars` → ace/joker stack before convert (mirror of collect)
- `payStarForTrayDie(dieId, onDone)` — `#hud-stars` → tray die before outer reroll

## CSS
- `.star-flyer` — in-viewport star pip (see `pip-anim.css`)

## Related
[[timing]] · [[hud-v2]] · [[sweep-anim]] · [[convert-anim]]
