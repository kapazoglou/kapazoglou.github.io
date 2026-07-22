---
topologyPhase: row
lastVerified: 2026-07-21
---

# römino — Verified Pattern State

## Topology phase

**row** — v2 row-based dice game; Square v1 removed.

## State ownership

| Domain | Home | Notes |
|--------|------|-------|
| Game state | `src/logic/state.js` | row map, pool, stars, points, rollCount, `jokerSuitsUsed` |
| Highscores | `src/logic/highscores.js` | localStorage top-10 |
| Settings | `src/logic/settings.js` | nDice/nRoll/nPlace/nSpots + toggles incl. `tileDealtEvery`, `tileDealtChainDraw`, `directPlacement`, `suitRestriction`, `consecutiveStars`, `verticalStars`, `aceJokerStarCost`, `tricolors`, `tricolorSevens`, `jokerFlushOnly` |
| DOM | Derived | `render()` only |

## Entry & render path

`index.html` → `src/main.js` → init → `render()` → hud-v2, placement-row, action-bar

## High-centrality modules

- `src/logic/turn.js` — roll / confirm pipeline
- `src/logic/row.js` — placement rules
- `src/ui/display/handlers.js` — input

## Modified this session

- **row.js v1.33** — tricolor: dead 2-dice stacks (joker suit already spent) no longer block another column's tricolor completion

- **settings.js v2.16, convert.js v1.8, row.js v1.32** — `aceJokerStarCost` toggle (default ON); OFF skips star deduction, placement block, and convert star-fly anim

- **settings.js v2.15, stars.js v1.4, placement-row.js** — `verticalStars` toggle extends star detection to vertically adjacent stack dice

- **row.js v1.30, convert.js v1.7, dice-visual.js v2.10, pip-anim.js v1.3, convert-anim.js v1.2, invalid-flash.js v1.1, placement-input.js v1.2, hud-v2.css** — ace/joker convert costs one star; placement blocked when balance too low; reverse star fly before convert; star-shortage flash on `#hud-stars`

- **row.js v1.31, turn.js v2.4, drag-drop.js v2.26, placement-anim.js, placement-row.css** — dealt tile reposition: `dealtThisTurn` flag on column survives shifts; reposition after dice moves / returned dice

- **handlers.js v2.8, drag-drop.js v2.25, placement-row.js** — row dealt tile tap-select survives row click handler; edge ghosts when dealt tile selected

- **drag-drop.js v2.22** — cancelled bar drag restores tray/dealt-tile slot after illegal drop (no overlap with siblings)

- **drag-drop.js v2.23, row.js v1.28** — dice gap spread restored (`getValidSlotsForDie` import); gate = original dice rule OR dealt tile row room

- **row.js v1.27, placement-hover.js v1.9, placement-anim.js v1.21, drag-drop.js** — unified gap spread gate for dice + dealt tile (fixes dice regression from split gate)

- **row.js v1.26, placement-hover.js v1.8, placement-anim.js v1.20, drag-drop.js** — dealt tile gap spread uses N-spots-only gate (fixes missing column anim after N-place)

- **action-bar.js v1.28, action-bar.css, placement-row.css, render.js** — dealt tile select shows accent border; selection-only refresh toggles bar chrome via `updateActionBarSelection()`

- **row.js v1.28, action-bar.js v1.30, action-bar.css, convert-anim.css** — dealt tile disabled-on-deal until N-place; inactive entrance anim; tray inactive sync on selection refresh

- **settings.js v2.14, settings-panel.js v1.32** — N-spots no longer capped to N-dice

- **dice-visual.js v2.7, row.js v1.21** — `tricolorSevens` standalone; joker suit/placement gates use live settings
- **row.js v1.19** — one joker per row restored (with per-suit-per-game cap)
- **settings.js v2.10, settings-panel.js v1.27, row.js v1.17, state.js v2.3, turn.js v2.1** — removed `adjacentColumnsOnly` toggle and `placementOrderThisTurn` state
- **sweeps-row.js v1.10** — joker flush sweeps: joker assigned suit must match flush suit (respects tricolorSevens vs tricolors convert rules)
- **sweeps-row.js v1.9** — ace wrap rejects same-rank both sides (2–A–2); 12–A–2, 2–A–12, A–2–3, 11–12–A still valid
- **sweeps-row.js v1.8** — `jokerFlushOnly` ON: jokers hard-blocked from equal/consecutive rank sweeps; flush only
- **settings.js v2.9, settings-panel.js v1.26** — `jokerFlushOnly` toggle in Rules group
- **settings.js v2.8, row.js v1.16, dice-visual.js v2.5, convert.js v1.5, settings-panel.js v1.25** — `tricolors` toggle: three distinct inner dice → joker tile (rank `*`, suit = missing inner die)

- **placement-row.js** — direct-placement stack hit-test: dropping onto a placed die resolves as stack (flyer overlap + elementsFromPoint through flyer)

- **stars.js v1.3** — `consecutiveStars` setting: ±1 / 1↔6 ace pairs vs same value
- **settings.js v2.4** — `consecutiveStars` toggle in Rules group
- **stars.js v1.1** — star matching skips tile columns (stack dice only)
- **settings-panel.js v1.19** — deferred apply on back (draft buffer)
- **turn.js v1.4** — roll uses spawn id directly (fixes empty tray after roll)
- **pip-anim.js v1.2** — star fly matches convert style; simultaneous launch; bulk HUD counter update
- **placement-row, action-bar, hud-v2, handlers, drag-drop** — animation classes + `animating` input guard
- **drag-drop.js** — tap vs drag threshold; tap selects tray dice / returns placed-this-turn die
- **handlers.js** — die tap delegated to drag-drop pointer-up; click keeps placement hints + deselect
- **drag-drop.js** — drop on action bar returns placed-this-turn die
- **turn.js v1.1** — confirm gated on `placedThisTurn >= nPlace`
- **sweeps-row.js v1.5** — consecutive rank runs (asc/desc + ace wrap); visual row adjacency (sparse col ids OK)
- **sweeps-row.js v1.4** — ace dual rank (1|13) + wrap bridges for ascending sweep runs
- **row.js v1.6, convert.js v1.3, sweeps-row.js v1.2, dice-visual.js v1.9** — 1↔6 ace: bypass 1to1 on pair, convert to rank A (sum 1), sweep 2–A–12
- **dice-visual.js v2.2, action-bar.js, placement-row.js, base.css** — tray + this-turn dice brightened face border; settled row dice white; tiles keep `--tile-border`
- **base.css** — `--design-size: 412px`; `.viewport` + `.viewport-inner` scale to `min(100vw, 100dvh)` with no upper cap; settings panel inside scaled frame
- **placement-row.css** — tile content-box outside border (48×92 outer); horizontal + vertical column border overlap; col padding removed
- **base.css** — `--die-stack-pair-height`; `--col-width` aliases `--die-size`
- **row.js v1.2** — gap insert between dice/tiles (not tile↔tile); column shift on adjacency
- **placement-row.css/js, hud-v2.js** — horizontal overflow scroll (all columns visible); HUD chevrons scroll DOM; virtual `viewOffset` window removed
- **row.js v1.3** — dropped scroll-range helpers
- **settings.js v2.2, row.js v1.7** — `suitRestriction` blocks insert slots adjacent to same-value bottom die
- **row.js v1.9, dice-visual.js v2.3, convert.js v1.4** — block stack completion when convert would duplicate existing tile rank+suit
- **placement-row.js, placement-row.css** — edge ghosts absolute overlay; column layout invariant on die select
- **placement-anim.js v1.9, sweep-anim.js v1.2, placement-row.js, render.js** — pin viewport-centre content X; sweep upward + column collapse (`COL_COLLAPSE_MS`)
- **placement-row.js, placement-row.css, render.js** — star emoji gap markers + `getStarMatchRects` for collect pip
- **hud-v2.js, hud-v2.css** — SVG star → ⭐ emoji
- **game-over.js v1.5, highscores.js v1.0, state.js v2.2, turn.js v2.0** — game-over rolls/sweeps stats; local top-10 highscore leaderboard (localStorage)
- **turn.js v1.9** — `nPlaces` no longer triggers game over after sweeps (placement cap unchanged in row.js)
- **settings.js v2.5, row.js v1.12** — `nPlaces` column cap (stacks + tiles); block insert/new-column at cap
- **game-over.js v1.4, turn.js v1.5+** — game-over sheet; sweep history only (no discovery grid)
- **action-bar.js v1.20, row.js v1.11** — roll button label = `nDice − dice in row`

## Next topological move

- Suit tally HUD polish
