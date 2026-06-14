---
module: handlers
layer: ui/display
v: 1.5
date: 2026-06-14
deps: [state, settings, cards, scoring, dice, sweeps, phase, sweep-anim, render, hud, card-anim, drag-drop]
---
# Handlers — User Story

As a player, I want to tap dice and cards to select and place them. I also want a long-press on the action bar to trigger autoplay mode — the game automatically places cards and dice while I hold down. When `autoplayFirstTwo` is on, the first two cards are placed automatically.

## Exports
- `initHandlers()` — attaches the main `document` click listener for tap-to-select/place; when `peekUnconvertedLayout` is on, tap filled grid cards toggles pre-conversion layout peek
- `initAutoplay()` — attaches long-press listeners on `#action-bar`
- `autoplayCardStep(onDone)` — places one action-bar card on a random empty grid slot
- `autoplayDiceStep(onDone)` — places all tray dice in random valid slots
- `autoplayStep(onDone)` — dispatches to card or dice autoplay based on current phase

## Long-press flow
1. `pointerdown` on action bar → start 600 ms timer
2. On fire: `_longPressActive = true` → `_autoplayLoop()` runs steps continuously
3. `pointerup / pointercancel / pointermove > 8px` → stops the loop

## Related
[[state]] · [[settings]] · [[phase]] · [[drag-drop]] · [[render]] · [[sweep-anim]]
