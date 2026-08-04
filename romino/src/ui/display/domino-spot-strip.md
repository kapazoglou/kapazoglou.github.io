---
module: domino-spot-strip
layer: ui/display
v: 2.19
date: 2026-08-04
deps: [domino-spots.js, domino-roll.js, dice-visual.js, flank-stacks.js, render.js]
---
# Domino spot strip (display)

Between-zone domino glyphs on the row↔tray seam when `dominoSpots` ON. Horizontal row: 20×20px dice, 1px white border, −1px overlap; pair width 39px (2×20 − 1). White face + colored pips (inverted). Touching inner corners square; outer corners rounded. Vertically centred in the gap between column bottom and seam (`--domino-seam-offset` from live layout). Column-aligned until sweep.

**Discard pile** (dominoSpots ON): same `dominoStackHTML` glyphs in a horizontal LTR row (2px gap, wraps) under the roll button; vertically centred in band when content fits, `overflow-y: auto` when wrapped rows exceed band; equal top/bottom/right inset when centred; hidden with seam spots via deck-badge toggle.

## Exports
- `setDominoSpotStackDragSuppressed(col, suppressed)` — hide one stack during sole-die spot drag (no strip rebuild)
- Sweep exit — `domino-spot-stack--sweep-pending` / `--sweep-run` CSS mirrors tile beat pop + `row-sweep-v`
- `renderDominoSpotStrip()` — rebuild from `getActiveDominoSpotCols()` + column `dominoKey`
- `renderDominoDiscardPile()` / `positionDominoDiscardPile()` — discard pile under roll button
- `toggleDominoSpotsVisibility()` / `syncDominoSpotsVisibility()` — deck badge tap hides/shows seam domino glyphs and discard pile
- `renderActionBarDeckBadge()` — nRoll=4 domino deck counter (white circle, `--bg` text; warning-red below 2; tap toggles spot visibility)
- `positionActionBarDeck()` — seam-row Y (domino-spot offset); X over roll-button die centre
- `positionDominoSpotStrip()` — map each stack to live column centre (incl. spread transforms); also runs `positionActionBarDeck()`
- `scheduleDominoSpotStripLayout()` — double-rAF position after row layout/scroll settle; hidden until positioned
- `syncDominoSpotStripDuringMotion(extraMs?)` — rAF follow during column spread/collapse
- `initDominoSpotStrip()` — passive scroll listener on `#placement-row`
