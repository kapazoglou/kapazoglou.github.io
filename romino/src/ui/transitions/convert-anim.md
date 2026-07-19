---
module: convert-anim
layer: ui/transitions
v: 1.1
date: 2026-07-19
deps: [state, settings, convert, render, timing, dice-visual]
---
# Convert Anim

Salvaged from Square `card-anim`: tray slide-in + stack→tile conversion sequence.

## Exports
- `processConverts(cols, index, onDone)` — sequential fly-back then mutate
- `animateConverts(onDone)` — queue all full stacks on the row
- `animateConvertFlyBack(col, onDone)` — (internal) top-first stagger to roll button

## CSS
- `.die--action.is-new` — action-bar slide-in
- `.placement-tile.is-new` — tile enter pop

## Related
[[timing]] · [[convert]] · [[confirm-anim]] · [[render]] · [[placement-anim]]
