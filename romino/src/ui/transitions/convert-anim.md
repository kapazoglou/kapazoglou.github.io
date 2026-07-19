---
module: convert-anim
layer: ui/transitions
v: 1.0
date: 2026-07-19
deps: [state, settings, convert, render, timing]
---
# Convert Anim

Salvaged from Square `card-anim`: tray slide-in + stack→tile conversion sequence.

## Exports
- `processConverts(cols, index, onDone)` — sequential `.is-converting` then mutate
- `animateConverts(onDone)` — queue all full stacks on the row

## CSS
- `.die--action.is-new` — action-bar slide-in
- `.placement-col--stack.is-converting` — dice fadeout
- `.placement-tile.is-new` — tile enter pop

## Related
[[timing]] · [[convert]] · [[confirm-anim]] · [[render]]
