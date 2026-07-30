---
module: deck-size
layer: logic
v: 1.0
date: 2026-07-30
deps: [state, settings]
---
# Deck Size

Runtime deck counter when `settings.deckSize > 0` (0 = feature off).

## Exports
- `isDeckSizeActive()` — `settings.deckSize > 0`
- `initDeckRemaining()` — seeds `state.deckRemaining` from setting (or `null` when off); called from `resetGame`
- `tickDeckOnConvert()` — decrements `state.deckRemaining` after each stack→tile conversion; returns `'well-done'` when counter hits 0

## Related
[[settings]] · [[convert]] · [[turn]] · [[state]]
