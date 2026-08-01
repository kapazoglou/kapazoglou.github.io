---
module: deck-size
layer: logic
v: 1.1
date: 2026-08-01
deps: [state, settings]
---
# Deck Size

Runtime deck counter when `settings.deckSize > 0` (0 = feature off), or when **Domino Roll** is ON with nRoll 2/3/4 (HUD counter tracks remaining combo-list entries even if deckSize is 0).

## Exports
- `isDominoDeckCountdown()` — domino list drives HUD counter
- `isDeckSizeActive()` — HUD shown when deckSize > 0 or domino countdown
- `initDeckRemaining()` — seeds from setting, or skipped when domino pools init
- `tickDeckOnConvert()` — decrements on convert when deckSize mode only; skipped during domino countdown

## Related
[[settings]] · [[convert]] · [[turn]] · [[state]]
