---
module: tutorial
layer: ui/display
v: 1.0
date: 2026-07-28
deps: [settings, settings-panel, tutorial-steps, state, turn]
---
# Tutorial (Tutoria)

Hybrid tooltip walkthrough when `settings.tutoria` is ON and `romino-tutorial-done` is unset.

## Exports
- `shouldStartTutorial()` — tutoria ON and not completed
- `initTutorial()` — mount overlay, start step 0
- `isTutorialActive()` — overlay running
- `onRender()` — refresh highlight/card position after `render()`

## Steps
Defined in [[tutorial-steps]] — 16 steps (info + gate). Gates read `state.phase` / `state.placedThisTurn`. Star step appends fallback copy after 60s if no star earned.

## Completion
Skip or final **Play** sets `romino-tutorial-done`. Cleared when Tutoria toggles OFF→ON in settings apply.

## Related
[[settings-panel]] · [[render]] · [[tutorial-steps]]
