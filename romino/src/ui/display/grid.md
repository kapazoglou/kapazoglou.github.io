---
module: grid
layer: ui/display
v: 2.0
date: 2026-06-12
deps: [state, settings, cards, sweeps]
---
# Grid — User Story

As a player, I need to see my cards laid out on a 3×3 (or 4×4) grid with empty slots shown as darkened placeholders. During a sweep I need the exiting cards to visually pop and fly off the board.

## Exports
- `renderGrid()` — rebuilds `#grid-container` innerHTML from state
- `renderCardHTML(cardId, inTray, gridDraggable, opts)` — `opts.gameOver` forces 2-slot domino dice on filled cards
- `renderHolderDice(cardId, si)` — returns HTML for a single die slot (empty or filled)

## CSS classes managed
- `#grid-container.grid-4x4` — extended grid layout
- `#grid-container.is-scoring-sweep` — overflow visible during sweep
- `.grid-slot.is-filled` / `.grid-slot--score-pending` / `.grid-slot--score-sweep--*`
- `--exit-order` CSS custom property on sweep slots for staggered animation

## Filled 2-slot branches
- `vSuitDominoFill` ON (default): domino layout — rank + `&nbsp;`, dice tile stays; class `converter-card--domino`
- `vSuitDominoFill` OFF: compact fill — centered rank + literal **V**, gold, no dice; same structure as filled 3-slot non-V
- Game-over summary (`opts.gameOver`): domino dice on 2-slot filled cards only; 3-slot shows rank + suit

## Filled 1-slot V branches
- `vSuitDominoFill` ON (default): domino layout — `*` rank + blank suit, center die stays; class `converter-card--domino`
- `vSuitDominoFill` OFF: compact fill — `*` rank + literal **V**, gold, no die; unfilled 1-slot V gains `converter-card--1slot-compact-fill` for conversion animation
- Unfilled 1-slot V: top-left `*` + blank index (same pre-conversion pattern as 2-slot) so conversion animation can expand the index
- Non-V 1-slot cards: compact `*` + suit letter regardless of setting

## SQUARE mode (settings.square)
- Early-return from `renderCardHTML` into square renderer
- Layouts via `squareAlignment`: slots 0+1 → `.square-bar--hor` (Figma 5458:17774); slots 1+2 → `.square-bar--ver` (Figma 5458:17814); 3 dice / corners-only / 1 die → center
- Index at bottom-left (36px unfilled, rank on 2 dice); centered 54px on full convert
- `html.square-cards` on root: grid rows 110px, card 110×110

## Related
[[state]] · [[settings]] · [[cards]] · [[sweeps]] · [[sweep-anim]] · [[drag-drop]] · [[handlers]]
