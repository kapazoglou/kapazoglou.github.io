---
module: settings-panel
layer: ui/display
v: 1.48
date: 2026-08-15
deps: [state, settings, phase, render, game-log, lifetime-stats-view, highscores]
---
# Settings Panel — User Story

As a player, I want to access a hidden settings panel (triple-tap the left HUD points score) with iOS-style toggles for all game options, and have changes apply when I tap back — not after each toggle. Changes to counts or core rules restart the game; other changes re-render in place.

## Exports
- `renderSettingsPanel()` — builds toggle rows from `SETTINGS_CONFIG` into `#settings-toggles`
- `initSettingsPanel()` — attaches triple-tap listener on `#hud-points` and back-button listener
- `TUTORIAL_DONE_KEY` — localStorage key cleared when `tutoria` toggles OFF→ON on apply

## Lifetime block
- `#settings-lifetime` — bottom of panel (below toggles): summary, stars, dice bars, segmented tile matrix for the **draft** settings config
- Updates on every stepper/toggle edit while panel is open; matrix seg toggles converted vs swept counts

## High scores
- `#settings-clear-highscores` — below lifetime block; idle = padded warning-red button; tap → slide thumb; full-right release clears scores and flashes solid warning red with **DELETED**, then resets

## Toggle behaviour
- Edits buffer in a draft while the panel is open; **back** applies all, saves to localStorage, then reloads the page when anything changed
- If nothing changed, back closes the panel without reload
- Tutoria OFF→ON clears `romino-tutorial-done` before reload so the walkthrough runs again
- `deckFlank` and `tileDealtEvery` / `tileDealtChainDraw` are mutually exclusive in draft (disabled UI + `clampDraft`)

## Related
[[settings]] · [[phase]] · [[render]] · [[hud]] · [[tutorial]]
