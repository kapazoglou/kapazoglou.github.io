---
topologyPhase: row
lastVerified: 2026-07-29
---

# römino — Verified Pattern State

## Topology phase

**row** — v2 row-based dice game; Square v1 removed.

## State ownership

| Domain | Home | Notes |
|--------|------|-------|
| Game state | `src/logic/state.js` | row map, pool, stars, points, rollCount, `jokerSuitsUsed`, `deckRemaining`, `dealtStrip`, flank deck/previews |
| Highscores | `src/logic/highscores.js` | localStorage top-10 |
| Game log | `src/logic/game-log.js` | per-game log (cap 100) + lifetime aggregates per settings config (`romino-v2-lifetime-stats`) |
| Settings | `src/logic/settings.js` | nDice/nRoll/nPlace/nSpots + toggles incl. `tileDealtEvery`, `deckSize`, `deckFlank`, `directPlacement`, `snapping`, `suitRestriction`, `consecutiveStars`, `verticalStars`, `aceJokerStarCost`, `rerollOuter`, `dominoRoll`, `dominoSpots`, `tricolors`, `tricolorSevens`, `tricolorRestriction`, `jokerFlushOnly`, `tutoria` |
| Tutorial | `src/ui/display/tutorial.js` | Tutoria overlay when `tutoria` ON; completion `romino-tutorial-done` in localStorage |
| End-game KO prompt | `src/ui/display/end-game-prompt.js` | UI-only armed state for roll-button KO confirm; defers overlay until KO tap |
| DOM | Derived | `render()` only |

## Entry & render path

`index.html` → `src/main.js` → init → `render()` → hud-v2, flank-stacks, placement-row, action-bar

## High-centrality modules

- `src/logic/turn.js` — roll / confirm pipeline
- `src/logic/row.js` — placement rules
- `src/ui/display/handlers.js` — input

## Modified this session

- **domino-spots.js v1.2, row.js v1.55, state.js v2.17** — Domino Spots deck tick by spots created (0/1/2); 0 spots discards all offers

- **domino-spots.js v1.1, domino-roll.js v1.9, turn.js v2.29** — Domino Spots deck counter ticks on confirm by spot count (1 or 2), not per roll

- **domino-spots.js v1.0, settings.js v2.25, settings-panel.js v1.36, state.js v2.16, domino-roll.js v1.8, turn.js v2.28, row.js v1.54, sweeps-row.js v1.16** — `dominoSpots` toggle: spot 1 = used domino, spot 2 = unused; column dominoKey until sweep; requires dominoRoll

- **dealt-strip.js v1.0, dealt-strip display v1.0, state.js v2.15, tile-deck.js v1.1, turn.js v2.26, row.js v1.53, settings.js v2.24, sweep-anim.js v1.10, invalid-flash.js v1.2, handlers.js v2.10, drag-drop.js v2.34, placement-anim.js v1.27, action-bar.js v1.53** — Tile Dealt strip: half-size seam tiles, duplicate block flash, accent pair-sweep, row-sweep clears strip, WELL DONE on deck empty; retired bar dealt tile + chain draw + deal-discard anim


- **domino-roll.js v1.7, drag-drop.js v2.35** — nRoll=4 engaged-pair lock; tray return clears selection

- **deck-size.js v1.1, domino-roll.js v1.1, turn.js v2.23** — Domino Roll deck HUD countdown (even deckSize=0); nRoll=4 last-element bridge draw

- **settings.js v2.23, domino-roll.js v1.0, state.js v2.13, turn.js v2.22, dice.js v2.3, row.js v1.52, drag-drop.js v2.32, action-bar.js v1.46, action-bar.css** — `dominoRoll` toggle: depleting combo pools for nRoll 2/3/4; nRoll=4 dual-pair tray + pair lock

- **settings.js v2.22, deck-size.js v1.0, state.js v2.12, turn.js v2.21, convert.js v1.9, convert-anim.js v1.4, hud-v2.js, hud-v2.css** — Deck Size stepper: HUD counter, convert tick, WELL DONE at 0

- **end-game-prompt.js v1.0, handlers.js v2.9, action-bar.js v1.43, action-bar.css, turn.js v2.20, game-over.js v2.3** — KO confirm bar on roll-button game-over paths; eligibility logic unchanged

- **row.js v1.51, placement-anim.js v1.26, placement-row.js, drag-drop.js v2.31** — fix snap ghost overlap when repositioning row dice: gap spread allowed during row drag; sole-die insert anchor remapped after source column vacates

- **row.js v1.49** — fix: remove buried-flank from placement duplicate gate (was blocking nearly all stack completions)

- **deck-flank.js v2.3, row.js v1.48, convert-anim.js v1.3, sweep-anim.js v1.9, confirm-anim.js v1.6** — convert-match flank top sweep discard + buried-only placement duplicate gate

- **deck-flank.js v2.2, row.js v1.47** — duplicate gate: full flank-stack scan + convert-identity match; joker duplicates always blocked vs row/flank tiles

- **deck-flank.js v2.1, turn.js v2.9, action-bar.js v1.36, reroll-outer-anim.js v1.4** — Deck Flank: block loss game overs while flank stacks hold cards; roll tops up pool when low

- **turn.js v2.15, main.js, game-over.js v2.1** — Deck Flank game-over fix: setGameOverHandler at boot; overlay shows on async WELL DONE
- **turn.js v2.14, reroll-outer-anim.js v1.5** — game-over overlay always loads in Deck Flank (removed shouldBlockGameOver)
- **turn.js v2.13, action-bar.js v1.40** — warning-red roll tap always game over (bypasses Flank pool block on explicit tap)
- **turn.js v2.12, row.js v1.50** — restore pre-Flank game-over rules; Flank ON only blocks pool-exhausted while stacks hold tiles
- **turn.js v2.11, row.js v1.46** — Deck Flank: parity — all blocked loss game overs incl. tray/dealt stuck while flank stacks hold cards
- **turn.js v2.10, action-bar.js v1.37** — tray stuck game over with Deck Flank ON
- **sweep-anim.js v1.8, state.js v2.10, flank-stacks.js** — flank stack pop + reveal after sweep
- **placement-anim.js v1.23, placement-hover.js v1.11, placement-row.js, flank-stacks.js** — flank stacks join gap spread + snap anchoring at row edges
- **deck-flank.js v2.0, state.js v2.9, row.js v1.45, sweeps-row.js v1.14, sweep-anim.js v1.7, flank-stacks.js, game-over.js v2.1, turn.js v2.8, confirm-anim.js v1.5, deck-flank.css, render.js** — Deck Flank virtual row stacks (26 each); sweep tops; duplicate gate; WELL DONE endgame

- **settings.js v2.21, settings-panel.js v1.34, deck-flank.js v1.0, state.js v2.8, row.js v1.44, turn.js v2.7, confirm-anim.js v1.4, convert-anim.js, flank-anim.js, flank-preview.js, deck-flank.css, render.js, base.css** — `deckFlank` toggle: 52-card flank deck, corner preview ghosts, auto edge commit on confirm; mutually exclusive with Tile Dealt Every; flank tiles excluded from N-spots

- **game-log.js v1.2, game-over.js v2.0, game-over.css, index.html** — sweep tile/pattern counts; lifetime matrix converted/swept segmented toggle

- **game-log.js v1.1, game-over.js** — lifetime stats per settings config

- **settings.js v2.20, settings-panel.js v1.33, tutorial.js v1.0, tutorial-steps.js v1.0, tutorial.css, main.js, render.js v1.5** — `tutoria` toggle: hybrid tooltip walkthrough; `romino-tutorial-done` localStorage; cleared on OFF→ON

- **settings.js v2.19, placement-row.js, placement-hover.js, placement-anim.js, drag-drop.js v2.29, placement-anim.css** — `snapping` toggle: snap ghost at nearest valid slot during dice drag (Direct placement ON); drop commits to snap slot

- **sweeps-row.js v1.13, sweep-anim.js v1.6** — tricolor flushes (joker + same-suit flush) always ×1 star multiplier regardless of run length

- **settings.js v2.18, row.js v1.43** — `tricolorRestriction` toggle: OFF lifts joker row/suit caps; duplicate 3-dice permutation gate kept

- **row.js v1.42** — duplicate 3-dice stack gate: permutations count as same triple

- **row.js v1.41** — `passesNoDuplicateTile` also blocks completing a stack when another column has the same bottom→top triple

- **main.js, index.html** — Numbers Deuce font preload + `document.fonts.load` at boot (fixes first-convert FOUT)

- **sweeps-row.js v1.12, sweep-anim.js v1.4, pip-anim.js v1.5, hud-v2.css** — sweep star multiplier: ×1 at 3 cards, +1 per extra; max mult across chain sweeps; HUD `stars×mult` → product in accent before pip bank

- **sweeps-row.js v1.11, sweep-anim.js v1.3** — sweep resolution re-scans after each apply; fixes missed chain sweeps (e.g. joker flush after middle tile swept)

- **row.js v1.39** — tricolor joker: spent-suit full stacks + incidental 2-dice stacks no longer block new joker on another column; same-suit still via `jokerSuitBlocked`

- **row.js v1.40, action-bar.js v1.35, action-bar.css** — roll button accent border when any 3-dice stack on row (overrides low-count warn border)

- **action-bar.js v1.34, action-bar.css** — roll button warning-red border when active and number below N-roll (matches `.roll-btn--low` text)

- **row.js v1.38, turn.js v2.6, action-bar.js v1.33, action-bar.css, handlers.js, reroll-outer-anim.js v1.3** — tray stuck: roll button warning-red border + click game over (no auto on roll)

- **row.js v1.37** — one joker per row at a time + one joker per suit per game (`jokerSuitsUsed`); new suits OK after row clears

- **row.js v1.36** — joker cap is one per suit per game only; removed one-joker-per-row gate (`rowHasJoker`)

- **row.js v1.35, render.js v1.4, base.css** — separator warning red at N-spots cap (`isAtSpotCap`)

- **row.js v1.34, placement-row.js** — stack dice return/reposition gated to topmost die only (`isTopDieInStack`)

- **star-reroll-input.js v1.0, hud-v2.js, hud-v2.css, drag-drop.js v2.28, reroll-outer-anim.js v1.1, action-bar.js v1.32, main.js** — reroll pay: select tray 1/6, tap/drag star from HUD (replaces direct die tap)

- **turn.js v2.5** — `rerollOuter` ON seeds `state.stars` to `nPlace` on `resetGame`; `shouldWarnOnLeave` baseline updated

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
- **row.js v1.19** — one joker per suit per game via `jokerSuitsUsed` (superseded v1.36: removed one-joker-per-row gate)
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
- **base.css** — design canvas 412px tall; width ≥412px, grows to fill viewport in landscape / browsers ≥825px / browser full-screen; phone portrait square unless `html.is-browser-fullscreen`
- **viewport-controls.js v1.1** — touch-phone full-screen ⛶ only (Fullscreen API on `#app`)
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
