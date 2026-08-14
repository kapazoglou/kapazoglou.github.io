---
module: pip-anim
layer: ui/transitions
v: 1.11
date: 2026-08-14
deps: [state, settings, hud-v2, timing, dice-visual]
---
# Pip Anim

Row gap → HUD and HUD stars → swept points. Uses convert-style fly (`CONVERT_FLY_MS`, scale + fade); all stars launch together; counter jumps by full total on arrival.

## Exports
- `bankStarsToPoints(starsBeforeBank, lengthFactor, onDone)` — accent `effectiveStars×lengthFactor` (520ms) → product (520ms); 0 stars before bank uses effective 1; pip fly (587ms) then score updates
- `collectStarsToHUD(count, fromRects, onDone)` — row gap → `#hud-stars` after confirm
- `payStarForConvert(col, onDone, count = 1)` — `#hud-stars` → ace/joker stack before convert (mirror of collect)
- `payStarForSlot(col, onDone, count = 1)` — alias for push-from-below star fly (N flyers when cost > 1)
- `payStarForTrayDie(dieId, onDone)` — `#hud-stars` → tray die before outer reroll / flip
- `refundStarFromCol(col, onDone, count = 1)` — stack column → `#hud-stars` after swap refund (mirror of payStarForConvert)

## CSS
- `.star-flyer` — in-viewport star pip (see `pip-anim.css`)

## Related
[[timing]] · [[hud-v2]] · [[sweep-anim]] · [[convert-anim]]
