---
module: pip-anim
layer: ui/transitions
v: 1.3
date: 2026-07-21
deps: [state, settings, hud-v2, timing, dice-visual]
---
# Pip Anim

Row gap → HUD and HUD stars → swept points. Uses convert-style fly (`CONVERT_FLY_MS`, scale + fade); all stars launch together; counter jumps by full total on arrival.

## Exports
- `bankStarsToPoints(count, onDone)` — visual-only after state already updated
- `collectStarsToHUD(count, fromRects, onDone)` — row gap → `#hud-stars` after confirm
- `payStarForConvert(col, onDone)` — `#hud-stars` → ace/joker stack before convert (mirror of collect)

## CSS
- `.star-flyer` — in-viewport star pip (see `pip-anim.css`)

## Related
[[timing]] · [[hud-v2]] · [[sweep-anim]] · [[convert-anim]]
