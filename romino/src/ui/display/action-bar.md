---
module: action-bar
layer: ui/display
v: 1.59
date: 2026-08-03
deps: [state, cards, dice, grid, end-game-prompt, domino-roll, domino-spots]
---
# Action Bar — User Story

As a player, I need the action bar to show my hand cards during the place-card phase and my tray dice + upcoming preview during the place-dice phase, with smooth slide-in animations when new elements appear.

## Exports
- `renderActionBar()` — rebuilds `#action-bar` innerHTML from state
- **Domino Roll nRoll=4** — dual-pair tray (pipe separator; deck counter badge on seam strip — see domino-spot-strip; fixed slots; toward-`|` on drag/placement; return order preserved per pair)
- `ghostCardHTML(slotCount)` — skeleton card HTML for the action-bar ghost indicator
- Roll button face border (`action-bar.css`): **accent** (`--accent`) when enabled and not warning red; **warning red** when enabled and (`isRollPoolLow()` without a 3-dice stack on the row, or rolled + `isTrayStuck()`). Number text (`.roll-btn--low`) follows `isRollPoolLow()` — nRoll=4 + Domino Spots uses **N-place** threshold; may stay red while border stays accent if a full stack is on the row. Tap: warning-red border → arm KO confirm bar (`isRollButtonEndGameTap` + `end-game-prompt`); armed wrap expands left with white **`&lt;`** back + red **KO** confirm; accent border → idle roll or rolled confirm.

## Modes
- **place-card**: renders hand cards (`.in-tray`) with `is-new` slide-in if flagged
- **place-dice**: renders dice tray + upcoming preview strip + card ghost (or game-over card when stuck)
- **chooseDice ON**: 6-die tray (dice left; offered card, Last Chance, or game-over card right when applicable), ghost below; no upcoming preview
- `lastChanceCardHTML()` — clickable square yellow "LAST / CHANCE" tray card after all 6 dice placed (Averia Libre)

## Animation flags consumed
- `state.newCards` — set of card ids to animate in
- `state.newDice` — set of die ids to animate in
- `state.newPreview` — boolean; triggers preview + ghost slide-in
- `state.newCardAfterPreview` / `state.newPreviewInCard` — sequencing flags
- `state.suppressGhostAnimation` — skips ghost re-animation in full-grid rounds
- `state.ghostReverseIn` — ghost card slide-in after post-dice revert

## Related
[[state]] · [[dice]] · [[grid]] · [[preview-anim]] · [[handlers]]
