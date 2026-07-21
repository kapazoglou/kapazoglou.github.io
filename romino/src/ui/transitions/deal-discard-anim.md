---
module: deal-discard-anim
layer: transitions
v: 1.1
date: 2026-07-21
deps: [state.js, timing.js, render.js]
---
# Deal discard animation

Sequential sweep-style discard when a cadence deal draws a tile already on the row.

`runDealDiscardAnimations(onDone)` — animates `dealingDiscardTile` queue from action bar, then calls `onDone`.
