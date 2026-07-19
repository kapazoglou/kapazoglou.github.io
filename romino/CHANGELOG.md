# Changelog

Central version history for all modules. Format per entry: `version | date | summary`

---

### Added
- **navigation-guard.js v1.0** — `beforeunload` confirm when session has progress
- **turn.js v1.7** — `shouldWarnOnLeave()` (skip fresh reset + game-over replay)

### Fixed
- **stars.js v1.1** — star matches ignore tile columns (dice stacks only)

### Removed
- **discovery.js** — discovery grid + tile tracking (removed from game over)

### Changed
- **game-over.js v1.4, game-over.css** — discovery grid removed; sheet content fits 412px width

### Added
- **settings.js v2.3** — `nTiles` stepper (default 12); row tile cap game over after sweeps
- **turn.js v1.6** — `evaluateGameOver`; stuck-tray check on fresh roll; tile cap after confirm/sweeps
- **row.js v1.10** — `countTilesInRow`, `hasAnyLegalPlacementForTray`

### Fixed
- **settings-panel.css, game-over.css** — hide scrollbars on settings + game-over scroll areas; touch scroll unchanged
- **game-over.css, index.html** — game-over sheet lives inside `.viewport-inner` (412 design frame), not full-screen fixed

### Added
- **discovery.js v1.0** — 4×13 discovery grid layout + tile discovery tracking
- **game-over.js v1.0** — bottom sheet: swept points, discovery grid, sweeps, PLAY AGAIN
- **turn.js v1.5** — pool `< nRoll` opens game over instead of partial roll; roll button stays enabled

### Fixed
- **placement-row.js** — star markers use logic row index for vertical centre on each die; tiles align to bottom die band
- **drag-drop.js v2.9** — return-to-bar uses full `render()` so removed dice don't linger in the row (`renderSelection` only toggled chrome)
- **placement-row.js, placement-anim.js v1.9, sweep-anim.js v1.1, render.js** — pin viewport-centre content X across row renders so scroll stays put after gap insert / sweep exit (not just raw `scrollLeft`)

### Changed
- **dice-visual.js v2.4, hud-v2.js, placement-row.js, pip-anim.js** — all stars use Figma 5671:16172 SVG (`#FFE500` / `#E5B800`); emoji removed
- **stars.js v1.2, row.js, turn.js, confirm-anim.js v1.2** — star matches require ≥1 die placed this turn; snapshot ids before confirm clears them; rects captured pre-convert
- **placement-anim.js v1.7** — faster fly-in (`COL_DIE_IN_MS` 95) with strong ease-out deceleration at landing
- **placement-anim.js v1.6** — fly-in starts at 25% of column spread (overlapping motion)
- **placement-anim.js v1.5** — fly from action-bar die position into spread gap; `ease-out` on spread and fly
- **placement-anim.js v1.4** — flyer on viewport-inner above action bar
- **placement-anim.js v1.3** — stack placements use same tray fly-in as gap/first-column (1-high or 2-high column)
- **placement-anim.js v1.2** — symmetric ±half spread from gap centre; tray die visible until fly starts; 2× speed; whole row blocks push together on spread

### Fixed
- **placement-anim.js v1.1** — restore `phase: rolled` after placement anim (roll/confirm button worked again); two-phase spread then die fly-in replaces FLIP

### Added
- **placement-anim.js v1.0** — gap-insert placement animation from the bar

### Changed
- **settings-panel.js v1.19** — settings edits buffer while panel is open; back applies all, saves, then reset or re-render
- **row.js v1.9, dice-visual.js v2.3, convert.js v1.4** — block third die on a stack when convert would duplicate an existing tile rank+suit; shared `tileIdentityFromStackValues`
- **dice-visual.js v2.2, action-bar.js, placement-row.js, base.css** — tray + this-turn dice use brightened face border; settled row dice white; tiles keep `--tile-border`

### Fixed
- **placement-row.js, placement-row.css** — edge insert ghosts are absolutely positioned (not in flex flow); dice/tiles stay fixed when selecting; hint buttons unfocusable; `overflow-anchor: none`
- **dice-visual.js v2.1** — `rankGlyphFromSum(1)` returns `A` for 1+6 ace tiles
- **placement-row.js** — hint triangle positions convert getBoundingClientRect (screen px) back to design px so scaling does not offset arrows
- **base.css, settings-panel.css v1.18, index.html** — 412×412 design canvas scales uniformly to min(vw, dvh) on all screen sizes (up and down); settings panel lives inside the same viewport

### Fixed
- **settings-panel.css v1.17** — panel capped to viewport (`100dvh`, safe-area padding); scrollable content when tall

### Changed
- **sweeps-row.js v1.5** — consecutive rank runs sweep (ascending or descending, ace wraps); row adjacency ignores sparse col ids when nothing sits between tiles
- **row.js v1.8** — insert slots adjacent to a tile require a dice stack on the other side of the gap (no lone tile edges)
- **placement-row.js, placement-row.css** — stack z-index by placement order (newer on top); selected bump preserved
- **dice-visual.js v1.9, base.css, placement-row.js** — settled row dice border uses `--tile-border` (CSS); this-turn placements stay white
- **base.css / placement-row.css** — dice columns 6px horizontal gap; tile↔tile flush (border overlap, 0px gap)
- **dice-visual.js v1.7** — roll button face is solid 48×48 grey; no outer border in SVG
- **action-bar.css** — inset 4px accent ring on enabled button (`::after`); overlay blend on grey SVG only
- **action-bar.js v1.19** — roll face border moved to CSS (no JS active flag)

### Fixed
- **placement-row.css / base.css** — tile outside border (40×84 face + 4px ring → 48×92 outer, matching two stacked dice); column borders overlap horizontally like vertical stacks

### Changed
- **convert.js v1.2** — converted stack dice return to `dicePool` (3 per column)

### Fixed
- **turn.js v1.4** — roll pushes spawn id (not `.id` on number); tray dice render after roll

### Added
- **convert-anim, sweep-anim, pip-anim, confirm-anim** — salvaged Square v1 transitions: tray slide-in, stack→tile convert, sweep beat+exit, star→points pips
- **turn.js v1.3** — confirm runs animated pipeline (`phase: animating`); roll chains after animations complete

### Changed
- **convert.js v1.1** — `getConvertibleCols`, `convertColumn` for sequential convert anim
- **sweeps-row.js v1.1** — `findSweepRuns`, `applySweepRun` split from instant `resolveSweeps`
- **state.js v2.1** — animation flags + sweep exit timers
- **placement-row.js** — `is-converting`, sweep-pending/sweep classes, `is-new` tiles
- **action-bar.js** — tray dice `is-new` slide-in on roll
- **hud-v2.js** — `#hud-points` target for bank pips
- **base.css** — imports convert-anim + sweep-anim CSS

### Added
- **row.js v1.4** — `isBarDieInactive()` when `placedThisTurn >= nPlace`
- **action-bar.js, drag-drop.js, render.js** — leftover tray dice inactive (no tap/drag/select) once placement quota is filled
- **action-bar.css** — `.die--action-inactive` muted styling

### Fixed
- **drag-drop.js** — tap vs drag split (8px threshold); tap toggles tray die selection / returns placed-this-turn die without starting drag
- **handlers.js** — die tap moved to pointer-up path (drag-drop); click handler keeps hint/ghost/roll/deselect only

### Changed
- **hud-v2.css** — suit tally row hidden (display: none) until re-enabled

### Added
- **placement-row.css/js** — all columns render; row overflows horizontally with touch scroll (replaces virtual 5-column window)

### Changed
- **hud-v2.js** — scroll chevrons hidden for now (row still scrolls via swipe)

### Changed
- **row.js v1.3** — removed `viewOffset`, `getViewWindow`, and virtual scroll range helpers
- **state.js** — dropped unused `viewOffset`

### Added
- **row.js v1.2** — gap insert slots between dice/tiles (not tile↔tile); column shift on tight adjacency
- **placement-row.js** — gap hints below bottom dice (6px); stack hints above last die (2px), always downward

### Fixed
- **placement-row.css** — tile border 4px (`--die-border`), matching die ring
- **base.css / placement-row.css** — tile outer size matches one die wide × two stacked dice tall (48×92px, borders included)
- **placement-row.css/js** — die-sized adjacent ghost columns at shared bottom baseline; new-column hints anchor to row baseline so horizontal placement works beside columns of any height
- **row.js v1.1** — repositioning a placed die removes it from its current column before placing (no clone); row moves skip `nPlace` gate
- **drag-drop.js** — drop on action bar returns a placed-this-turn die to the tray
- **turn.js v1.1** — confirm/roll button stays disabled until `placedThisTurn` reaches `nPlace`
- **dice-visual.js v1.6** — outside border 48×48 (40 face + 4px ring); rendered at full outer size for border overlap
- **base.css** — `--die-gap-h: 4px`; `--die-size: 48px` (was 40px, which squished the outside border away)
- **placement-row.css** — 4px horizontal gap between columns; vertical stack border overlap; selected die z-index; col padding removed
- **dice-visual.js v1.5** — outside border via nested rects (48 viewBox, face stays 40×40)
- **action-bar.css** — dice tray centered in full 412px frame (Figma Frame 19: gap 20px, no roll-button offset)
- **placement-row.css** — stack gap `--die-border` (4px); ghost columns padding 0; 2-die stacks align end
- **base.css** — `--die-border: 4px` token tied to die SVG border width
- **placement-row.js** — hint triangles at Figma offsets (6px below column / 2px above stack)
- **base.css** — letterboxed square frame (`min(100vw, 100dvh, 412px)`) centered on black `#app`
- **placement-row.css** — row flexes to fill square frame (was fixed 241px vs 412px artboard)
- **placement-row.js** — empty row renders center ghost column (`data-col="0"`) so first-die hints can anchor
- **handlers.js** — tap empty ghost column to place when a die is selected

## Rowmino v2 — row-based redesign — 2026-07-19

Full replacement of Square v1 (3×3 card grid) with Figma row-based dice game.

### Added
- **dice-visual.js v1.0** — Figma die colors, inline SVG dice/star/chevrons/hints/roll face

### Rewritten (Figma pixel pass — 2026-07-19)
- **dice-visual.js v1.1** — Figma-accurate filled dice (4px white/accent border, pip washes), all SVG icons
- **hud-v2** — score `0 ⭐ | 0`, suit badge row W/Y/Z/X, inline SVG chevrons + star
- **action-bar** — roll button nested grey face + overlay; selected die `#FFE500` border
- **placement-row** — 241px/140px/48px Figma dimensions; SVG hint triangles; ghost columns
- **row.js v1.0** — column placement, adjacency, 1to1 rules, triangles
- **convert.js v1.0** — 3-dice stack → tile (suit + rank sum)
- **stars.js v1.0** — same-row adjacent column star detection
- **sweeps-row.js v1.0** — linear 3-tile rank sweeps, suit tally, star banking
- **turn.js v1.0** — roll / confirm pipeline, pool accounting
- **hud-v2.js v1.0** — stars ⭐ | points HUD, triple-click settings, scroll chevrons
- **placement-row.js v1.0** — row render, tiles, placement hints

### Rewritten
- **state.js v2.0** — row map, dice pool, stars/points/suitTally
- **settings.js v2.0** — nDice/nRoll/nPlace steppers + rule toggles
- **dice.js v2.0** — minimal random die spawn
- **action-bar.js v2.0** — dice tray + roll/confirm button
- **handlers.js v2.0** — tap place, return, roll confirm
- **drag-drop.js v2.0** — bar ↔ row drag
- **settings-panel.js v2.0** — steppers, localStorage, triple-click entry
- **index.html**, **base.css** — v2 shell

### Removed
- Square v1: cards, phase, sweeps, scoring, cool-off, grid, grid-coins, hud, game-over, card-anim, preview-anim, sweep-anim
