---
module: tutorial-steps
layer: ui/display
v: 1.0
date: 2026-07-28
deps: [state, settings, turn]
---
# Tutorial steps

Step copy and gate predicates for [[tutorial]].

## Exports
- `getTutorialSteps()` — 16-step script (welcome → done)
- `hasEarnedStarSinceStart()` — star HUD pulse on star-matches step

## Related
[[tutorial]] · [[settings]] · [[turn]]
