# Changelog

Central version history for all modules. Format per entry: `version | date | summary`

---

### Removed
- **settings.js v2.10, settings-panel.js v1.27, row.js v1.17, state.js v2.3, turn.js v2.1** — `adjacentColumnsOnly` toggle and placement-order tracking removed; bar placements no longer restricted to adjacent columns

### Changed
- **row.js v1.28, action-bar.js v1.30, action-bar.css, convert-anim.css** — dealt tile dealt disabled (`isDealtTileInactive` gates on N-place only); inactive `is-new` entrance stays muted; selection refresh syncs tray inactive class
- **action-bar.js v1.28, action-bar.css, placement-row.css, render.js** — dealt tile tap-select shows accent border (`.placement-tile--selected`); selection-only refresh toggles bar chrome without full rebuild
- **settings.js v2.14, settings-panel.js v1.32** — N-spots no longer capped to N-dice; stepper max stays 99
- **action-bar.css** — dealt tile slot offset −4px on Y axis
- **state.js v2.7, row.js v1.24, turn.js v2.3, drag-drop.js, placement-row.js, placement-row.css, reposition-collapse.js** — dealt tile gated until N-place dice placed (inactive styling matches tray dice); placed dealt tile repositionable until confirm/roll
- **dice-visual.js v2.9, drag-drop.js, placement-hover.js v1.7, placement-anim.js v1.19, placement-input.js, placement-row.js, placement-anim.css, action-bar.css, placement-row.css** — dealt tiles: same drag pending, gap hover spread, fly/collapse anim as dice; insert-only placement (no stack-on-dice)
- **settings.js v2.13, settings-panel.js v1.31, row.js v1.23** — `nPlaces`/`N-places` renamed to `nSpots`/`N-spots`; unplaced dealt tile counts toward N-spots cap (not N-place); dealt tile placement no longer increments `placedThisTurn`
- **row.js v1.19** — restore one joker per row alongside one joker per suit per game
- **state.js v2.4, row.js v1.18, convert.js v1.6** — one joker per suit per game (`jokerSuitsUsed`)
- **settings.js v2.9, settings-panel.js v1.26, sweeps-row.js v1.7** — `jokerFlushOnly` toggle: jokers sweep only on same-suit flush runs (≥2 non-joker tiles of that suit)
- **sweeps-row.js v1.6** — jokers wildcard equal and consecutive rank sweeps (any rank / step)

### Added
- **row.js v1.30, convert.js v1.7, dice-visual.js v2.10, pip-anim.js v1.3, convert-anim.js v1.2, invalid-flash.js v1.1, placement-input.js v1.2, hud-v2.css** — ace/joker stack completion costs one star each; block placement when star balance too low (red flash + warning-red `#hud-stars`); reverse star fly HUD→column before ace/joker convert
- **settings.js v2.12, settings-panel.js v1.29, tile-deck.js v1.0, state.js v2.5, turn.js v2.2, row.js v1.22, action-bar.js v1.24, deal-discard-anim.js v1.0, placement-anim.js v1.17, handlers.js, drag-drop.js, placement-row.js, placement-input.js** — `tileDealtEvery` stepper (0=off) deals random tiles from a 48/52 deck on roll cadence; `tileDealtChainDraw` toggle; duplicate-on-row sweep-discard; deck depletion game over; dealt tile leftmost in action bar counts toward N-place; block forming pending dealt identity via dice
- **action-bar.js v1.23, action-bar.css** — roll button number turns warning red when below N-roll
- **settings.js v2.8, row.js v1.16, dice-visual.js v2.5, convert.js v1.5, settings-panel.js v1.25** — `tricolors` toggle: three distinct inner dice (2–5) convert to joker rank `*` with suit of missing inner die; one joker per row

### Fixed
- **sweeps-row.js v1.10** — joker flush sweeps require joker assigned suit to match flush suit (tricolorSevens bottom die vs tricolors missing inner die)
- **row.js v1.31, turn.js v2.4, drag-drop.js v2.26, placement-anim.js, placement-row.css** — dealt tile reposition: `dealtThisTurn` column flag survives column shifts (fixes stale `placedDealtTileCol` after dice moves); reposition allowed even when dice returned to bar; row drag uses coordinate drop in hint mode too
- **handlers.js v2.8, drag-drop.js v2.25, placement-row.js** — row dealt tile tap-select no longer cleared by the row click handler; edge ghosts show when dealt tile is selected
- **sweeps-row.js v1.9** — reject consecutive ace-wrap runs where ace sits between two tiles of the same rank (e.g. 2–A–2); wheel-end wraps (12–A–2, 2–A–12) and A–2–3 / 11–12–A still valid
- **row.js v1.29, placement-row.js, drag-drop.js v2.24, placement-anim.js v1.22** — placed dealt tile tap-select shows reposition hints before confirm/roll; valid slots exclude current column (N-spots cap bypass while repositioning); hint placement lifts column and flies from row rect
- **drag-drop.js v2.23, row.js v1.28** — restore dice gap spread (missing `getValidSlotsForDie` import); unified gate keeps original dice rule + dealt tile branch
- **row.js v1.27, placement-hover.js v1.9, placement-anim.js v1.21, drag-drop.js** — unified `gapInsertAnimationsAllowed()` for dice + dealt tile gap spread (single gate; no `forDealtTile` split)
- **drag-drop.js v2.22** — cancelled tray/dealt-tile drag (illegal drop or drop back on bar) restores action bar layout so returned die no longer overlaps siblings
- **row.js v1.26, placement-hover.js v1.8, placement-anim.js v1.20, drag-drop.js** — dealt tile gap spread/commit anim gated on N-spots room only (not N-place); tiles already insert-only (no stack-on-dice)
- **action-bar.css, state.js v2.6, action-bar.js, drag-drop.js, placement-row.css** — revert dealt tile vertical centre; hide bar tile while dragging (`draggingDealtTile`) so re-render no longer breaks select/drag/drop
- **dice-visual.js v2.7, row.js v1.21** — `tricolorSevens` works without Tricolors toggle; joker suit/placement gates use live settings (234/243/543/534 form correctly)
- **placement-row.js** — direct-placement stack hit-test: dropping a 1 or 6 onto a placed inner die (or any stack die) resolves as stack, not invalid; flyer overlap no longer blocks the target
- **row.js v1.15, placement-hover.js v1.6, placement-anim.js v1.16** — no gap spread/preview when N-place or N-places cap reached (fly-in only if gap insert still legal)
- **placement-anim.js v1.15** — row-edge drop: fly-in only (no full-row spread + collapse jitter); columns move once on render
- **drag-drop.js v2.20** — gap spread preview only while dragging a die (not on selected-die hover)
- **placement-row.js, placement-row.css, placement-hover.js, placement-anim.js, reposition-collapse.js** — gap-insert spread hides the opening-pair star immediately; stars rAF-track live die layout during column motion (no separate left/top transition)
- **drag-drop.js v2.19, handlers.js** — return-to-bar tap no longer re-places die (click-after-pointerup guard)
- **placement-hover.js v1.5, placement-anim.js v1.14** — placement commit handoffs hover spread (no reverse-then-re-spread jitter); commit spread animates from current transform; animating phase clears hover state only
- **placement-anim.js v1.13** — keep drag/fly flyer until after render on edge drops (no die flash during edge-insert collapse)

### Added
- **row.js v1.14, drag-drop.js v2.18** — tap returnable (unsettled) placed die returns to action bar and keeps selection

### Changed
- **placement-anim.js, placement-hover.js, reposition-collapse.js, render.js, drag-drop.js** — successful reposition: no spread/collapse DOM restore before render (fixes post-drop column snap)
- **game-over.js v1.5, game-over.css, index.html** — session rolls/sweeps on game-over sheet; local top-10 highscore leaderboard (date, rolls, sweeps, score)
- **highscores.js v1.0** — localStorage top-10 persistence with score/rolls/sweeps tie-break sort
- **state.js v2.2, turn.js v2.0** — `rollCount` incremented on each successful `rollDice()`
- **drag-drop.js v2.17, placement-row.css** — stack drag: body capture from pointerdown, touch-action none on dice, sibling pointer-events off; no select on drag start
- **drag-drop.js v2.16** — placed die tap selects (not return-to-bar); return via drag to action bar only
- **reposition-collapse.js** — instant gap close on drag start (no FLIP anim while dragging)
- **drag-drop.js, placement-hover.js, placement-anim.js, render.js** — instant spread/collapse teardown on drag end (no reverse anim vs renderSelection); defer selection refresh one frame
- **placement-row.js** — star markers hide during row reposition drag when they involve the dragged die
- **reposition-collapse.js v1.0** — sole-die row reposition closes source gap on drag; gap hover spread composes on top
- **placement-anim.js v1.12** — reposition gap spread excludes vanishing source column; clear `draggingDieId` before row reposition render (fixes hidden die)
- **placement-anim.js v1.11** — row-edge insert: columns past an index gap on the far side of the new die animate back after fly-in
- **drag-drop.js, placement-anim.js, placement-input.js, base.css, index.html** — drag uses `.placement-die-flyer` in viewport at source die position; same element hands off to commit fly; removed `#drag-ghost`
- **placement-hover.js** — gap hover spread only between columns, not row edges
- **placement-row.js** — `resolveInsertSlotFromPointer` for insert-only hit tests
- **placement-row.js** — `resolveSlotFromPointer`; hints/ghosts gated when direct placement ON
- **placement-input.js v1.0** — `attemptPlacementAtPoint` validates slot + places or flashes
- **invalid-flash.js v1.0, invalid-flash.css** — full-viewport red flash on illegal direct placement
- **row.js v1.13** — `getValidSlotsForDie` allows repositioning placed-this-turn dice when placement quota is full
- **placement-row.js, placement-input.js, drag-drop.js** — fix insert drops: inserts use finger Y, stacks use ghost top; inserts checked before stack

### Changed
- **placement-row.js** — gap/edge inserts only at or below the bottom die row; stack still wins above columns
- **placement-row.js** — direct-placement row edges: any tap/drag left of first column or right of last column (full row height) resolves to edge insert
- **turn.js v1.9** — removed post-sweep game over when occupied columns exceed `nPlaces`; column cap still blocks placement during play
- **pip-anim.js v1.2, pip-anim.css** — star collect + bank use convert-style fly; all stars together; HUD jumps by full total
- **timing.js v1.4** — convert fly-back slowed (320ms fly, 80ms stagger)
- **settings.js v2.6, settings-panel.js v1.24** — `nPlaces` clamped to `nDice`
- **settings.js v2.5, row.js v1.12, turn.js v1.8, settings-panel.js v1.23** — `nPlaces` replaces `nTiles`; cap counts all occupied columns; new columns blocked at cap until sweeps free slots

### Added
- **convert-anim.js v1.1, timing.js** — convert fly-back: stack dice fly to roll button, staggered top-first
- **settings-panel.js v1.22** — `consecutiveStars` in game-reset keys
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
