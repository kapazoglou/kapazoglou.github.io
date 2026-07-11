---
module: hud
layer: ui/display
v: 3.1
date: 2026-07-11
deps: [state, cards, grid, sweeps]
---
# HUD — User Story

As a player, I need to see my swept points (banked coins from completed sweeps) on the left and my current coin score on the right, updated after every game action. Centred in the HUD row, a live suit tally shows swept cards per suit (discovery-fill tiles with counts, Z–W starting at 0). In 4-square mode, a live 4×13 discovery grid sits above the HUD and fills in as cards convert. With **Fill Discovery** on, rank columns stack bottom-up (A…V headers) using suit-colour tiles.

## Exports
- `renderHUD()` — updates `#swept-points`, `#hud-tally`, `#score-display`; during replay also mirrors into `#go-hud` on the game-over sheet
- `renderDiscoveryGrid()` — updates `#discovery-grid` (4×13 suit/rank grid when `fourSquare` ON; fill-discovery layout when `fillDiscovery` ON); stays visible during replay / game-over sheet
- `discoveryGridHTML()` — shared markup for live + game-over grids (standard four-square or fill-discovery)
- `sweepListHTML()` — game-over sweep groups: mini cards per scored set, spaced via `.go-sweeps-inline` CSS (no rule labels)
- `renderDiscards()` — updates the hidden discard-stacks DOM (data for potential future UI)
- `initDiscards()` — builds discard label row and calls `renderDiscards()`

## Related
[[state]] · [[dice]] · [[cards]] · [[scoring]] · [[card-anim]]
