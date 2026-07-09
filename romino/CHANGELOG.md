# Changelog

Central version history for all modules. Format per entry: `version | date | summary`

---

## HUD bottom alignment — 2026-07-10
- **hud.css v1.17** — remove `#hud` `top: 8px` so HUD bottom flush with `.grid-overlay` bottom

## HUD three-column distribution — 2026-07-10
- **hud.css v1.16** — `.hud-left` / `.hud-tally` / `.hud-score` each `flex: 1` with start / centre / end alignment; `#hud` `top: 8px`

## HUD tally + score divs — 2026-07-10
- **hud.css v1.15** — `.hud-tally` + `.hud-score` as separate HUD slots (replaces `.hud-suit-tally`)
- **index.html** — `#hud-tally` and `#hud-score` > `#score-display` as sibling HUD children
- **hud.js v2.7** — render swept-suit tally into `#hud-tally`

## HUD spacing — browser preview — 2026-07-10
- **hud.css v1.14** — discovery grid wrap bottom padding `2px` → `8px`; HUD bottom padding `10px` → `22px`

## HUD below discovery grid — 2026-07-10
- **hud.css v1.13** — discovery grid above HUD; grid wrap padding `8px 8px 2px`; HUD bottom padding `10px`
- **index.html** — `#discovery-grid-wrap` before `#hud` in overlay stack

## Progressive uniqueIndex — allow duplicate 1–2 dice — 2026-07-10
- **cards.js v1.88** — progressive: skip uniqueIndex dedup at 1–2 dice so two tiles may share the same single die or pair; full-card identity dedup unchanged at 3 dice

## HUD swept-suit tally — 2026-07-10
- **hud.js v2.5** — live suit counts from `scoredSets`; reuses discovery-fill tiles with count on the left; Z–W always shown from 0; V appended when swept
- **hud.css v1.12** — `.hud-suit-tally` centred in `#hud` row; `.hud-suit-entry` layout
- **index.html** — `#hud-suit-tally` as `#hud` middle child (absolute centre)

## Progressive dice placement — display sort — 2026-07-10
- **dice.js v1.9** — progressive tray/preview sort: duplicates first; 1/6 anchor away-from ordering; both extremes → middle die first

## Progressive uniqueIndex + 1↔6 wrap — 2026-07-10
- **cards.js v1.87** — progressive 1+6 rank snapshots as `3:suit:1,6` (not global `3:A:V`); uniqueIndex at 3 dice compares progressive identity key so wrap completions (e.g. 5→1→6) are not blocked by an existing V joker

## Joker uniqueness — one per game — 2026-07-09
- **cards.js v1.86** — block completing a joker when its identity key (`3:A:V` or `3:Z|X|Y|W:`) already exists on grid or in `discoveredKeys`

## Progressive suit joker — missing-suit identity — 2026-07-09
- **cards.js v1.85** — progressive suit-only joker suit = missing pip from {2,3,4,5} among all three dice (tricolor rule; was die1)

## Progressive 1/6 first die — no index at 1 dice — 2026-07-09
- **cards.js v1.84** — progressive ON at 1 die when die1 is 1/6: hide in-grid index tile (display text was already blank)

## Progressive 1/6 first two — no index, open slots — 2026-07-09
- **cards.js v1.83** — progressive ON at 2 dice when die1 is 1/6: hide index tile; both remaining slots accept dice (no CW/CCW third restriction)

## Progressive domino frame — last two dice — 2026-07-09
- **cards.js v1.82** — progressive ON: domino frame on last two placed dice; when die1 is 1/6, frame on first two (hidden at 2 dice until die1 is 1/6)

## Progressive adjacent 1↔6 third die — 2026-07-09
- **cards.js v1.84** — progressive: when die2 is 1 or 6, third may be the opposite extreme (e.g. 5→1→6, 5→6→1); monotonic falls back to fill order when no CW/CCW path

## Monotonic adjacent 1↔6 wrap — 2026-07-09
- **cards.js v1.82** — monotonic step allows 1↔6 wrap when dice share an edge; validates at 2-dice placement (4-square fill order + classic L)

## Progressive 2-die index suit color — 2026-07-09
- **cards.js v1.80** — progressive ON at 2 dice: in-grid index tile keeps suit background when switching slots (was forced grey)

## Progressive 2-die index diagonal — 2026-07-09
- **cards.js v1.79** — progressive ON: at 2 dice, suit index tile moves to the empty slot diagonal from the most recently placed die

## Progressive matching pair allows 1/6 third — 2026-07-09
- **cards.js v1.81** — when die1=die2, third die may be 1 or 6 (any value)

## Progressive partialUniqueIndex fully inert — 2026-07-09
- **cards.js v1.78** — progressive never reads `partialUniqueIndex`; uniqueIndex at 1–2 only when `uniqueIndex` ON (no partial gate); progressive index tile is separate

## Progressive 1/6 third + suit joker toggle — 2026-07-09
- **settings.js v2.19** — `progressiveSuitJoker` toggle; 1/6 third only when first two differ
- **settings-panel.js v1.13** — suit joker disabled without progressive dice placement
- **cards.js v1.77** — tighten third-die gates; joker path gated by `progressiveSuitJoker`

## Progressive partialUniqueIndex bypass — 2026-07-09
- **cards.js v1.76** — `partialUniqueIndexActive()` / `uniqueIndexAppliesAtPartialFill()`; progressive ignores partialUniqueIndex for dedup and index tile
- **settings-panel.js v1.12** — grey out Partial unique index when progressive dice placement is ON

## Progressive dice placement — fix empty-card slot count — 2026-07-09
- **cards.js v1.75** — `squareSlotAllowedFourSquare`: empty card (0 dice) returns true so capacity count and dice rounds work with progressive ON

## Progressive dice placement — 2026-07-09
- **settings.js v2.18** — `progressiveDicePlacement` toggle (Square v1)
- **settings-panel.js v1.11** — disable without 4-square; reset on toggle
- **cards.js v1.74** — fill-order suit/rank resolver, 2nd/3rd die value gates, forced uniqueIndex, suit-only V joker identity
- **sweeps.js v1.5** — progressive suit-only joker wild in sets and consecutive-rank runs

## Discovery grid text — action bar match — 2026-07-09
- **hud.css v1.11** — discovery fill text uses `var(--text-primary)`; header overlay on `::before` only (action-bar pattern)
- **game-over.css v1.13** — same text tokens on game-over fill-discovery grid

## Discovery grid visible on game over — 2026-07-09
- **hud.js v2.3** — keep `#discovery-grid-wrap` visible during replay (no longer hidden when game-over sheet opens)

## Fill discovery header label — 2026-07-05
- **cards.js v1.73** — suit-only column header `J` → `V` in `FILL_DISCOVERY_RANK_HEADERS`

## Discovery grid wrap padding — 2026-07-05
- **hud.css v1.10** — `.discovery-grid-wrap` padding `8px 8px 14px` (top/bottom breathing room)

## Discovery fill tile text — 2026-07-05
- **hud.css v1.9** — lighten suit glyph on fill-discovery colored tiles (`0.33` → `0.45` white)
- **game-over.css v1.12** — same suit glyph lightness on game-over fill-discovery grid

## HUD above discovery grid — 2026-07-05
- **hud.css v1.8** — swap overlay stack: HUD first, discovery grid below; padding `2px 8px 6px`
- **index.html** — reorder `#hud` before `#discovery-grid-wrap`

## Discovery fill header bg — 2026-07-05
- **hud.css v1.7** — discovery-fill-header: `var(--bg)` base + `isolation: isolate` so `#404040` overlay blend darkens to navy (action-bar match)
- **game-over.css v1.11** — same isolated overlay on game-over fill-discovery grid
- **hud.js v2.1** — wrap rank header text in `.discovery-fill-header__label`

## Fill Discovery toggle — 2026-07-04
- **settings.js v2.17** — `fillDiscovery` toggle (Square v1): rank columns stack bottom-up; game ends on full bottom row or 2 full columns
- **cards.js v1.72** — `buildFillDiscoveryGrid`, `fillDiscoveryColumn`, `isFillDiscoveryEnd`, `FILL_DISCOVERY_RANK_HEADERS`
- **phase.js v1.23** — `maybeEndFillDiscovery()` after new discovery; game-over grid class for fill mode
- **hud.js v2.0** — fill-discovery grid HTML (suit tiles + rank header row)
- **hud.css v1.5** — `.go-cards-grid--fill-discovery` live grid layout
- **game-over.css v1.9** — fill-discovery grid on game-over sheet
- **settings-panel.js v1.10** — `fillDiscovery` disabled without 4-square; reset on toggle

## Endgame ghost — unified — 2026-06-25
- **phase.js v1.22** — endgame session: `last dice` / `game over` ghost on full-grid dice + stuck; tap always opens sheet; animate once per session
- **state.js v1.10** — `endgameActive`, `endgameStuck`, `newEndgameGhost`, `finalizingEndgame` replace stuck-only flags
- **action-bar.js v1.10** — endgame ghost label + session entry animation
- **handlers.js v2.2** — tap endgame ghost → `finalizeFromEndgame()`

## Game-over sweeps inline — 2026-06-25
- **hud.js v1.9** — `sweepListHTML`: sweeps comma-separated inline; tiles within a sweep touch with no separator

## Full-grid capacity dice — 2026-06-25
- **phase.js v1.21** — `tryOfferCapacityCard` skips card deal when grid is spatially full (< 6 adjacency slots); callers spawn tray dice instead (last-chance sweeps)

## 4-square domino frame separator — 2026-06-25
- **grid.css** — `square-bar__sep` sizing for `--four-hor-*` / `--four-ver-*` (matched 3-slot SQUARE hor/ver rules)

## 4-square One-to-one toggle + domino frame — 2026-06-25
- **settings.js v2.16** — `forbidThirdExtreme` toggle: when ON with One-to-one OFF, third die cannot be 1 or 6 (no rank switch)
- **settings-panel.js v1.9** — `forbidThirdExtreme` disabled without 4-square or with One-to-one ON; reset on toggle
- **cards.js v1.71** — resolver rejects third 1/6 when `forbidThirdExtreme` (blocked via existing invalid-rank check)
- **settings.js v2.15** — `oneToOne` toggle (Square v1): combo fixes card identity when ON; placement-sensitive rank/suit when OFF
- **settings-panel.js v1.8** — `oneToOne` disabled without `fourSquare`; reset on toggle
- **cards.js v1.70** — One-to-one OFF: forbid completing with rank+suit already on grid (independent of unique index)
- **cards.js v1.69** — One-to-one OFF: forbid completing with 1/6 diagonally opposite another 1/6
- **handlers.js v1.9** / **drag-drop.js** — record 4-square fill order on place/remove
- **grid.js v2.11** — 4-square domino `.square-bar` render (hor/ver around rank pair)
- **grid.css** — `.square-bar--four-hor-top/bottom`, `--four-ver-left/right` positions
- **card-anim.css v1.6** — 4-square convert fades domino bar with dice

## 3-in-a-row sweeps (4×4) — 2026-06-24
- **settings.js v2.14** — `sweepThreeInRow` toggle (Grid group): 3-card segments on 4×4 rows/cols/diagonals
- **sweeps.js v1.4** — `getThreeSweepSegments`, `collectScoringMatches`; full-line matches suppress overlapping 3-segments
- **sweep-anim.js v1.5** — sweep discovery via `collectScoringMatches`; `lineKey` from matched segment slots
- **settings-panel.js v1.2** — `sweepThreeInRow` toggle triggers `resetGame`

## Capacity card before dice — 2026-06-23
- **phase.js v1.20** — `tryOfferCapacityCard` also runs in `checkPhaseTransition` (and full-grid path) so low slot count is caught after card placement, not only post-sweep
- **sweep-anim.js v1.4** — delegate capacity offer to `tryOfferCapacityCard`

## Post-sweep slot capacity check — 2026-06-23
- **cards.js v1.63** — `countAvailableDiceSlots`: adjacency + max-3 capacity; ignores forbidden value rules
- **phase.js v1.19** — restore `finalizeFromStuck` / stuck flow (fixes grid init); `maybeOfferPostSweepCard` uses adjacency-aware slot count
- **sweep-anim.js v1.3** — call `maybeOfferPostSweepCard` after sweep queue drains

## Coin flip tray dice — 2026-06-21
- **settings.js v2.13** — `coinFlipDice` toggle (Constraints): drag HUD coin onto tray die to flip opposite face (costs 1 coin)
- **dice.js v1.8** — `oppositeDieValue`, `flipDieValue`
- **drag-drop.js v2.3** — coin drag type; drop on tray die flips value and spends coin
- **hud.js v1.7** — `#score-display.is-coin-draggable` during place-dice when toggle on and score > 0
- **hud.css v1.7** — pointer-events and grab cursor for draggable score
- **grid.css v2.10** — `#drag-ghost.coin-drag` styling

## Placement restrictions toggle — 2026-06-21
- **settings.js v2.12** — `placementRestrictions` toggle (Square v1): fill order, slot rules, middle 1/6 ban
- **cards.js v1.62** — first die on an empty card may use any active slot; 4-square orthogonal adjacency from 2nd die onward; `isSlotForbidden` gates fill-order rules behind `placementRestrictions`

## Selection border width — 2026-06-21
- **grid.css v2.9** — yellow selection outline/box-shadow for dice and cards reduced from 4px to 3px

## deckDice random — crypto RNG — 2026-06-21
- **dice.js v1.7** — random dice (`deckDice` off) use `crypto.getRandomValues` instead of `Math.random`

## deckDice random preview ↔ tray sync — 2026-06-21
- **dice.js v1.6** — `spawnDice(count, valueOrder?)` accepts predetermined values for random mode
- **phase.js v1.17** — pass `previewOrder` into `spawnDice` when `deckDice` is off so tray dice match the upcoming preview

## Figma suit & pip colors — 2026-06-21
- **cards.js v1.59** — `SUIT_COLOR`, `PIP_COLOR`, `DIE_PIP_COLOR` aligned to Figma (Z/X/Y/W); 1 & 6 pips → `#3D4B66`; prior values kept commented

## Cool-off rank placement block — 2026-06-18
- **cards.js v1.58** — `isSlotForbidden` blocks placements that would give a card a cool-off rank (4-square + Cool-off)

## Cool-off HUD alignment & pop — 2026-06-18
- **hud.js v1.6** — pop class applied after paint (rAF); force row refresh on pop
- **hud.css v1.6** — vertically centre scaled cards; overflow visible for pop animation

## Cool-off toggle — 2026-06-18
- **fix** — restore missing `cool-off.js` and HUD wiring that broke module init
- **settings.js v2.11** — `coolOff` toggle (Square v1): swept ranks block conversion in 4-square mode
- **cool-off.js v1.0** — `isCoolOffActive`, `isRankCoolOffBlocked`, `addCoolOffSweepCards`
- **state.js v1.9** — `coolOffCards`, `coolOffPopping`
- **hud.js v1.5** — cool-off row between card count and coins; `renderCoolOffRow`, `popCoolOffCard`
- **hud.css v1.5** — `.hud-left`, `.cool-off-row`, pop animation
- **sweep-anim.js v1.3** — append swept cards to cool-off row on commit
- **phase.js v1.17** — skip conversion when rank is cool-off blocked; reset cool-off state
- **card-anim.js v1.5** — pop leftmost cool-off card on each grid conversion

## 4-square game-over sweep list — 2026-06-16
- **hud.js v1.4** — `sweepListHTML`: chronological sweep rows with mini four-square cards
- **phase.js v1.16** — four-square game-over uses sweep card list instead of type counts
- **game-over.css v1.8** — `.go-sweep-row--cards` / `.go-sweep-cards` layout

## 4-square tray return die id 0 — 2026-06-15
- **cards.js v1.57** — `squareDieLocked`: use `dieId == null` so die id 0 is not treated as missing

## 4-square tray return at 3 dice — 2026-06-15
- **cards.js v1.56** — `squareDieLocked`: at 3 dice, only current-roll dice in slots edge-adjacent to the index tile may return to tray; diagonal die stays locked

## 4-square tricolor border — 2026-06-15
- **cards.js v1.54** — tricolor index tile border white (was suit-coloured)

## 4-square tricolor styling — 2026-06-15
- **cards.js v1.53** — `squareIndexTileColor`: tricolor index tile white bg, suit-coloured text + border
- **grid.js v2.8** — apply tricolor tile colours to in-grid index and converted card

## 4-square discovery grid empty slots — 2026-06-15
- **hud.css v1.4** — live discovery grid empty cells match action-bar strip (remove white tint, overlay top-up)

## 4-square post-sweep card offer — 2026-06-15
- **phase.js v1.15** — `maybeOfferFourSquarePostSweepCard`: offer one card when post-sweep empty dice slots &lt; 6
- **sweep-anim.js v1.2** — call four-square post-sweep offer after sweep queue drains

## 4-square no diagonal placement — 2026-06-15
- **cards.js v1.52** — fourSquare: edge-adjacent placement only (blocks diagonal slots for 2nd die and internal moves)

## Partial unique index toggle — 2026-06-15
- **settings.js v2.9** — `partialUniqueIndex` toggle (Square v1 group)
- **cards.js v1.51** — when OFF: skip unique-index duplicate check on 1–2 dice cards; 4-square hides suit index tile at 1 die (forbidden slot instead)

## 4-square live discovery grid — 2026-06-15
- **hud.js v1.3** — `renderDiscoveryGrid` / `discoveryGridHTML`; 4×13 grid above HUD when `fourSquare` ON
- **hud.css v1.3** — `#discovery-grid-wrap` layout
- **render.js v1.2** — `render()` refreshes discovery grid
- **phase.js v1.14** — game-over reuses `discoveryGridHTML`; bulk convert updates grid

## 4-square game-over column order — 2026-06-15
- **cards.js v1.50** — grid columns reordered: suit-only → 2–12 → A

## 4-square game-over card size — 2026-06-15
- **game-over.css v1.7** — four-square thumbnails 32×32 (scale 32/116)

## 4-square game-over grid — 2026-06-15
- **cards.js v1.49** — `buildGameOverFourSquareGrid`: 4×13 layout (rows Z/X/Y/W, cols A/2–12/suit-only)
- **phase.js v1.13** — `showReplay` uses fixed grid when `fourSquare` ON
- **game-over.css v1.6** — `go-cards-grid--four-square` 13×30px columns, 4×30px rows

## 4-square game-over thumbnails — 2026-06-15
- **game-over.css v1.5** — halve discovered-card size when `fourSquare` ON (30×30 wrap, scale 0.2585)

## Forbid all-extreme cards — 2026-06-15
- **cards.js v1.48** — `isSlotForbidden` blocks completing a card whose dice are only 1s and/or 6s (1-slot suit cards exempt)

## 4-square tricolor index — 2026-06-15
- **cards.js v1.47** — `squareDisplayIndex`: tricolor shows suit only (no `*`) when `fourSquare` ON

## Grid coins ban 1/6 — 2026-06-15
- **settings.js v2.8** — grid coins: pairs involving 1 or 6 never qualify (both toggle states)
- **cards.js v1.46** — `refreshGridCoins` extreme-value ban
- **grid-coins.md v1.6** — documents 1/6 ban

## Grid coins diff-number rule — 2026-06-15
- **settings.js v2.7** — `gridCoinsSum7` ON: adjacent opposite dice must differ (any pair except 1+6); OFF unchanged (equal number)
- **cards.js v1.45** — `refreshGridCoins` diff-number qualify logic replaces sum-to-7
- **grid-coins.md v1.5** — documents diff-number rule

## Grid coins sum-to-7 toggle — 2026-06-15
- **settings.js v2.6** — `gridCoinsSum7` toggle (Square v1 group): cross-card coins when adjacent dice sum to 7; off = equal number
- **cards.js v1.43** — `refreshGridCoins` respects `gridCoinsSum7`

## 4-square grid coin pairs — 2026-06-15
- **cards.js v1.44** — fourSquare grid coins on all edge-facing slot pairs (H: 1↔0 + 2↔3; V: 2↔1 + 3↔0)
- **grid-coins.md v1.4** — documents four-square coin slot pairs

## 4-square slot symmetry — 2026-06-15
- **cards.js v1.43** — fourSquare: no L-shape slot-1 forbids; internal reorder bypass; symmetric third-slot adjacency; 2-dice joker by values only
- **scoring.js v1.6** — `ruleRankSum7` uses `squareRankSlots` (same as suit-die rule)

## 4-square suit from all dice — 2026-06-15
- **cards.js v1.42** — fourSquare suit/rank from all placed dice (majority/extreme rules); `squareRankSlots` export
- **scoring.js v1.5** — suit-die scoring uses `squareRankSlots` (non-suit dice, not L-shape pairs)

## 4-square index in grid — 2026-06-15
- **cards.js v1.42** — `squareIndexSlot`, `squareIndexTileColor`; in-grid index tile slot rule
- **grid.js v2.7** — index tile embedded in 2×2 grid; removed top-center overlay; suit-colour converted wrapper
- **grid.css** — `.square-tile--index` styles
- **card-anim.css v1.5** — fourSquare convert animation from index tile slot
- **action-bar.js v1.9** — ghost card: 4 empty holders only

## 4-square toggle — 2026-06-15
- **settings.js v2.5** — `fourSquare` toggle (Square v1 group): 2×2 slot grid, fill any 3 via CW/CCW
- **settings-panel.js v1.6** — `fourSquare` requires SQUARE; clears when SQUARE off; reset on toggle
- **cards.js v1.41** — 4-slot spawn, CW/CCW fill rules, `isCardPlayableFull`, monotonic/lock updates
- **phase.js v1.12** — convert/score queue via `isCardPlayableFull` (3 of 4 for fourSquare)
- **scoring.js v1.4** — score preview uses `isCardPlayableFull`
- **grid.js v2.6** — 4-tile render (0,1,3,2), `converter-card--four-square` class
- **action-bar.js v1.8** — 4-tile square ghost card; slot loops use `card.slots.length`
- **grid-coins.js v1.3** — slot 3 centre coords for coin fallback
- **state.js v1.8** — comment documents 4-slot square layout

## Grid coin alignment + converted toggle — 2026-06-14
- **settings.js v2.4** — `gridCoinsExcludeConverted` toggle (Scoring group, default on)
- **cards.js v1.40** — coins only on directly opposite slots (1↔0 horizontal, 2↔1 vertical); skip filled cards when toggle on

## SQUARE grid match coins — 2026-06-14
- **cards.js v1.39** — spawn on any matching edge-facing dice pair (1/2/3-slot, partial fills); keys `gridA:gridB:slotA:slotB`
- **grid-coins.js v1.2** — parse slot-specific keys; midpoint fallback from slot centres

## Peek unconverted layout — 2026-06-14
- **grid.js v2.3** — game-over summary (`opts.gameOver`) always renders converted layout, ignoring peek state
- **settings.js v2.3** — `peekUnconvertedLayout` toggle (Grid group, default off)
- **state.js v1.6** — `peekUnconvertedCards` Set tracks per-card layout peek
- **phase.js v1.10** — `resetGame()` clears peek set
- **grid.js v2.2** — filled cards in peek set render pre-conversion layout instantly; `converter-card--peekable` cursor on grid
- **handlers.js v1.4** — tap filled grid card toggles peek when setting on
- **settings-panel.js v1.5** — clears peek set when toggle turned off

## Extra start cards — 2026-06-14
- **action-bar.js v1.7** — hide upcoming preview until first preview-dice animation (`newCardAfterPreview`)
- **action-bar.js v1.6** — hide upcoming preview until all extra start cards are placed
- **settings.js v2.2** — export `getInitialStartCardCount()`
- **phase.js v1.9** — post-opening transition uses `getInitialStartCardCount()` so behaviour matches toggle-off after all extras placed
- **settings.js v2.1** — `extraStartCards` toggle (+1 in 3×3, +2 in 4×4)
- **phase.js v1.8** — `resetGame()` deals bonus opening cards before dice load
- **settings-panel.js v1.4** — `extraStartCards` toggle restarts the game

## Die drag haptics — 2026-06-13
- **haptics.js v1.1** — `vibrateSlotHover` also used for empty grid cells during card drag
- **drag-drop.js v2.1** — edge-triggered haptic buzz when card drag enters empty grid slot
- **haptics.js v1.0** — Vibration API helpers for slot and action-bar hover
- **drag-drop.js v2.0** — edge-triggered haptic buzz on valid slot / action-bar return hover during die drag

## Tray return order — 2026-06-13
- **drag-drop.js v1.9** — no slide-in or card-revert animation on action-bar die return
- **dice.js v1.5** — returned dice prepend to front of visible tray (most recently returned leftmost)
- **dice.js v1.4** — `appendReturnedDieToTrayOrder` appends returned dice after dice already in the tray
- **drag-drop.js v1.7** — action-bar return uses return-order placement; hover preview shows die at tray end

## Duplicate die selection guard — 2026-06-13
- **cards.js v1.36** — `isDieSelectable`; move simulation in `wouldCreateDuplicate` clears source slot; dice blocked when every move (incl. tray return) would duplicate
- **handlers.js** — tap-to-select skips unselectable dice
- **grid.js** — duplicate-locked dice use `data-locked` during place-dice
- **action-bar.js v1.5** — tray dice locked when not selectable
- **drag-drop.js v1.6** — drag blocked for unselectable dice
- **dice.js v1.3** — `selectLeftmostTrayDie` skips unselectable dice
- **render.js v1.1** — clears stale die selection when no longer selectable

## Tray return hover preview — 2026-06-12
- **drag-drop.js v1.5** — post-dice revert hover also shows card ghost and deselects hand card
- **action-bar.js v1.4** — export `ghostCardHTML` for tray-return preview
- **action-bar.css v1.4** — hide in-tray card during tray-return preview
- **drag-drop.js v1.4.1** — fix duplicate tray preview dice when tray empty; only preview die selected on hover
- **drag-drop.js v1.4** — hovering action bar during die drag shows die back in tray; drop returns and selects that die
- **grid.css v2.0** — `.is-tray-return-preview` pointer-events none

## Action-bar drop highlight — 2026-06-12
- **action-bar.css v1.3** — remove accent border-top on tray drop target

## Action-bar die return fix — 2026-06-12
- **preview-anim.css** — ghost uses forward slide-in after revert (not reverse, which ended at opacity 0); dedicated `card-tray-slide-out` for card exit without bounce overshoot
- **action-bar.js v1.2** — `ghostReverseIn` triggers normal ghost slide-in
- **action-bar.css** — tray drop highlight uses `border-top` only

## Action-bar die return — 2026-06-12
- **drag-drop.js v1.3** — drop dragged dice on action bar to return to tray; revert post-dice card deal when tray was empty
- **phase.js v1.7** — `revertPostDiceCardPhase()` undoes place-dice → place-card transition
- **preview-anim.js v1.1** — `renderWithCardRevert()` slides in-tray card out before re-render
- **preview-anim.css** — card revert + ghost reverse-in animations
- **action-bar.js v1.1** — `ghostReverseIn` flag drives ghost reverse animation
- **action-bar.css** — `.is-tray-drop-target` highlight during die drag
- **state.js v1.5** — `ghostReverseIn` animation flag

## deckDice random mode — 2026-06-12
- **dice.js v1.2** — `deckDice` off selects dice randomly for all counts (classic 3-die mode included); shared `randomDiceValues` helper
- **hud.js v1.2** — show ∞ when dice are random (no dice deck in use)
- **settings-panel.js v1.3** — `deckDice` toggle restarts the game

## Scoring master toggle — 2026-06-12
- **settings.js v2.0** — `scoring` toggle disables coin earn/spend and hides HUD coin
- **hud.js v1.1** — hide `#score-display` when scoring off
- **scoring.js v1.3** — skip card-fill score preview and points when scoring off
- **cards.js v1.35** — grid coins disabled when scoring off
- **grid.js v1.9** — paid-slot forbidden UI respects scoring toggle
- **handlers.js v1.2** — grid coin collection and paid slots gated on scoring
- **drag-drop.js v1.2** — same gating for drag path
- **settings-panel.js v1.1** — scoring/paidSlots dependency sync

## Grid coin pairs (SQUARE) — 2026-06-12
- **state.js v1.4** — `gridCoins` Set for adjacent matching dice pair keys
- **phase.js v1.6** — reset `gridCoins` in `resetGame()`
- **cards.js v1.34** — `refreshGridCoins()` detects horizontal (slot1↔slot0) and vertical (slot2↔slot1) matches
- **grid.js v1.8** — render coin divs on shared card edges; `.grid-coin` CSS
- **handlers.js v1.1** — `collectGridCoins()` on new card placement (tap + autoplay)
- **drag-drop.js v1.1** — `collectGridCoins()` on card drag from tray

## SQUARE single-die / tricolor index swap — 2026-06-12
- **cards.js v1.30** — Single die: plain suit (e.g. `W`); tricolor: `V` or `*W`/`*Z`/etc.

## Color restriction toggle — 2026-06-12
- **settings.js v1.9** — `colorRestriction` toggle in Grid group
- **cards.js v1.33** — `normaliseDieValue`: when colorRestriction + square ON, maps 6→1 before building the dice multiset key so 1 and 6 are treated as equivalent in the unique-index check

## Unique index dice-only rule — 2026-06-12
- **cards.js v1.32** — `uniqueIndex` simplified to dice-multiset uniqueness only; all rank/index comparisons removed; 2-slot and 3-slot cards alike are only blocked when placed dice match another grid card exactly

## 2-slot square slot detection fix — 2026-06-12
- **cards.js v1.31** — `slotHasDie` fixes inactive `undefined` slots treated as filled; 2-slot/1-slot square fill order; 2-slot duplicate dice only compares complete rank pairs vs other 2-slot cards

## Unique index 2-slot rank exception — 2026-06-12
- **cards.js v1.30** — 2-slot placements skip index collision (incl. vs 3-slot partial rank); only identical dice multisets are forbidden

## Unique index dice uniqueness — 2026-06-12
- **cards.js v1.29** — `uniqueIndex` forbids identical placed-dice multisets on any grid cards; 2-slot cards may still share a display index when dice differ

## Unique index progressive — 2026-06-12
- **cards.js v1.28** — `uniqueIndex` applies to progressive indices (e.g. square `*Z`, partial rank); compares any placement that yields a visible index against other grid cards at any fill level

## Unique index constraint — 2026-06-12
- **settings.js v1.8** — `uniqueIndex` toggle in Constraints group
- **cards.js v1.27** — `wouldViolateUniqueIndex`: when ON, blocks placements that would yield the same display index as another grid card; 2-slot cards compare rank-slot dice values so same rank with different dice is allowed

## SQUARE single-die V index — 2026-06-12
- **cards.js v1.26** — One-die index shows `V` without asterisk; Z/X/Y/W stay `*Z`, `*X`, etc.

## SQUARE full-card slot-1 lock — 2026-06-12
- **cards.js v1.25** — `squareDieLocked`: when all three slots are filled, slot-1 die cannot be selected or dragged until slot 0 or 2 is emptied

## SQUARE tricolor suit mapping — 2026-06-12
- **cards.js v1.24** — Tricolor index suit from missing pip in {2,3,4,5}: 234→W, 235→Y, 245→X, 345→Z

## SQUARE tricolor index and layout — 2026-06-12
- **cards.js v1.23** — Tricolor in square mode: no rank-sum-7 gate; index shows suit only (non-1/6 suit die); center layout like 1-5-6 wrap triple; single die shows `*` + suit

## SQUARE two-dice partial layouts — 2026-06-12
- **cards.js v1.22** — Slots 0+1 filled → horizontal bar (Figma 5458:17774); slots 1+2 filled → vertical bar (Figma 5458:17814); no longer falls back to center when corner die is locked
- **grid.md v1.7** — Document two-dice partial Figma layout mapping

## SQUARE partial 6+1 rank — 2026-06-12
- **cards.js v1.21** — Two-dice square display: adjacent slots 0+1 or 1+2 with 1 and 6 show rank A, not 7

## SQUARE forbidden-slot styling — 2026-06-12
- **grid.css v1.6** — Hard-forbidden slots: no ✖ emoji, white holder-dice fill, square-tile border rgb(218, 220, 231)

## SQUARE corner-to-corner move — 2026-06-12
- **cards.js v1.20** — Same-card corner moves (slot 0↔2) bypass `squareSlotAllowed` fill-order rule; slot 1 remains non-swappable with corners

## Slot-1 six pip rotation — 2026-06-12
- **cards.js v1.19** — `diePipRotationDeg` slot-1 value 6: 180° when slot 0 filled; when corners 0+2 both filled, 180° only if slot 1 pairs with slot 0 for rank (square suit@2)
- **grid.js** / **drag-drop.js** — pass `cardId` into `diePipRotationDeg`

## SQUARE corner-to-slot-1 move guard — 2026-06-12
- **cards.js v1.18** — Corner dice (slots 0/2) cannot move to slot 1 on the same card (`isSlotForbidden`); complements existing slot-1 → corner guard

## Dice pip rotation — 2026-06-12
- **cards.js v1.17** — `diePipRotationDeg` + `dieSVG` pip group rotate 90° CW everywhere; slot 0 + value 6 → 180° CW
- **grid.js** / **action-bar.js** / **drag-drop.js** — pass slot-aware rotation into `dieSVG`

## SQUARE slot-1 move guard and locked-die styling — 2026-06-12
- **cards.js v1.16** — Slot-1 die cannot move to corners 0/2 on the same card (`isSlotForbidden`). When slot 1 + one corner are filled, layout stays center (no rank-bar highlight on the locked corner die) until slot 1 is moved
- **grid.js** — Locked square dice skip the new-die pip-color accent ring

## SQUARE corner die lock (slot 1 + one corner) — 2026-06-12
- **cards.js v1.15** — `squareDieLocked`: when slot 1 and exactly one corner are filled, corner dice cannot be selected or dragged until the slot-1 die is moved; slot-1 die remains interactive
- **grid.js** — `renderHolderDice` applies `squareDieLocked` via existing `data-locked` / click-drag guards

## Disable coin scoring in SQUARE mode — 2026-06-12
- **scoring.js v1.2** — `evaluateCardScore` and `updateScorePreview` no-op when `settings.square`; no preview badge or fill-time coin awards in square mode

## SQUARE 6↔1 wrap-around sequences — 2026-06-12
- **cards.js v1.14** — `squareIsMonotonic` now allows 6→1 wrap on increasing paths and 1→6 wrap on decreasing paths (e.g. `2-1-6`, `4-6-1`, `6-1-3`). Three distinct dice with both 1 and 6 (`squareIsWrapTriple`) use center layout (Figma cornverter center) and suit = the lone non-extreme value instead of middle fallback.

## Fix SQUARE fill-order monotonic validation — 2026-06-12
- **cards.js v1.13** — Added `squareFillOrders`, `squareIsMonotonic` helpers. Rewrote `squareValuesMonotonicAfterPlace` to clear the selected die's existing slot before simulating (prevents false duplicate-slot state like `[2,6,2]`), then validates monotonicity along the historically-correct CW or CCW fill-order path rather than raw spatial order. Fixed `squareSlotAllowed` to permit either corner as the second die when slot 1 was placed first (paid-path edge case). Sequences like `2-6-6` / `6-6-2` / `1-1-3` / `3-1-1` are now correctly allowed; backtracking like `2-4-3` remains forbidden.

## SQUARE sequence, suit, and alignment rules — 2026-06-12
- **cards.js** — CW (`0→1→2`) / CCW (`2→1→0`) fill order enforced in `isSlotForbidden`; slot 1 never first; backtracking blocked (values must be non-decreasing or non-increasing across all 3 slots). `squareSuitSlotFromValues` implements full priority: duplicate (not 1/6) → corner preferred; has-6 → lowest valid; has-1 → highest valid; neither → highest valid; both 1+6 → middle fallback (slot 1); `squareSuitSlot` now returns 0, 1, or 2. All callers updated for slot-1 suit (`squareRankPipPair`, `squareCardRank`, `tricolorSevenKey`, `isJokerCard`, `wouldCreateDuplicate`). `squareAlignment` and `updateSquareLayout` now derive layout from suit slot at 3 dice (suit@0 → vertical; suit@2 → horizontal; suit@1 → center)
- **scoring.js** — `ruleSuitDie` and `ruleRankSum7` branch for `settings.square`, reading rank/suit slots via `squareSuitSlot`

## SQUARE polish fixes — 2026-06-12
- **grid.css** / **card-anim.css** — Converted square index uses true centre (`left:50%; top:50%; translate(-50%,-50%)`) instead of misaligned Figma bottom-anchor coords
- **card-anim.css** — Square conversion: fade targets `.square-tiles`/`.square-bar` not `.square-wrapper`; wrapper background transitions `#F6F7F9→#fff` during animation; `square-index-expand` keyframes aligned to static positions to eliminate post-render flash; portrait animation rules guarded with `:not(.converter-card--square)`; `square-score-preview-pop` keyframe + centering for score coin
- **action-bar.css** — Removed square-specific height overrides; bar stays constant at `136px` regardless of square mode

## SQUARE Figma fidelity fix — 2026-06-12
- **grid.js** — Rebuilt `renderSquareCardHTML` to Figma `cornverter` structure: `.square-wrapper` + `.square-tiles` flex-wrap + absolute `.square-bar` + `.card-index--square` as outer sibling of wrapper
- **grid.css** — 116×116px grid cells and cards; `#F6F7F9` wrapper; `#DADCE7` holder bg; bars absolutely positioned at Figma coords (hor: left:8/top:8, ver: left:60/top:8); `box-shadow: inset` for tile borders to preserve 48px tile size; index at left:8/bottom:8; filled index at left:8/top:8 100×100
- **card-anim.css** — `square-index-expand` updated to match new position tokens; fade targets `.square-wrapper` instead of `.square-dice`
- **sweep-anim.css** — Vertical/diagonal sweep distances adjusted for 116px cells
- **action-bar.js** — Ghost card uses new `.square-wrapper` + `.square-tiles` DOM; bar height 116px
- **action-bar.css** — Bar height bumped to 116px
- **game-over.css** — Scale for square thumbnails set to 0.517 (60/116)

## SQUARE card layout — 2026-06-11
- **settings.js** — `square` toggle in Grid group; mutually exclusive with `diceDecks`
- **settings-panel.js** — cross-sync square/diceDecks; `square-cards` root class; resetGame on toggle
- **cards.js** — square rank/suit derivation, alignment, slot rules, identity, duplicate checks
- **grid.js** — `renderSquareCardHTML()` with center/horizontal/vertical layouts
- **grid.css** — 110×110 cards, square bars/tiles, bottom-left index under `html.square-cards`
- **action-bar.js** / **action-bar.css** — square ghost card; reduced bar height
- **game-over.css** — square thumbnail wrap sizing
- **card-anim.css** — square index expand + dice fadeout keyframes
- **sweep-anim.css** — square grid sweep distance keyframes
- **handlers.js** / **drag-drop.js** — `updateSquareLayout()` on die placement
- **state.js** — square slot semantics comment
- **main.js** — apply `square-cards` class on boot when square is on

---

## Tricolor sevens — 2026-06-10
- **cards.js** — Tricolor status requires 3-color combo **and** rank dice (slots 0+2) summing to 7; added `tricolorSevenKey`
- **settings.js** — toggle label updated to "Tricolor sevens"

---

## Tricolor cards — 2026-06-10
- **settings.js** — `tricolor` toggle in Card Deck group (default off)
- **cards.js** — `TRICOLOR_COMBOS`, `isTricolorCard`, `tricolorComboKey`; blank rank on match; discovery key `T:{combo}:{suit}`; duplicate + game-over sort
- **sweeps.js** — all-Tricolor lines count as Set; Tricolor excluded from runs and domino
- **grid.js** — blank Tricolor rank renders as `&nbsp;`

---

## Game-over domino dice slots — 2026-06-10
- **game-over.css** — hide holder-dice border/background on discovered domino thumbnails

---

## 3-slot pip-pair identity — 2026-06-09
- **cards.js** — 3-slot keys use `3:{suit}:{pipPair}` (fixes same-rank different combos e.g. 10 as 6+4 vs 5+5)
- **grid.js** — game-over 3-slot non-V filled cards show rank dice

---

## 2-slot game-over dedup fix — 2026-06-09
- **cards.js** — `snapshotCardIdentity()` + strict pip pair; `card.discoveryKey` frozen at fill
- **phase.js** — record discovery only when snapshot succeeds
- **grid.js** — game-over thumbnails always show 2-slot domino dice

---

## 2-slot domino identity fix — 2026-06-09
- **cards.js** — 2-slot key matches V-suit: `2:V:{pipPair}` (rank omitted; pair distinguishes combos)
- **state.js, phase.js** — dedup via `discoveredKeys` Set (snapshot at fill, no recompute)

---

## 2-slot domino identity — 2026-06-09
- **cards.js** — 2-slot `cardIdentityKey` includes sorted rank pip pair; sort tie-break by pip pair

---

## Game-over card sort — 2026-06-09
- **cards.js** — add `compareDiscoveredCards()` (rank 2→12, A; suit Z→X→Y→W→V)
- **phase.js** — sort discovered cards before rendering game-over grid

---

## Game-over unique cards — 2026-06-09
- **cards.js** — add `cardIdentityKey()` for stable rank/suit/slot identity
- **phase.js** — dedup `discoveredCards` in `fillOneCard` by identity
- **state.js** — `discoveredCards` comment: unique IDs in first-discovery order

---

## CSS load fix (Jekyll/static serve) — 2026-06-09
- **base.css** — `@import` all module stylesheets so CSS loads without JS `import './foo.css'` (broken on Jekyll MIME type)
- **hud.js, grid.js, action-bar.js, settings-panel.js, game-over.js, card-anim.js, preview-anim.js, sweep-anim.js** — removed CSS side-effect imports (styles now pulled in via `base.css`)

---

## 1-slot compact fill conversion fix — 2026-06-01
- **grid.js** — unfilled 1-slot V cards now render a top-left `*` + blank card-index (matching 2-slot pre-conversion) so compact-fill conversion animation can expand the index instead of flashing blank; filled domino fallback guarded to exclude slotCount 1

---

## 1-slot vSuitDominoFill display — 2026-06-01
- **grid.js** — filled 1-slot V cards split into domino (ON: `*` + blank, center die) vs compact (OFF: `*` + literal V, gold, no die) branches; unfilled 1-slot V gains `converter-card--1slot-compact-fill` when setting is OFF
- **card-anim.css** — 1-slot dice-persist rule scoped to `:not(.converter-card--1slot-compact-fill)`; v-suit dice-persist rule scoped away from 1-slot cards

---

## Card deck 78 + HUD fix — 2026-06-01
- **dice.js** — replaced `doubleCardDeck` doubling logic with `extendedCardDeck` flag; `getCardDeck()` now builds 78-card deck (52×3-slot, 21×2-slot, 5×1-slot) when on, 15-card deck when off; added `getCardDeckSize()` export
- **settings.js** — renamed `doubleCardDeck` → `extendedCardDeck`, updated label to "Extended card deck (78)", default remains `true`
- **hud.js** — `renderHUD()` now shows card deck remaining (`getCardDeckSize() - cardsPlaced`) when `diceDecks` is on, die combo deck size otherwise
- **settings-panel.js** — `extendedCardDeck` and `diceDecks` added to the keys that trigger `resetGame()` on toggle
- **state.js** — updated `cardDeck` inline comment to describe 15 vs 78 deck sizes

---

## V suit index display toggle — 2026-06-01
- **settings.js** — added `vSuitDominoFill` to Card Deck group (default `true`); when `false`, converted 2-slot V cards render compact (centered rank + literal V, no dice) instead of domino layout
- **grid.js** — `renderCardHTML` new early-return branch for filled 2-slot + `vSuitDominoFill` OFF: compact filled index (rank + `V`, gold, `converter-card--filled`); unfilled 2-slot gains `converter-card--2slot-compact-fill` class when setting is OFF
- **card-anim.css** — 2-slot dice-persist rule scoped to `:not(.converter-card--2slot-compact-fill)` so compact fill uses the standard dice fadeout animation

---

## Fix upcoming-preview refill slot count — 2026-06-01
- **state.js** — added `lastPlacedCardSlotCount` field (reset to 3 on new game)
- **handlers.js** — set `state.lastPlacedCardSlotCount` in both card-placement paths (click handler and `autoplayCardStep`) when a card lands on the grid
- **phase.js** — replaced `diceCount`/`pendingCardSlotCount` with `state.lastPlacedCardSlotCount` in all three preview-refill calls (`checkPhaseTransition` empty-preview branch, `checkPhaseTransition` non-empty → place-dice branch, and `spawnFullGridDiceRound`); fixes upcoming-preview being sized to the previous card's slot count instead of the just-placed card's slot count

---

## Fix dice-preview count — 2026-06-01
- **phase.js** — in the place-dice → place-card transition, reset `state.previewOrder` to fresh peeked values sized for the new card's slot count (`pendingCardSlotCount`); fixes the upcoming-preview showing the wrong die count (ghost card's count instead of the most recently placed card's count)

---

## Dice Decks Feature — 2026-06-01
- **settings.js** — added `diceDecks`, `doubleCardDeck`, `deckDice` settings (new 'card-deck' group)
- **state.js** — added `cardDeck`, `diceDeck2`, `diceDeck1`, `pendingCardSlotCount` properties
- **cards.js** — `spawnCard(slotCount)` now accepts 1/2/3; inactive slots marked `undefined`; `isSlotForbidden` guards inactive slots; `allThreeColoredCard` and `wouldCreateDuplicate` updated for variable slot counts
- **dice.js** — added `getAllTwoDiceCombos`, `getCardDeck`, `drawFromCardDeck`, `drawTwoDiceCombination`, `peekNextTwoDiceCombination`, `drawOneDie`, `peekOneDie`, `nextComboForSlotCount`; updated `spawnDice` and `nextComboForDisplay` for variable dice counts
- **phase.js** — `checkPhaseTransition`, `spawnFullGridDiceRound`, `resetGame` updated to draw from card deck and spawn N dice matching each card's slot count
- **grid.js** — `renderCardHTML` branches on `slotCount` for 1-slot/2-slot layouts; `renderHolderDice` guards undefined slots; slot indicator added
- **action-bar.js** — ghost card uses `state.pendingCardSlotCount` for dynamic layout and slot indicator; animation delays corrected for N dice
- **grid.css** — CSS for `.converter-card--2slot`, `.dice-tile--center`, `.card-dice--center`, `.card-slot-indicator`

---

## state — logic
- 1.2 | 2026-06-09 | add discoveredKeys Set for fill-time identity dedup
- 1.1 | 2026-06-09 | discoveredCards holds unique card identities in first-discovery order
- 1.0 | 2026-06-01 | initial — extracted from monolithic main.js

## settings — logic
- 2.14 | 2026-06-24 | add sweepThreeInRow toggle (3-in-a-row sweeps on 4×4 grid)
- 1.0 | 2026-06-01 | initial — extracted from monolithic main.js

## cards — logic
- 1.8 | 2026-06-10 | fix game-over sort: suit before pip pair
- 1.7 | 2026-06-09 | 3-slot identity uses suit + pip pair (not rank alone)
- 1.6 | 2026-06-09 | snapshotCardIdentity() strict pip pair; card.discoveryKey at fill
- 1.5 | 2026-06-09 | 2-slot identity key matches V-suit domino format (`2:V:{pipPair}`)
- 1.4 | 2026-06-09 | 2-slot cardIdentityKey includes rank pip pair; sort tie-break by pip pair
- 1.3 | 2026-06-09 | add compareDiscoveredCards() for game-over display order
- 1.2 | 2026-06-09 | add cardIdentityKey() for game-over dedup
- 1.1 | 2026-06-01 | add spawnEmptyCard() for diagonal blocker cards
- 1.0 | 2026-06-01 | initial — includes isSlotForbidden (moved from drag-drop)

## dice — logic
- 1.0 | 2026-06-01 | initial — deck, shuffle, sort, display helpers

## scoring — logic
- 1.0 | 2026-06-01 | initial — card scoring rules, score preview badge

## sweeps — logic
- 1.4 | 2026-06-24 | getThreeSweepSegments, collectScoringMatches; 3-in-a-row when sweepThreeInRow + extendedGrid
- 1.1 | 2026-06-01 | filter empty cards in findAllMatchesOnLine; return filteredLineSlots; guard cardIsGridRepositionable
- 1.0 | 2026-06-01 | initial — grid geometry, sweep rules, match detection

## phase — logic
- 1.5 | 2026-06-09 | discovery gated on snapshotCardIdentity; game-over render uses gameOver flag
- 1.4 | 2026-06-09 | dedup via discoveredKeys Set at fill time
- 1.3 | 2026-06-09 | sort discovered cards in showReplay before grid render
- 1.2 | 2026-06-09 | dedup discoveredCards by card identity in fillOneCard
- 1.1 | 2026-06-01 | pre-place empty cards in resetGame; fix isGridFullyFilled/countEmptyDiceSlots/hasLegalMove to skip empty cards
- 1.0 | 2026-06-01 | initial — phase transitions, reset, autoplay trigger, showReplay

## timing — ui/transitions
- 1.0 | 2026-06-01 | initial — animation duration constants

## sweep-anim — ui/transitions
- 1.5 | 2026-06-24 | resolveOneScoringSet uses collectScoringMatches from sweeps.js
- 1.0 | 2026-06-01 | initial — beat + sweep exit animations, multi-line queue

## card-anim — ui/transitions
- 1.0 | 2026-06-01 | initial — pip launch, card conversion animation, fill queue

## preview-anim — ui/transitions
- 1.0 | 2026-06-01 | initial — upcoming preview fade-out wrapper

## render — ui/display
- 1.0 | 2026-06-01 | initial — top-level render dispatcher

## grid — ui/display
- 1.4 | 2026-06-09 | game-over domino dice limited to 2-slot filled cards only
- 1.3 | 2026-06-09 | game-over 3-slot non-V filled cards show rank dice
- 1.2 | 2026-06-09 | renderCardHTML gameOver option forces 2-slot domino dice on summary
- 1.1 | 2026-06-01 | render empty blocker cards as invisible no-interaction placeholders
- 1.0 | 2026-06-01 | initial — grid DOM, card HTML, holder dice HTML

## action-bar — ui/display
- 1.0 | 2026-06-01 | initial — action bar: card phase + dice phase rendering

## hud — ui/display
- 1.0 | 2026-06-01 | initial — HUD score/count, discard init/render

## game-over — ui/display
- 1.3 | 2026-06-09 | doc: 2-slot thumbnails show domino dice via grid gameOver render
- 1.2 | 2026-06-09 | doc: grid sorted by rank then suit
- 1.1 | 2026-06-09 | doc: count and grid show unique discovered cards only
- 1.0 | 2026-06-01 | initial — game-over sheet event listeners

## settings-panel — ui/display
- 1.2 | 2026-06-24 | sweepThreeInRow toggle triggers resetGame
- 1.0 | 2026-06-01 | initial — settings panel render + 4-tap reveal

## drag-drop — ui/display
- 1.0 | 2026-06-01 | initial — pointer drag for cards and dice

## handlers — ui/display
- 1.0 | 2026-06-01 | initial — tap handlers + autoplay long-press
