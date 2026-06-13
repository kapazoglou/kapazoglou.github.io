---
module: action-bar
layer: ui/display
v: 1.7
date: 2026-06-14
deps: [state, cards, dice, grid]
---
# Action Bar — User Story

As a player, I need the action bar to show my hand cards during the place-card phase and my tray dice + upcoming preview during the place-dice phase, with smooth slide-in animations when new elements appear.

## Exports
- `renderActionBar()` — rebuilds `#action-bar` innerHTML from state
- `ghostCardHTML(slotCount)` — skeleton card HTML for the action-bar ghost indicator

## Modes
- **place-card**: renders hand cards (`.in-tray`) with `is-new` slide-in if flagged
- **place-dice**: renders dice tray + upcoming preview strip + card ghost

## Animation flags consumed
- `state.newCards` — set of card ids to animate in
- `state.newDice` — set of die ids to animate in
- `state.newPreview` — boolean; triggers preview + ghost slide-in
- `state.newCardAfterPreview` / `state.newPreviewInCard` — sequencing flags
- `state.suppressGhostAnimation` — skips ghost re-animation in full-grid rounds
- `state.ghostReverseIn` — ghost card slide-in after post-dice revert

## Related
[[state]] · [[dice]] · [[grid]] · [[preview-anim]] · [[handlers]]
