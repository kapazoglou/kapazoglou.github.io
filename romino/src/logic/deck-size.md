---
module: deck-size
layer: logic
v: 1.5
date: 2026-08-15
deps: [state, settings]
---
# Deck Size

Runtime deck counter when `settings.deckSize > 0` (0 = feature off), or when **Domino Roll** is ON with nRoll 1/2/3/4. nRoll=4, nRoll=2 + nPlace=2, and nRoll=1 + Domino Spots show counter on seam strip (white circle badge; tap toggles spot visibility); nRoll 1 Spots OFF, nRoll 3 and other domino modes use top-left HUD.

## Exports
- `isDominoDeckCountdown()` — domino list drives deck counter
- `isDominoDeckInActionBar()` — nRoll=4, nRoll=2 + nPlace=2, or nRoll=1 + Domino Spots: counter on seam strip, not HUD
- `showDeckInHud()` — HUD deck span when active
- `isDeckSizeActive()` — counter shown when deckSize > 0 or domino countdown
- `initDeckRemaining()` — seeds from setting, or skipped when domino pools init
- `tickDeckOnConvert()` — decrements on convert when deckSize mode only; skipped during domino countdown

## Related
[[settings]] · [[convert]] · [[turn]] · [[state]]
