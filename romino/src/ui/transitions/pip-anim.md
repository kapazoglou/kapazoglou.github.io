---
module: pip-anim
layer: ui/transitions
v: 1.16
date: 2026-08-14
deps: [state, settings, hud-v2, timing, dice-visual]
---
# Pip Anim

Row gap → HUD and HUD stars → swept points. Uses convert-style fly (`CONVERT_FLY_MS`, scale + fade); all stars launch together; counter jumps by full total on arrival. Flyers mount on `#star-fly-layer` (`--z-star-fly: 850`, above all in-game anim layers).

## Exports
- `starFlyLayer()` — dedicated top z-index container inside `.viewport-inner`
- `bankStarsToPoints(starsBeforeBank, lengthFactor, onDone)` — accent `effectiveStars×lengthFactor` (520ms) → product (520ms); 0 stars before bank uses effective 1; pip fly (587ms) then score updates
- `collectStarsToHUD(count, fromRects, onDone)` — row gap → `#hud-star-pay` after confirm
- `payStarForConvert(..., { skipFly, deductState })` — `#hud-star-pay` → stack column; `deductState` updates star count text only (no full HUD rebuild)
- `payStarForSlot(col, onDone, count = 1)` — alias for push-from-below star fly (N flyers when cost > 1)
- `payStarForTrayDie(dieId, onDone, { skipFly })` — `#hud-star-pay` → tray die before outer reroll / flip
- `refundStarFromCol(col, onDone, count, { fromRow })` — fly from vertical die gap when set; HUD shows credited balance (no double subtract)

## CSS
- `#star-fly-layer` — top z-index star container (`--z-star-fly`)
- `.star-flyer` — star pip inside fly layer (see `pip-anim.css`)

## Related
[[timing]] · [[hud-v2]] · [[sweep-anim]] · [[convert-anim]]
