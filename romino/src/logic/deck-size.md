---
module: deck-size
layer: logic
v: 1.3
date: 2026-08-10
deps: [state, settings]
---
# Deck Size

Runtime deck counter when `settings.deckSize > 0` (0 = feature off), or when **Domino Roll** is ON with nRoll 2/3/4. nRoll=4 and nRoll=2 + nPlace=2 domino show counter on seam strip (white circle badge); nRoll 3 and other domino modes use top-left HUD.

## Exports
- `isDominoDeckCountdown()` — domino list drives deck counter
- `isDominoDeckInActionBar()` — nRoll=4 or nRoll=2 + nPlace=2 domino: counter on seam strip, not HUD
- `showDeckInHud()` — HUD deck span when active
- `isDeckSizeActive()` — counter shown when deckSize > 0 or domino countdown
- `initDeckRemaining()` — seeds from setting, or skipped when domino pools init
- `tickDeckOnConvert()` — decrements on convert when deckSize mode only; skipped during domino countdown

## Related
[[settings]] · [[convert]] · [[turn]] · [[state]]
