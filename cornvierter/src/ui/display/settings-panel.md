---
module: settings-panel
layer: ui/display
v: 1.16
date: 2026-07-11
deps: [state, settings, phase, render]
---
# Settings Panel — User Story

As a player, I want to access a hidden settings panel (tap the swept-points 4 times) with iOS-style toggles for all game options, and have changes take effect immediately. Changes to grid size or deck composition restart the game; other changes re-render in place.

## Exports
- `renderSettingsPanel()` — builds toggle rows from `SETTINGS_CONFIG` into `#settings-toggles`
- `initSettingsPanel()` — attaches 4-tap listener on `#swept-points` and back-button listener

## Toggle behaviour
- **fastAnimations** → toggles `html.fast-anims` class immediately
- **peekUnconvertedLayout** (off) → clears `state.peekUnconvertedCards`
- **extendedGrid / extraStartCards / emptyCards / sweepThreeInRow / blankDie / filterExtremes / chooseDice / fillDiscovery / oneToOne / forbidThirdExtreme / progressiveDicePlacement / progressiveSuitJoker** → closes panel + calls `resetGame()`
- **oneToOne** — disabled when `fourSquare` is off
- **fillDiscovery** — disabled when `fourSquare` is off
- **fillDiscoveryEnd** — disabled when `fourSquare` is off; `render()` only (no reset)
- **progressiveDicePlacement** — disabled when `fourSquare` is off
- **chooseDice** — disabled when `diceDecks` is on; enabling forces `diceDecks` off
- **partialUniqueIndex** — disabled when `progressiveDicePlacement` is on (no effect while progressive is active)
- **forbidThirdExtreme** — disabled when `fourSquare` is off or `oneToOne` is on
- All others → calls `render()`

## Related
[[settings]] · [[phase]] · [[render]] · [[hud]]
