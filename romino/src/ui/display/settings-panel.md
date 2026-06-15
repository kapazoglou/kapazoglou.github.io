---
module: settings-panel
layer: ui/display
v: 1.6
date: 2026-06-15
deps: [state, settings, phase, render]
---
# Settings Panel — User Story

As a player, I want to access a hidden settings panel (tap the card-count 4 times) with iOS-style toggles for all game options, and have changes take effect immediately. Changes to grid size or deck composition restart the game; other changes re-render in place.

## Exports
- `renderSettingsPanel()` — builds toggle rows from `SETTINGS_CONFIG` into `#settings-toggles`
- `initSettingsPanel()` — attaches 4-tap listener on `#card-count` and back-button listener

## Toggle behaviour
- **fastAnimations** → toggles `html.fast-anims` class immediately
- **peekUnconvertedLayout** (off) → clears `state.peekUnconvertedCards`
- **extendedGrid / extraStartCards / blankDie / filterExtremes** → closes panel + calls `resetGame()`
- All others → calls `render()`

## Related
[[settings]] · [[phase]] · [[render]] · [[hud]]
