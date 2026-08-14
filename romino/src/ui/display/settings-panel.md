---
module: settings-panel
layer: ui/display
v: 1.55
date: 2026-08-15
deps: [state, settings, phase, render, game-log, lifetime-stats-view, highscores]
---
# Settings Panel — User Story

As a player, I want to access a hidden settings panel (double-tap the left HUD points score) with iOS-style toggles for all game options, and have changes apply when I close — not after each toggle. Changes to counts or core rules restart the game; other changes re-render in place.

## Exports
- `renderSettingsPanel()` — builds toggle rows from `SETTINGS_CONFIG` into `#settings-toggles` (skips `deprecated` group)
- `initSettingsPanel()` — attaches double-tap listener on `#hud-points` and close-button listener
- `.settings-credit` — static `röminó © YEAR — kapazoglou manoli` under CONFIG header (`index.html`)
- `TUTORIAL_DONE_KEY` — localStorage key cleared when `tutoria` toggles OFF→ON on apply

## Lifetime block
- `#settings-lifetime` — bottom of panel (below toggles): summary, stars, dice bars, segmented tile matrix for the **draft** settings config
- Updates on every stepper/toggle edit while panel is open; matrix seg toggles converted vs swept counts

## High scores
- `#settings-clear-highscores` — below lifetime block; idle = padded warning-red button; tap → slide thumb; full-right release clears scores and flashes solid warning red with **DELETED**, then resets

## Toggle behaviour
- Edits buffer in a draft while the panel is open; **close (×)** applies all, saves to localStorage, then reloads the page when game settings changed
- `fullScreen` applies on close without reload (Fullscreen API via `viewport-controls`)
- If nothing changed, close dismisses the sidebar without reload
- Tutoria OFF→ON clears `romino-tutorial-done` before reload so the walkthrough runs again
- `deckFlank` and `tileDealtEvery` / `tileDealtChainDraw` are mutually exclusive in draft (disabled UI + `clampDraft`)

## Related
[[settings]] · [[phase]] · [[render]] · [[hud]] · [[tutorial]]
