---
module: convert-anim
layer: ui/transitions
v: 1.21
date: 2026-08-10
deps: [state, settings, convert, render, timing, dice-visual]
---
# Convert Anim

Salvaged from Square `card-anim`: tray slide-in + stack→tile conversion sequence.

## Exports
- `processConverts(cols, index, onDone, wellDoneResult?)` — ace/joker/switcher: star pay fly first, then convert anim then mutate; matching flank tops swept after each convert
- `animateConverts(onDone)` — queue all full stacks on the row; passes `'well-done'` when convert-match discard empties both flank stacks or deck-size counter hits 0
- `animateConvertFlyBack(col, onDone)` — (internal) top-first stagger to roll button; when `tileDiceHold` ON, flies 2 of 3 (withheld die hidden, no flyer)
- `animateSwitcherJokerConvert(col, onDone)` — (internal) when `switcherJokers` ON: merge + missing-suit crossfade; mid+top arc-fly; bottom die stays (no rank cube / shell)
- `animateCubeConvert(col, onDone)` — (internal) when `diceAndCubes` ON: overlay-blend top→mid merge **with rank cube fade in parallel**; mid/top hidden when merge ends; then scale-down + arc fly + suit-color glyph + inset stroke
- `animateCubeJokerConvert(col, onDone)` — (internal) joker branch: top→mid merge; mid+top collapse to bottom while missing-suit die crossfades in at bottom suit slot; all three stack dice arc-fly from bottom suit die at 50% opacity

## CSS
- `.die--action.is-new` — action-bar slide-in
- `.placement-tile.is-new` — tile enter pop
- `.placement-tile-cube.is-new` — cube tile enter pop (via dice-cubes.css)
- `.cube-convert-rank-overlay` — merge phase: rank cube absolutely positioned on mid die (z-index 3); full shell assembled when merge ends
- `.placement-die-flyer--cube-convert` — arc fly on `.viewport-inner` (z-index 650, 50% opacity, fades out on landing)
- `.placement-col.is-switcher-converting` — switcher convert column isolation (overflow visible)

## Related
[[timing]] · [[convert]] · [[confirm-anim]] · [[render]] · [[placement-anim]]
