---
module: settings-panel
layer: ui/display
v: 1.19
date: 2026-07-19
deps: [state, settings, phase, render]
---
# Settings Panel — User Story

As a player, I want to access a hidden settings panel (triple-tap the HUD score) with iOS-style toggles for all game options, and have changes apply when I tap back — not after each toggle. Changes to counts or core rules restart the game; other changes re-render in place.

## Exports
- `renderSettingsPanel()` — builds toggle rows from `SETTINGS_CONFIG` into `#settings-toggles`
- `initSettingsPanel()` — attaches 4-tap listener on `#swept-points` and back-button listener

## Toggle behaviour
- Edits buffer in a draft while the panel is open; **back** applies all, saves, then `resetGame()` or `render()`
- **fastAnimations** → toggles `html.fast-anims` on apply
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
