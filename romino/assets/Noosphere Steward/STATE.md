---
topologyPhase: row
lastVerified: 2026-07-19
---

# römino — Verified Pattern State

## Topology phase

**row** — v2 row-based dice game; Square v1 removed.

## State ownership

| Domain | Home | Notes |
|--------|------|-------|
| Game state | `src/logic/state.js` | row map, pool, stars, points |
| Settings | `src/logic/settings.js` | nDice/nRoll/nPlace + toggles incl. `suitRestriction` |
| DOM | Derived | `render()` only |

## Entry & render path

`index.html` → `src/main.js` → init → `render()` → hud-v2, placement-row, action-bar

## High-centrality modules

- `src/logic/turn.js` — roll / confirm pipeline
- `src/logic/row.js` — placement rules
- `src/ui/display/handlers.js` — input

## Modified this session

- **settings-panel.js v1.19** — deferred apply on back (draft buffer)
- **turn.js v1.4** — roll uses spawn id directly (fixes empty tray after roll)
- **convert.js v1.2** — converted stack dice return to dicePool
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
- **placement-row.js, render.js, drag-drop.js, handlers.js, placement-row.css** — `renderSelection()` for die select/deselect; tiles not rebuilt when hint arrows appear

## Next topological move

- Suit tally HUD, game-over when pool empty
