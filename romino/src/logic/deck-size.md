---
module: deck-size
layer: logic
v: 1.2
date: 2026-08-03
deps: [state, settings]
---
# Deck Size

Runtime deck counter when `settings.deckSize > 0` (0 = feature off), or when **Domino Roll** is ON with nRoll 2/3/4. nRoll=4 domino shows counter under action-bar `|` (half HUD size); nRoll 2/3 and deckSize-only use top-left HUD.

## Exports
- `isDominoDeckCountdown()` — domino list drives deck counter
- `isDominoDeckInActionBar()` — nRoll=4 domino: counter in action bar, not HUD
- `showDeckInHud()` — HUD deck span when active
- `isDeckSizeActive()` — counter shown when deckSize > 0 or domino countdown
- `initDeckRemaining()` — seeds from setting, or skipped when domino pools init
- `tickDeckOnConvert()` — decrements on convert when deckSize mode only; skipped during domino countdown

## Related
[[settings]] · [[convert]] · [[turn]] · [[state]]
