---
module: convert-anim
layer: ui/transitions
v: 1.4
date: 2026-07-30
deps: [state, settings, convert, render, timing, dice-visual]
---
# Convert Anim

Salvaged from Square `card-anim`: tray slide-in + stack→tile conversion sequence.

## Exports
- `processConverts(cols, index, onDone, wellDoneResult?)` — ace/joker: star pay fly first, then fly-back then mutate; matching flank tops swept after each convert
- `animateConverts(onDone)` — queue all full stacks on the row; passes `'well-done'` when convert-match discard empties both flank stacks or deck-size counter hits 0
- `animateConvertFlyBack(col, onDone)` — (internal) top-first stagger to roll button

## CSS
- `.die--action.is-new` — action-bar slide-in
- `.placement-tile.is-new` — tile enter pop

## Related
[[timing]] · [[convert]] · [[confirm-anim]] · [[render]] · [[placement-anim]]
