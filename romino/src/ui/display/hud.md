---
module: hud
layer: ui/display
v: 2.7
date: 2026-07-10
deps: [state, cards, dice, grid, sweeps]
---
# HUD — User Story

As a player, I need to see my remaining deck size (card countdown) on the left and my current coin score on the right, updated after every game action. Centred in the HUD row, a live suit tally shows swept cards per suit (discovery-fill tiles with counts, Z–W starting at 0). In 4-square mode, a live 4×13 discovery grid sits above the HUD and fills in as cards convert. With **Fill Discovery** on, rank columns stack bottom-up (A…V headers) using suit-colour tiles.

## Exports
- `renderHUD()` — updates `#card-count` (deck remaining, or ∞ when random dice), `#hud-tally` (swept suit counts), and `#score-display` inside `#hud-score` (coins); adds `.is-coin-draggable` when `coinFlipDice` + place-dice + score > 0
- `renderDiscoveryGrid()` — updates `#discovery-grid` (4×13 suit/rank grid when `fourSquare` ON; fill-discovery layout when `fillDiscovery` ON); stays visible during replay / game-over sheet
- `discoveryGridHTML()` — shared markup for live + game-over grids (standard four-square or fill-discovery)
- `sweepListHTML()` — game-over sweep rows: comma-separated mini cards per scored set (no rule labels)
- `renderDiscards()` — updates the hidden discard-stacks DOM (data for potential future UI)
- `initDiscards()` — builds discard label row and calls `renderDiscards()`

## Related
[[state]] · [[dice]] · [[cards]] · [[scoring]] · [[card-anim]]
