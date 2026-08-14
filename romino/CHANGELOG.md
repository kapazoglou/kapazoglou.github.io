# Changelog

Central version history for all modules. Format per entry: `version | date | summary`

---

---

---

---

---

- **suit-tally.js v1.13, game-over.js v2.10, turn.js v2.53, suit-tally.md, game-over.md, turn.md** — discovery win: all 52 unique suit:rank combos → game over title WINNER (+1 score multiplier); zero duplicates → FLAWLESS (+2); checked before suit-cap loss

- **game-over.js v2.9, game-over.css, sweeps-row.js v1.22, state.js v2.34** — full-sweep game-over multiplier: scoring sweep that empties the row increments `fullSweepCount`; final score ×(1 + count) after end bonus; breakdown shows `full sweeps ×N` when N > 1

- **suit-tally.js v1.12, suit-tally.md, turn.md** — suit-cap end trigger raised: game over when any suit tally reaches 14 (was 13)

- **game-over.js v2.8, settings-panel v1.44, settings-panel.css, index.html** — lifetime stats removed from game-over sheet; lifetime block moved to bottom of settings panel

- **domino-spots.js v1.20, row.js v1.90, state.js v2.33** — Domino Spots offer bind: new columns + Bugger Singles use roll used/unused offers (1st/2nd); Starting Dice pool-only; confirm discards unassigned offers; restore v1.14 stack rebind + v1.15 vacate promote

- **domino-spots.js v1.19, row.js v1.89, turn.js v2.52, render.js v1.6, placement-anim.js v1.41, domino-spot-strip.js** — Domino Spots invariant: every row column pool-assigned; vacate returns key; missing key → game over; no offer rebind on render (fixes flash/drops)

- **game-over.js v2.7, game-over.css, index.html** — remove hero “X swept points” row from game-over sheet

- **star-powers.js v1.15** — Bugger Singles: lone 1/6 push-below + pending gate derived from column shape (`isLoneBuggerOuterCol`); fixes push on singles when `buggerPendingCols` Set was stale

- **domino-spots.js v1.18, row.js v1.88, starting-dice.js v1.5** — Bugger Singles + Domino Spots: pool-drawn domino on lone 1/6 and all-outer columns; starting odd singleton may seed 1/6 when bugger ON

- **domino-roll.js v1.31, domino-spots.js v1.17, turn.js v2.51** — Starting Dice + Domino Spots ON: one random pool key per seeded column on reset; releases on sweep

- **settings.js v2.40, settings-panel.js v1.43, turn.js v2.50** — `startingStars` Counts stepper (0–52, default 0) above Starting Dice; seeds HUD balance on reset (adds N-place reroll/domino-pair bonus)

- **placement-row.js, placement-row.css** — hide stack duplicate −N mark as soon as a stack die drag starts (CSS + render guard)

- **suit-tally.js v1.11, dice-visual.js, placement-row.js** — duplicate label −N where N = duplicate index (1st duplicate −1, 2nd −2, …)

- **suit-tally.js v1.10, dice-visual.js, placement-row.js** — duplicate mark shows −N (next copy number: −2 second, −3 third, …)

- **suit-tally.js v1.9, placement-row.js** — “−1” duplicate mark on all 3-dice convert stacks (not only Switcher) when post-convert tile identity already swept

- **suit-tally.js v1.8, dice-visual.js, placement-row.js, placement-row.css** — swept duplicate “−1” warning-red label above row tiles + Switcher stacks when session suit:rank already swept; `sweptSuits` ON; shifted −2px Y

- **pip-anim.js v1.16, placement-anim.js v1.42, stack-swap-anim.js v1.6** — reduce star pay flash: no full HUD rebuild on deduct; cost ⭐ reminder appears after push lift / swap cross settles (not when fly lands)

- **row.js v1.87** — return-to-bar no longer auto-refunds swap on swap-paid columns

- **star-powers.js v1.14, placement-row.js, row.js v1.86** — swap cost ⭐ stays at bottom↔middle; cost reminders persist while dragging top die

- **pip-anim.js v1.15, star-refund-anim.js v1.2, row.js v1.85, stack-swap-anim.js** — push refund on swap+push stack: fly from push gap only, HUD balance correct, swap ⭐ reminder stays

- **star-powers.js v1.13, state.js v2.32** — cost reminders split by action: push → row 0 only; swap → row 0 (2-die) or row 1 (after push)

- **row.js v1.84, placement-anim.js v1.41** — fix swap→push: bar push no longer re-checks star balance at commit after `deductState`

- **state.js v2.31, star-powers.js v1.11, pip-anim.js v1.14, stack-swap-anim.js v1.5, placement-anim.js v1.40, placement-row.js, row.js v1.83, star-refund-anim.js v1.1, turn.js v2.49** — push/swap: deduct star cost when HUD fly-in begins; vertical ⭐ reminder between bottom + second die until confirm

- **stars.js v1.9** — `pushSwapStars` OFF: swap columns fully muted (no stars even for this-turn dice in swapped stack)

- **stars.js v1.8** — `pushSwapStars` OFF: exclude push-below tray commits from eligibility; block matches that lean on push/swap-settled dice in muted columns

- **pip-anim.js v1.15** — all star pip flies anchor to `#hud-star-pay` (pay, collect, refund, sweep bank origin)

- **star-reroll-input.js v1.5** — `starPowers` ON: HUD star tap disabled; flip/swap/reroll pay via drag only (dice star-cost taps unchanged)

- **hud-v2.js v1.13, hud-v2.css, settings-panel.js v1.42, tutorial-steps.js** — settings triple-tap moved to left points score only (stars / suit block no longer open settings)

- **settings.js v2.39, stars.js v1.7** — `pushSwapStars` toggle (default OFF): push-below / stack-swap columns no longer earn placement stars unless ON

- **drag-drop.js v2.45** — return-to-tray: dice-tray rect only (not action-bar padding gutter); clear `draggingDieId` before tray render so returned die is not hidden in bar

- **drag-drop.js v2.44, placement-row.js** — cancel zone below row / outside action bar: no snap commit; snap re-resolved at release (not stale ghost); push-below snap gated to on-row pointer; return-to-tray uses action-bar rect

- **drag-drop.js v2.43** — cancelled row reposition (illegal drop / no slot) calls full `render()` so dice cannot vanish after reposition-collapse or drag-source hiding

- **pip-anim.js v1.13, star-reroll-input.js v1.4, flip-tray-anim.js v1.2, reroll-outer-anim.js v1.6, domino-reroll-anim.js v1.4, stack-swap-anim.js v1.4** — HUD star drag-drop skips redundant HUD→target fly-in (tap still flies)

- **stars.js v1.6, turn.js v2.48** — star pairs after push-below or stack swap: all dice in the mutated column count as eligible (fixes row-0/row-1 horizontal matches when push shifts settled dice upward)

- **row.js v1.82, star-refund-anim.js v1.0, drag-drop.js v2.42, placement-anim.js v1.39** — all star-power refunds trigger flying-star animations immediately (return-to-bar: push-below / swap / flip; push-below reposition credit)

- **placement-row.css, base.css** — gap ⭐ markers (`--z-row-stars: 150`) paint above row dice; HUD unchanged

- **pip-anim.js v1.12, pip-anim.css, star-reroll-input.js, base.css** — `#star-fly-layer` at `--z-star-fly: 850` so star animations always paint above in-game flyers (incl. convert cube 650)

- **stack-swap-anim.js v1.3, convert-anim.css** — stack swap cross: isolated white backdrop wraps + `multiply` blend; skip pre-render unwrap (fixes end flash)

- **game-over.js v2.6, suit-tally.js v1.7, suit-tally.md** — end bonus + score breakdown on every game over when `sweptSuits` ON (not suit-cap only)

- **game-over.js v2.5, index.html** — suit-cap score breakdown: single box (no nested wrapper); hide redundant hero stat row when breakdown shows

- **row.js v1.81, placement-row.js** — push-below snaps for repositioned dice: `stack-below` slots listed for placed dice (not bar-only); push-target highlights during placed-die drag; push die re-push gets star credit so zero-balance snap still works

- **row.js v1.80** — repositioning a push-below die refunds `pushBelowStarCost()` (same as return-to-bar), not just clearing `pushBelowDieIds`

- **row.js v1.79, placement-anim.js v1.38, reposition-collapse.js v1.10** — fix pushed die vanishing on reposition drag: restore snap ghosts for push-below bottom dice; allow `placeDie` to reposition them (clears `pushBelowDieIds`, no star refund); restore stack-shift DOM on failed drop instead of resetting state before cleanup

- **row.js v1.78, reposition-collapse.js v1.9** — fix pushed dice vanishing on drag: a placed non-top die (push-below bottom die) now reports no reposition slots (`getValidSlotsForDie` → `[]`) so its only valid drop is the bar — no more silently-failing snap that stranded the upper dice shifted down over it; `clearPushReturnCollapse` now scans the DOM so shift transforms always restore even after `resetPushReturnCollapse` nulled the tracked list

- **handlers.js v2.14** — tap-to-return a pushed die now works like drag: `consumeRowClickBlock()` moved to the top of the click handler (all modes, before push-below re-attempt) so a tap that returns/refunds a die swallows its trailing click instead of re-pushing the just-returned die below the same column

- **game-over.js v2.4, game-over.css, suit-tally.js v1.6, index.html** — suit-cap game over: apply end bonus via tally check (not reason string only); score breakdown (swept + unique − duplicates + lowest suit → total)

- **sweeps-row.js v1.21, sweep-anim.js v1.17, pip-anim.js v1.11, game-log.js v1.3, suit-tally.js v1.5, settings.js v2.38, settings-panel.js, tutorial-steps.js** — sweep bank `(length − 2) × effectiveStars` (0 stars → 1); tricolor flush ×1 cap kept; end bonus `sweptLowSuitBonus` + unique discovery − `sweptDuplicatePenalty` per extra suit:rank copy

- **handlers.js v2.13, row.js v1.77** — settled swapped stacks: click refunds the swap (`tryRefundSwapStack`) without an active stroke; this-turn die placed on a stack stays draggable off even after a swap moves it to the bottom of a 2-die stack

- **state.js v2.30, star-powers.js v1.10, flip-tray-anim.js v1.1, row.js v1.76, turn.js v2.47, placement-row.js, base.css** — Star flip (Action A) refund: `flippedDieIds` tracks odd flips this turn; returning a flipped die to the tray refunds 1 star + reverts its face; active suit-tint stroke limited to just-placed (returnable) dice only (swap-refundable no longer tinted)

- **state.js v2.29, star-powers.js v1.9, row.js v1.75, turn.js v2.46, stack-swap-anim.js v1.1, pip-anim.js v1.10, drag-drop.js v2.41, placement-row.js, placement-row.css** — Star Powers stack swap (Action B) refund: track `swapStackCols` this turn; tap swapped stack reverses order + star fly to HUD; return returnable die from swapped col also refunds star; block re-swap until refunded

- **placement-anim.js v1.37** — fix push-below lift direction: pusher + stack rise one step from the ghost (bottom-anchored columns grow upward), was driving them down before render snap

- **placement-anim.js v1.36, drag-drop.js v2.40, placement-input.js** — push-below: never commit from pointer drag flyer; always ghost handoff or snap-anchor spawn; re-sync after scroll pin

- **placement-anim.js v1.35, push-below-flyer.js** — fix push-below lift start pose: re-sync promoted ghost to live snap anchor; reset stack/flyer transforms before lift anim

- **reposition-collapse.js v1.8, placement-row.css** — fix push-return drag: translate upper dice one stack step instead of flex-vacate (was dropping column below row baseline)

- **reposition-collapse.js v1.7, drag-drop.js v2.39, placement-row.css** — push-return drag: vacate bottom pushed die from flex on drag start so upper dice collapse to column bottom instantly; restore on cancel

- **state.js v2.28, star-powers.js v1.8, row.js v1.74, convert.js v1.15** — Bugger Singles: outer-on-outer stacks (any 1/6 pair); `buggerOuterStackLockedCols` gates convert until push-below unlocks; permissive inner push on 2-die all-outer stacks

- **star-powers.js v1.7** — tray flip extends to outer 1/6 when `rerollOuter` OFF; reroll still wins when both toggles ON

- **settings.js v2.37, settings-panel.js v1.40, star-powers.js v1.6, row.js v1.73, placement-row.js, placement-input.js, placement-anim.js v1.34, pip-anim.js v1.9** — `pushBelowCost` Bugger stepper (0=off, 1–5=star cost per push); requires `starPowers` ON; migrates saved `starPowers:true` → cost 1; `buggerSingles` + outer-bottom guard gated on cost > 0; variable deduct/refund + multi-star fly

- **placement-anim.js v1.33** — push starts snapped: no fly-in leg, pusher spawns at the snap anchor and only the lift animates (drops the transform bake that displaced the start in Y)

- **row.js v1.72** — an outer 1/6 bottom die accepts nothing on top (`passesOuterBottomGuard`), so no stack has an outer bottom; push placements run the duplicate-tile gate on the resulting `[push, v0, v1]` stack

- **star-powers.js v1.5** — stacks of two equal faces may not be swapped (flipped); stacks containing any outer 1/6 may not be swapped

- **drag-drop.js v2.38, placement-anim.js v1.32** — fix push-below drop throwing: snap slot captured before `takeSnapGhostForCommit` nulls it (caused stall, leftover accent ghost, tray duplicate); drop path wrapped in recovery net; push-below commits exactly once even without a flyer

- **row.js v1.71, placement-anim.js v1.31, drag-drop.js, placement-row.js** — push-below commit bypasses rolled-phase gate in placeDie; keep bar die hidden until anim finishes; bake flyer transform before lift; fix stack-through-flyer zone bias

- **placement-anim.js, row.js** — fix broken push-below anim (duplicate fn syntax), lift pusher+stack together, validate before state mutate in placeDie

- **row.js, placement-anim.js, drag-drop.js, placement-input.js** — push-below snap requires stars; fix stuck flyer + animating phase when commit fails; promote ghost after validation

- **push-below-flyer.js, placement-spread.js** — break import cycles: flyer helpers leaf module; `computeSpreadOffsets` out of placement-anim ↔ placement-hover loop; star-powers never imports row

- **placement-anim.js v1.30, drag-drop.js, placement-input.js, row.js, state.js, turn.js** — push-below: star fly + die move parallel; snap ghost promotes to commit flyer; return push die refunds star

- **star-powers.js v1.2** — restore outer-top push: top 6 → push ≤ bottom; top 1 → push ≥ bottom (tray still 2–5 only; uniform stacks blocked)

- **star-powers.js v1.1, placement-anim.js, placement-row.css, timing.js** — push rules: tray 1/6 cannot push; block uniform stacks and outer-topped stacks; lift anim on commit

- **row.js, star-powers.js, placement-row.js, drag-drop.js, placement-anim.js, placement-anim.css** — push-from-below snap: preview without star balance; ghost anchors below stack; below-zone pointer bias; drag highlights; star gate on commit anim

- **handlers.js, placement-input.js, placement-row.js, placement-row.css** — tap-to-push: select tray die → tap bottom die of stack; bottom dice highlight accent when push valid

- **row.js v1.68, placement-row.js, placement-input.js, drag-drop.js, placement-anim.css** — fix push-from-below: stop hiding `stack-below` whenever top-stack also valid; snap resolves below-zone + overlapping-anchor dedupe only

- **star-powers.js v1.0, settings.js v2.36, settings-panel.js, state.js v2.27, row.js v1.67, star-reroll-input.js v1.3, flip-tray-anim.js v1.0, stack-swap-anim.js v1.0, placement-anim.js v1.28, pip-anim.js v1.8, placement-row.js, placement-row.css** — `starPowers` + clamped `buggerSingles`: tray flip (2–5), 2-dice swap, push-from-below (`stack-below` slot + star fly), bugger 1/6 columns gated until push-below

- **hud-v2.css v1.12** — star score count uses accent color (warning flash returns to accent)

- **viewport-controls.css v1.4** — full-screen button pinned bottom-left (was bottom-right)

- **turn.js v2.45** — restore suit-cap game over in `evaluateGameOver('post-confirm')`; safety net in `tryContinueAfterConfirm` if confirm callback missed cap after tally pipeline throw/recover

- **turn.js v2.44** — nRoll=4 + dominoRoll (not only Domino Spots): roll/KO threshold and pool debit use N-place (2), not N-roll (4)

- **suit-tally.js v1.4** — suit-cap end bonus adds 1 pt per unique swept rank+suit combo (max 52) on top of 2× lowest suit tally

- **viewport-controls.js v1.3, viewport-controls.css v1.3** — full-screen button pinned bottom-right (landscape too); square frame / reverse square frame SVG icons

- **sweeps-row.js v1.20** — restore `releaseWithheldDice` import dropped when suit tally landed (sweep throw skipped tally HUD + row collapse)

- **suit-tally.js v1.3** — guard `convertSweepTiles` if missing (HMR/stale state)

- **convert.js v1.14** — restore `tickDeckOnConvert` import dropped when suit tally landed (convert throw left phase stuck on `animating`)

---

- **suit-discovery-overlay.js v1.6** — discovery grid rows reversed (V at top, A at bottom)

- **suit-discovery-overlay.css v1.13** — rank header column: white text only (no overlay blend)

- **suit-discovery-overlay.css v1.12** — lighten rank header overlay + horizontal gridlines

- **suit-discovery-overlay.css v1.11** — rank header column: white text + dark overlay blend; darker horizontal gridlines

- **suit-tally.js v1.3, game-over.css, suit-discovery-overlay.css** — suit-cap end bonus 2× lowest (was 10×); suit box + discovery work when game-over sheet collapsed

- **suit-discovery-overlay.css v1.10** — discovery grid horizontal row lines only (no vertical gridlines)

- **suit-discovery-overlay.css v1.9** — discovery grid borders hidden

- **suit-discovery-overlay.css v1.8** — equal overlay + panel padding on all sides

- **suit-discovery-overlay.css v1.7** — discovery grid cells center-aligned (rank header + suit columns)

- **suit-discovery-overlay.css v1.6** — discovery grid uses Numbers Deuce throughout (rank header + suit cells)

- **suit-discovery-overlay.js v1.5, suit-discovery-overlay.css v1.5** — rank labels in fixed header column (colgroup + rowhead styling)

- **suit-discovery-overlay.css v1.4** — duplicate suit glyphs inline on one row (no vertical stack)

- **suit-discovery-overlay.js v1.4, suit-discovery-overlay.css v1.3, suit-tally.js v1.2** — discovery grid: no suit header row; 14px suit glyphs; one glyph per swept tile (duplicates visible)

- **suit-tally.js v1.2, convert.js, state.js v2.26** — Switcher Joker converts record as swept (HUD suit tally + discovery grid joker/V row)

- **suit-discovery-overlay.js v1.3** — joker rank row label `V` (internal key still `*`)

- **suit-discovery-overlay.js v1.2, suit-discovery-overlay.css v1.2, action-bar.css** — mount discovery overlay only while suit box held (no idle DOM blocker); roll-btn-wrap `pointer-events: auto`

- **suit-discovery-overlay.css v1.1** — fix hidden overlay panel intercepting roll/row clicks (`pointer-events` on descendants)

- **suit-discovery-overlay.js v1.0, suit-discovery-overlay.css, suit-tally.js v1.1** — press/hold HUD suit box shows session swept-tile 13×4 discovery grid (Z X Y W stacks per cell)

- **suit-tally.js v1.0, sweeps-row.js, convert.js v1.13, turn.js, game-over.js** — `sweptSuits` ON: end at suit count > 12; game-over bonus 10 × lowest suit tally

- **convert.js v1.12** — Switcher Jokers convert increments `suitTally` for missing inner die suit

- **hud-v2.css v1.11** — fix suit box bg: `--bg` base + `isolation` so overlay blend ignores score text behind

- **hud-v2.css v1.10** — points mirror right score edge inset; left-aligned text

- **hud-v2.css v1.9** — star icon X aligned to roll button / domino badge centre (36px inset)

- **hud-v2.js v1.8, hud-v2.css v1.8** — suit box pinned to HUD horizontal center; stars left, points right

- **hud-v2.js v1.7, hud-v2.css v1.7** — suit box vertically centered to score figure cap height (`1em` align strut)

- **hud-v2.js v1.6, hud-v2.css** — score block centered; pipe separators removed

- **hud-v2.css v1.5** — swept-suit box uses action-bar overlay surface (`var(--overlay)` + blend)

- **hud-v2.css v1.4** — swept-suit box uses `var(--bg)` (action bar surface)

- **hud-v2.css v1.3** — swept-suit counts in white rounded box within score row

- **hud-v2.js v1.2, hud-v2.css** — swept-suit counts inline in score row: stars | counts | points (right-aligned)

- **settings.js v2.35, hud-v2.js v1.1, hud-v2.css, dice-visual.js, tutorial-steps.js, tutorial.js** — `sweptSuits` toggle (default ON): per-suit swept tile counts left (Figma Z X Y W); score right-aligned

- **starting-dice.js v1.4** — all pairs stacked; odd die singleton at random column index

- **starting-dice.js v1.3** — reverse pair stack rule: any outer → stack; both inner → two singles

- **starting-dice.js v1.2** — pair-roll seed: both inner → stack; any outer → reroll outers, two singles

- **starting-dice.js v1.1** — random column count + 1/2 height mix; seed inner faces only (2–5)

- **starting-dice.js v1.0, settings.js v2.34, turn.js v2.43, settings-panel.js** — `startingDice` Counts stepper: seed random row dice on reset (≤2/col, contiguous around center); debits dicePool; `shouldWarnOnLeave` accounts for seed

- **domino-roll.js v1.30** — Domino Spots OFF: depleted pool full-rebuilds all combos (nRoll 2/3/4); drop discard-merge-on-draw that left used nRoll=4 pairs missing

- **sweep-anim.js v1.16** — sweep prelude suit cube glyph starts in suit color (not gray)

- **sweep-anim.js v1.15, dice-visual.js, placement-row.js, sweep-anim.css** — fix sweep cube prelude: overlay anchored on tile-cube (not col); suit cube persists in tile through fly-away

- **state.js v2.25** — `sweepExit.suitFlownCols`, `sweepExitPreludeTimer`; cleared in `clearSweepExitTimers`

- **monotonic.js v1.9** — lock PATH RULE invariant: linear between unless ace in pair; rename wheel helpers to aceWheelArc/aceUnionArc (aceBetween only); linearBetween + pairHasAce

- **monotonic.js v1.8** — 3+ non-ace between gaps use linear min..max (fixes [3]..[12] blocking 11)

- **monotonic.js v1.7** — ace+3–11 between gaps use linear 1..R (fixes [12][A]..[10] blocking 2); 3+ anchor gaps pair-local via shared aceBetween helper

- **monotonic.js v1.6, sweeps-row.js** — monotonic anchors include pending 3-dice stacks (recalc within turn / post-sweep); clear tile warning cols on sweep

- **monotonic.js v1.5** — 3+ anchors: ace anywhere in span → outward-left allows all ranks ([2][A][12] calibration)

- **monotonic.js v1.4, row.js v1.66, placement-input.js v1.4** — wheel-based Monotonic rewrite: segment zones, short/long arcs, ace 1|13, calibration layouts

- **monotonic.js v1.3** — [A][3–11]: left of ace `< 13`, right of partner `> R`; keep [A][2] and [A][12] edge wraps

- **monotonic.js v1.2** — ace boundary outward: partner ≥12 wraps low (ace as 1); partner <12 wraps high (≥13); between uses ace as 1 only

- **monotonic.js v1.1** — fix outward zones: left allows rank ≤ rLow, right allows rank ≥ rHigh (was inverted)

- **settings.js v2.33, monotonic.js v1.0, row.js v1.65, invalid-flash.js v1.4, placement-input.js v1.3** — `monotonic` KEEP toggle: Dice & Cubes rank-cube anchors (≥2) define spatial zones; ace dual 1|13 recalc; jokers exempt; blocked 3rd-die flash + boundary cube borders

---

- **domino-roll.js v1.28, turn.js v2.41, domino-reroll-anim.js v1.2** — revert star-pay domino redraw to exact former ↺ logic (discard offer + pool draw)

- **domino-roll.js v1.27, turn.js v2.40, domino-reroll-anim.js v1.2** — fix star-pay domino redraw (phase gate during anim); discard offer + two random spaced dice

- **domino-reroll-anim.js v1.1, star-reroll-input.js v1.2, action-bar.js v1.66, action-bar.css, pip-anim.js** — domino star-pay redraws whole pair (both dice highlight; star flies to pair centre; blocks outer reroll on 1/6 during offer)

- **domino-spot-strip.js v2.22** — deck badge X anchored to roll-wrap right inset (stable when KO endgame expands roll button)

- **turn.js v2.39** — nRoll=2 + nPlace=2 + Domino Roll: fresh game starts with N-place (2) stars for domino star-pay redraw

- **domino-reroll-anim.js v1.0, star-reroll-input.js v1.1, action-bar.js v1.65, action-bar.css, handlers.js v2.12, hud-v2.js, domino-roll.js v1.26, turn.js v2.38** — nRoll=2 domino redraw: remove ↺ button; 1-star HUD drag/tap onto tray pair

- **domino-roll.js v1.25, action-bar.js v1.64** — nRoll=2 ↺ stays at 33% opacity when spent or when domino dice are placed (not hidden)

- **domino-roll.js v1.24, action-bar.js v1.63, action-bar.css** — nRoll=2 ↺ stays visible at 33% opacity after use (disabled, not hidden)

- **domino-roll.js v1.23, domino-spot-strip.js v2.21, action-bar.js v1.62** — seam-strip deck badge uses pool-only count (ticks on roll/draw); post-↺ tray dice use normal gap (not domino)

- **deck-size.js v1.3** — nRoll=2 + nPlace=2 Domino Roll: seam-strip deck badge (same as nRoll=4), not HUD

- **domino-roll.js v1.22, turn.js v2.37, action-bar.js v1.61, action-bar.css, handlers.js v2.11, state.js v2.24** — nRoll=2 Domino Roll: seamless domino pair tray; ↺ reroll discards offer, redraws from pool once per roll

- **domino-roll.js v1.21, turn.js v2.36** — Domino Spots OFF: depleted domino pool merges discard then full rebuild (no game over); nRoll 2/3 confirm discards offered combo to discard pile

- **settings.js v2.32, settings-panel.js v1.38, dice-visual.js v2.13, convert.js v1.11, row.js v1.64, convert-anim.js v1.21, convert-anim.css, placement-row.js** — `switcherJokers` toggle: tricolor stacks convert to lone die of missing inner color (not joker tile); stripped cube-joker anim; mutual exclusive with `tricolorSevens`; respects `aceJokerStarCost`

- **row.js v1.63, stars.js v1.5, placement-row.js** — Dice & Cubes: allow gap insert next to tile (not between tiles); tile suit-die stars with adjacent matching die; cube-tile insert/snap/star anchor fixes

- **convert-anim.js v1.20** — Joker cube convert: arc flyers spawn from bottom suit die (not rank cube)

- **convert-anim.js v1.19, convert-anim.css, dice-visual.js v2.12** — Joker cube convert: missing-suit die crossfades at bottom suit slot (replaces stack bottom); tricolor joker `bottomValue` = missing inner die

- **convert-anim.js v1.18, convert-anim.css** — Dice & Cubes joker convert: mid+top collapse to bottom, missing-suit die fade-in at mid, all three stack dice arc-fly

- **convert-anim.js v1.17, convert-anim.css** — Dice & Cubes arc flyers at 50% opacity (fade to 0 on landing)

- **timing.js v1.9** — `CUBE_MERGE_MS` 280→140 (2× faster cube merge)

- **convert-anim.js v1.16, convert-anim.css** — Dice & Cubes merge: rank overlay on mid (no layout shift); shell deferred until merge ends; top z-index 4

- **convert-anim.js v1.15** — Dice & Cubes: rank cube fade starts with top-die merge (parallel); fly still at fade end

- **convert-anim.css v1.14** — Dice & Cubes fly: z-index 650 so arc passes over action bar into roll button

- **convert-anim.js v1.13, convert-anim.css** — Dice & Cubes fly: spawn on viewport-inner in front of row (z-index 500), not behind shell

- **convert-anim.js v1.12, convert-anim.css, timing.js v1.8** — Dice & Cubes fly: scale down at rank cube, then upward arc to roll (not straight line)

- **convert-anim.js v1.11** — Dice & Cubes fly: spawn both dice at rank cube XY after fade; fly + color/stroke parallel (not sequential)

- **drag-drop.js v2.36** — fix drag duplicate: remove tray die from bar on drag start (`renderActionBar`); snapping shows snap ghost only (hide pointer flyer while ghost has a slot)

- **convert-anim.js v1.10, convert-anim.css** — Dice & Cubes fly: append flyers inside column behind shell (z-index 1 vs 2); strip overlay blend before fly; container-local coords

- **convert-anim.js v1.9, convert-anim.css** — Dice & Cubes convert: single shell (no overlay swap), pre-capture fly coords, skip is-new pop on final render

- **convert-anim.js v1.8** — Dice & Cubes convert alignment: design-space merge step, stackBottomUp-aware roles, rank overlay + shell anchored from bottom die

- **convert-anim.js v1.7, convert-anim.css, dice-cubes.css** — Dice & Cubes convert: overlay-blend merge, rank cube covers mid+top, fly then suit-color glyph + 6px inset stroke; die-stack gap on resting tile

- **settings.js v2.31, settings-panel.js, dice-visual.js v2.11, placement-row.js, dice-cubes.css, convert-anim.js v1.6, convert-anim.css, timing.js v1.7, sweep-anim.css, base.css** — `diceAndCubes` toggle (Keep): row tiles render as rank cube + suit die; merge→fly-back→wrapper convert anim; clamps `tileDiceHold` ON

- **row.js v1.62** — `nextMustFollow` fix: lone-die check excludes repositioned die so insert stays blocked after stacking then removing/repositioning top die

- **row.js v1.61** — `nextMustFollow` relaxed: blocks gap-insert/new-column when lone-die value matches; stack on any valid column still allowed

- **row.js v1.60, settings.js v2.30** — `nextMustFollow` toggle: matching lone-die columns force stack placement (bar + row reposition)

- **nine-cubes.js v1.1, settings.js v2.29, settings-panel.js** — `nineCubes` stepper 0–2 (0=off, 1=one set, 2=two identical cube sets); capacity per cube equals setting value

- **nine-cubes.js v1.0, row.js v1.59, settings.js v2.28, invalid-flash.js v1.3, placement-input.js** — `nineCubes` toggle: 52 tiles partition into 9 cubes; converted row tile locks cube; stack completion blocked + locking tile warning-red flash

- **sweeps-row.js v1.19, sweep-anim.js v1.13, tutorial-steps.js** — chain sweeps: sum each run’s star multiplier before banking (was max)

- **sweeps-row.js v1.18** — consecutive sweeps: ace is low (A–2–3) or high (11–12–A) only; wheel wraps like 2–A–12 / 12–A–2 no longer qualify

- **domino-roll.js v1.20, domino-spot-strip.js v2.20** — Domino Spots splits pool/counter rules: ON = full 21/56 pool, pool-only badge, red below 2; OFF = deckSize cap, pool+discard+offers count, short-draw reshuffle

- **domino-roll.js v1.19** — Domino pair/triple pools always start at full size (21/56); deckSize no longer caps domino lists

- **domino-roll.js v1.18, domino-spot-strip.js v2.19, domino-spot-strip.css v2.17** — Domino deck badge: pool-only count; warning-red when below 2

- **domino-roll.js v1.17, turn.js v2.35** — Domino Spots ON: no discard reshuffle on draw; active pool empty → game over; reshuffle only on sweep

- **settings.js v2.27, settings.md, state.js v2.23, state.md, convert.js v1.10, sweeps-row.js v1.17, dealt-strip.js v1.2, turn.js v2.34, action-bar.js v1.60, convert-anim.js v1.5, EVENTS.md** — `tileDiceHold` toggle: convert returns 2 dice + withholds 1 virtual die per tile until sweep/pair-sweep; roll-button count only feedback; convert anim flies 2 not 3

- **domino-roll.js v1.16, domino-spots.js v1.16** — Domino Spots ON: merge discard into pool and shuffle on sweep (and pair-sweep)

- **turn.js v2.33** — nRoll=4 + Domino Spots: pool-low/KO/endgame at N-place; roll debits N-place; count=2 rolls normally; convert stack still blocks KO at 0

- **turn.js v2.32, action-bar.js v1.59** — nRoll=4 + Domino Spots: roll-button pool number turns warning red only below N-place (border/KO threshold unchanged at N-roll)

- **domino-spot-strip.js v2.18, render.js** — Discard pile pre-init: shell + band geometry before first discard; position after action bar; no is-positioned flash on first show

- **domino-spot-strip.js v2.17, domino-spot-strip.css v2.16** — Discard pile: vertical scroll when wrapped rows overflow band; flex-wrap + overflow-y auto

- **domino-spot-strip.js v2.16, domino-spot-strip.css v2.15** — Discard pile: equal top/bottom/right margin (vertical-centre inset applied to right padding)

- **domino-spot-strip.js v2.15, domino-spot-strip.css v2.14, domino-roll.js v1.15, render.js** — Domino Spots discard pile: same domino-spot glyphs, LTR row (2px gap) under roll button, vertically centred in roll-wrap→screen band; deck-badge toggle hides seam spots and discard

- **domino-spot-strip.css v2.13** — Sweep exit CSS: beat pop + row-sweep-v on seam domino stacks (matches tile timing; logic unchanged)

- **domino-spots.js v1.15, domino-spots.md** — Used-spot vacate (tray return or stack merge) promotes remaining unused-spot column to USED

- **domino-spots.js v1.14, domino-spots.md** — Used-spot die stacking onto unused-spot column rebinds seam domino to USED (sole locked-binding exception)

- **domino-spot-strip.js v2.13, domino-spot-strip.css v2.12, reposition-collapse.js v1.6** — Hide seam domino via CSS class during sole spot drag; no strip rebuild so column collapse FLIP is unaffected

- **domino-spots.js v1.14, reposition-collapse.js v1.5, reposition-collapse.md** — Hide seam domino as soon as sole spot die drag starts; restore on cancel or commit

- **domino-spots.js v1.13, domino-spots.md** — Pre-confirm vacate unbinds spot only; roll offers persist so returning a pair and switching pairs reallocates domino spots correctly

- **domino-roll.js v1.14, domino-spots.js v1.12, state.md** — Domino deck counter = pool + discard + tray offers (excludes locked row spots)

- **domino-roll.js v1.13, domino-spots.js v1.11, state.md** — Domino deck counter = pool + discard (excludes tray offers and locked row spots); discard syncs badge on sweep/confirm

- **domino-spot-strip.css v2.11** — Deck badge hidden state: white text, no fill, 2px inset white ring

- **state.js v2.22, domino-spot-strip.js v2.11, domino-spot-strip.css v2.10, handlers.js v2.10** — Tap deck badge toggles seam domino spot visibility (`dominoSpotsVisible`)

- **domino-spot-strip.css v2.9** — Deck badge circle 24×24px

- **domino-spot-strip.css v2.8** — Deck badge fixed 30×30px circle (digit count does not resize)

- **domino-spot-strip.js v2.8** — Deck badge X aligned over roll-button centre (not left mirror)

- **domino-spot-strip.js v2.7, domino-spot-strip.css, action-bar.js v1.58, render.js** — Fix deck badge clip: render on seam strip (not action-bar overflow)

- **action-bar.js v1.57, action-bar.css, domino-spot-strip.js v2.6, render.js** — Domino deck badge in seam row (domino-spot Y); left side mirrors roll-button die center

- **action-bar.js v1.56, action-bar.css** — Domino deck counter centred between die top and tray pipe; white circle badge with `--bg` text

- **domino-roll.js v1.12, domino-spots.js v1.10, turn.js v2.32** — Deck counter includes untied tray offers (nRoll=4 roll stays at 21 until tied/discarded); vacate removes offer before pool return

- **domino-roll.js v1.11, domino-spots.js v1.9, state.js v2.21, turn.js v2.31** — Domino discard pile: swept + unbound offers → discard; discard reshuffles into pool when draw is short; HUD counter = active pool length (excludes tied spots and discard); vacate pre-confirm still returns key to pool

- **action-bar.js v1.55, action-bar.css** — Domino spots ON: deck counter above tray `|` (mirrored offset; was below)

- **domino-spot-strip.js v1.4, domino-spot-strip.css v2.4, base.css, placement-row.css** — Domino spots vertically centred in row↔seam gap (measured from column bottom); `--row-seam-gap`

- **dice-visual.js v1.9, domino-spot-strip.css v2.3** — Domino spot dice scaled to 20×20px (was 24px)

- **dice-visual.js v1.8** — Inline domino spot dice: square corners on touching seam (outer + face paths)

- **domino-spot-strip.css v2.2, dice-visual.js v1.7** — Between-zone domino stacks: bottom edge aligned to row↔tray seam (was vertically centred)

- **dice-visual.js v1.6, action-bar.js** — Six pips rotate 90° in row/drag/anim; tray and domino-spot strip stay upright

- **dice-visual.js v1.5, domino-spot-strip.css v2.1** — Domino spot dice: 24px each, 1px border, −1px pair gap

- **dice-visual.js v1.4, domino-spot-strip.css v2.0** — Between-zone domino spots: horizontal row; stack width matches `--die-size`

- **dice-visual.js v1.3, domino-spot-strip.css v1.9** — Remove domino stack stroke overlay; white borders from die SVG only

- **dice-visual.js v1.2, domino-spot-strip.css v1.8** — Domino inner ring per die, stroke overlaps die border band; dice layout/stack overlap restored

- **dice-visual.js v1.1, domino-spot-strip.css v1.7** — Domino spot stack: dice overlap matches border width; SVG inner frame aligned to die geometry; outer border from die SVG only

- **domino-spot-strip.css v1.6** — Between-zone domino stacks: white inner border (same width as outer) around full stack

- **dice-visual.js, domino-spot-strip.css v1.5** — Between-zone domino spot dice: white face, colored pips, white borders (inverted face/pips only)

- **row.js v1.58** — Register spot when repositioning row die to new column without vacating source

- **domino-spots.js v1.8, state.js v2.20, row.js v1.57, convert.js, dealt-strip.js** — `dominoSpotKeys` map survives column recreate/reposition; keys only released on sweep (or pair-sweep/vacate)

- **domino-spots.js v1.7** — Locked domino binding: existing spot cols never rebind on stack or selection change

- **domino-spot-strip.css v1.4, dice-visual.js** — Fixed seam Y: anchor on wrap (px), opacity-only enter anim (no transform conflict)

- **domino-spots.js v1.6, row.js v1.56, convert.js** — Preserve seam dominoes on convert, column shift, and reposition; only sweep removes them

- **domino-spot-strip.js v1.3, domino-spot-strip.css v1.3, render.js v1.8** — Hide seam dominoes until column layout measured; double-rAF position after scroll restore

- **domino-spots.js v1.5, render.js v1.7, drag-drop.js v2.36** — Spot 1 this turn tracks engaged pair; seam domino rebinding on selection/drag change

- **domino-spot-strip.css v1.2** — seam anchor at strip top (row↔between-zone border), matching dealt tiles

- **domino-spot-strip.js v1.1, domino-spot-strip.css, domino-spots.js v1.4, state.js v2.19, turn.js v2.30, dice-visual.js** — Spot strip: dice-touch seam alignment; dominoes persist across rolls until sweep; deck tick uses spots created this turn only

- **domino-spot-strip.js v1.0, domino-spot-strip.css, dice-visual.js, domino-roll.js v1.10, domino-spots.js v1.3, state.js v2.18, settings.js v2.26, settings-panel.js v1.37, render.js v1.6, placement-hover.js v1.13, placement-anim.js v1.27, reposition-collapse.js v1.4, index.html, base.css, main.js** — Domino spot strip: half-size vertical domino stacks on seam, column-aligned, motion/scroll sync; `dominoSpots` ↔ `tileDealtEvery` mutually exclusive

- **domino-spots.js v1.2, row.js v1.55, state.js v2.17** — Domino Spots: deck tick + discard by spots created (0/1/2 columns); 0 spots discards all offers

- **domino-spots.js v1.1, domino-roll.js v1.9, turn.js v2.29** — Domino Spots: deck counter ticks on confirm by assigned spot count (1 or 2), not per roll

- **domino-spots.js v1.0, settings.js v2.25, settings-panel.js v1.36, state.js v2.16, domino-roll.js v1.8, turn.js v2.28, row.js v1.54, sweeps-row.js v1.16** — `dominoSpots` toggle: spot 1 = used domino, spot 2 = unused; column `dominoKey` bind until sweep; requires `dominoRoll`

- **dealt-strip display v1.2, dealt-strip.css, sweep-anim.js v1.11, placement-row.js, dice-visual.js** — between-zone sweeps use same beat + pop + row-sweep-v as row tiles (pair-sweep + row-sweep cascade)

- **dealt-strip.js v1.1, dealt-strip.css, dealt-strip display v1.1** — strip tiles: true 50% dimensions (fixes is-new scale override), 0 gap, sorted A→* by rank

- **dealt-strip.js v1.0, dealt-strip.css, dealt-strip display v1.0, state.js v2.15, tile-deck.js v1.1, turn.js v2.26, row.js v1.53, settings.js v2.24, settings-panel.js v1.35, render.js v1.6, invalid-flash.js v1.2, sweep-anim.js v1.10, handlers.js v2.10, drag-drop.js v2.34, placement-anim.js v1.27, placement-row.js, placement-input.js, action-bar.js v1.53, action-bar.css, index.html, base.css** — Tile Dealt strip redesign: half-size tiles on row↔tray seam (accumulate per cadence roll); block duplicate converts with flash + 3s warning border; accent tap pair-sweeps row duplicate without score; row sweeps clear strip; deck empty → WELL DONE; removed bar dealt tile, chain draw, deal-discard anim, N-place gating, reposition

### Changed
- **turn.js v2.27** — Domino Roll deck counter: first roll shows full cap; ticks down from 2nd roll click onward
- **domino-roll.js v1.7, drag-drop.js v2.35** — Domino Roll nRoll=4: pair lock from engaged pair (drag/select/row); tray return clears selection and unlocks when all quad dice idle
- **action-bar.css** — domino deck count top edge sits below die bottom (more gap from `|`)
- **domino-roll.js v1.6, deck-size.js v1.2, action-bar.js v1.53, action-bar.css, hud-v2.js** — Domino Roll nRoll=4: pair lock clears when all quad dice are back in tray; deck counter moves under tray `|` at half HUD size (hidden from top-left HUD)
- **action-bar.js v1.51** — nRoll=4 domino tray: toward-`|` shift starts on drag, not only after placement
- **action-bar.js v1.50, action-bar.css** — nRoll=4 domino tray: remaining dice hug `|` after placement from that pair
- **domino-roll.js v1.5, turn.js v2.26** — Domino Roll HUD counter decrements only on roll-button roll (not on confirm/pool settle); resets when it hits 0
- **action-bar.js v1.49, action-bar.css** — nRoll=4 domino tray: fixed-width pair slots centre remaining dice; pipe separator stays put
- **action-bar.js v1.48** — fix nRoll=4 domino tray showing placed dice (filter pairs by actionBar)
- **action-bar.js v1.47, action-bar.css** — nRoll=4 domino quad tray: `|` between pairs; 0px gap within each pair
- **domino-roll.js v1.4, turn.js v2.25, drag-drop.js v2.33, state.js v2.14** — nRoll=4 Domino Roll: unused pair returned to end of list on confirm (net −1 per roll); full reshuffle only when pair pool depleted
- **domino-roll.js v1.3, turn.js v2.24** — Domino Roll: empty combo list restarts from top (no WELL DONE); HUD counter resets to full cap
- **domino-roll.js v1.2** — nRoll=4 with 1 combo left: pair B is random draw from fresh shuffle (not first entry)
- **deck-size.js v1.1, domino-roll.js v1.1, turn.js v2.23** — Domino Roll: HUD deck counter tracks combo list (active even when deckSize=0); list capped by deckSize when >0; WELL DONE on exhaustion; nRoll=4 with 1 left offers last combo + first of fresh shuffle
- **settings.js v2.23, domino-roll.js v1.0, state.js v2.13, turn.js v2.22, dice.js v2.3, row.js v1.52, drag-drop.js v2.32, action-bar.js v1.46, action-bar.css** — `dominoRoll` toggle: nRoll 2/3/4 draw from depleting 21-pair / 56-triple pools; nRoll=4 dual-pair tray with pair lock on select (unlock on deselect)
- **hud-v2.css** — deck counter vertically aligned to score row (30px band, unchanged score layout)
- **settings.js v2.22, settings-panel.js, deck-size.js v1.0, state.js v2.12, turn.js v2.21, convert.js v1.9, convert-anim.js v1.4, hud-v2.js, hud-v2.css** — `deckSize` stepper (0 = off, default 52, max 108): top-left HUD counter; decrements on each stack→tile conversion; WELL DONE when counter hits 0 after confirm pipeline
- **action-bar.css v1.47** — roll/KO/back button labels: unitless line-height + 2px bottom padding for optical vertical lift
- **action-bar.css v1.46** — armed KO bar: fix die-face borders — back `&lt;` white, KO warning red (exclude armed wrap from global accent ring)
- **action-bar.js v1.45, action-bar.css** — armed KO bar: number slot shows white `&lt;` with white die border; KO stays red
- **end-game-prompt.js v1.1, action-bar.js v1.44** — auto-collapse KO bar when warning-red roll chrome clears (e.g. full stack on row); pending-roll arms unchanged
- **end-game-prompt.js v1.0, handlers.js v2.9, action-bar.js v1.43, action-bar.css, turn.js v2.20, game-over.js v2.3** — KO confirm bar: warning-red roll tap or post-roll game-over paths arm inline expand (number + red KO); KO confirms overlay; number tap again cancels; eligibility logic unchanged
- **viewport-controls.css v1.2** — full-screen button: no background/shadow/active fill; white icon only
- **row.js v1.51, placement-anim.js v1.26, placement-row.js, drag-drop.js v2.31** — fix snap ghost overlap when repositioning row dice: gap spread allowed during row drag; sole-die insert anchor remapped after source column vacates
- **drag-drop.js v2.30, placement-row.js, state.js v2.11** — hide row star markers adjacent to snapping ghost preview (stack + insert slots)
- **dice-visual.js v2.11, base.css** — star SVG: 3px outside border in `--bg`; `overflow: visible` so stroke is not clipped by viewBox
- **lifetime-stats-view.js v1.0, settings-panel.js v1.35, settings-panel.css, game-over.js v2.2, index.html** — lifetime stats block at top of settings panel; refreshes live as draft config changes; shared lifetime renderer extracted from game-over
- **base.css** — landscape and viewports ≥825px fill browser (`100vw × 100dvh`); design width grows from 412px with no cap; phone portrait unchanged (square `min(100vw, 100dvh)`)
- **turn.js v2.19, action-bar.md v1.42** — roll tap follows border colour: `isRollButtonWarningRedBorder` mirrors CSS (incl. full-stack accent override); accent → roll/confirm
- **turn.js v2.18** — `.roll-btn--low` tap → game over in any phase (was idle-only); fixes confirm/auto-roll when warning-red number shows in rolled phase
- **action-bar.js v1.41, turn.js v2.17** — restore pre-Flank warning-red roll chrome (`isRollPoolLow`, `isTrayStuck`); tap → game over via `isRollButtonEndGameTap` unchanged (incl. Deck Flank)
- **turn.js v2.16, handlers.js, action-bar.js, main.js** — fix double-tap on warning-red roll: defer render until after click; skip duplicate render on game over
- **turn.js v2.15, main.js, game-over.js v2.1, handlers.js, reroll-outer-anim.js v1.6** — fix Deck Flank game-over: `setGameOverHandler` wired at boot; async WELL DONE/stuck paths always show overlay; overlay reveals before stats; roll-wrap click target
- **turn.js v2.14, reroll-outer-anim.js v1.5** — remove `shouldBlockGameOver`; game-over overlay always loads in Deck Flank (same as Flank OFF); Flank only extends play via `canRoll`/pool top-up; export `triggerGameOver`
- **turn.js v2.13, action-bar.js v1.40** — warning-red roll button (low pool or tray stuck): one tap always opens game over, including Deck Flank pool-low state; shared `isRollButtonEndGameTap` / `isRollPoolLow`
- **turn.js v2.12, row.js v1.50, action-bar.md v1.39** — restore pre-Flank game-over rules; Deck Flank ON only suppresses pool-exhausted loss while stacks hold tiles (`shouldBlockGameOver`); tray/dealt stuck unchanged (flank tops as tile neighbors in row checks)
- **row.js v1.49** — fix Deck Flank placement: drop buried-flank duplicate gate (52-card deck made almost every stack completion illegal); flank tops still swept on convert match
- **deck-flank.js v2.3, row.js v1.48, convert-anim.js v1.3, sweep-anim.js v1.9, confirm-anim.js v1.6** — Deck Flank: on convert, matching flank stack top sweeps away (same anim as sweep), count decrements, next card revealed; placement duplicate gate blocks buried flank cards only (top resolved on convert)
- **deck-flank.js v2.2, row.js v1.47** — restore duplicate gates after Deck Flank: block third die when convert identity matches row tile, convert-ready stack, or any card in flank stacks (incl. jokers when `tricolorRestriction` OFF)
- **turn.js v2.11, row.js v1.46, action-bar.md v1.38** — Deck Flank ON: all loss game overs (incl. tray/dealt stuck) blocked while flank stacks hold cards; `isTrayStuck()` false when stacks remain (parity with pool/deck-depleted blocking)
- **turn.js v2.10, action-bar.js v1.37** — Deck Flank ON: tray stuck still shows warning-red roll border and tap → game over (`no legal placements` not blocked by flank stacks)
- **sweeps-row.js v1.15** — fix flank stack pop on sweep: resolve flank sides before deleting row tiles (right-flank virtual col invalid after player cols removed)
- **deck-flank.js v2.1, turn.js v2.9, action-bar.js v1.36, reroll-outer-anim.js v1.4** — Deck Flank: block loss game overs while flank stacks hold cards; top up dice pool on roll so session continues until both stacks empty → WELL DONE
- **sweep-anim.js v1.8, state.js v2.10, flank-stacks.js, deck-flank.css** — after flank stack tile swept: pop reveals next card, count decrements, new top enters with tile pop (fix premature re-render before pop)
- **placement-anim.js v1.24, placement-hover.js v1.12** — flank stacks stay fixed on row-edge inserts; player columns still gap-spread left/right of leftmost/rightmost die
- **placement-anim.js v1.23, placement-hover.js v1.11, placement-row.js, flank-stacks.js** — deck flank stacks join gap spread + snap anchoring at row edges (same preview/commit animation as dice columns)
- **deck-flank.js v2.0, flank-stacks.js, placement-row.js, deck-flank.css, render.js** — flank stacks as flex columns inside placement row (adjacent to dice), not absolute viewport positioning
- **settings.js v2.21, settings-panel.js v1.34, deck-flank.js v1.0, state.js v2.8, row.js v1.44, turn.js v2.7, confirm-anim.js v1.4, convert-anim.js, flank-anim.js, flank-preview.js, deck-flank.css, render.js, base.css** — `deckFlank` toggle: 52-card flank deck, corner preview ghosts, auto edge commit on confirm (after converts/sweeps), preview discard on convert match; mutually exclusive with Tile Dealt Every; flank tiles excluded from N-spots
- **game-log.js v1.2, game-over.js v2.0, game-over.css, index.html** — cumulative sweep tile/pattern counts per config; lifetime 13×4 matrix segmented toggle (converted / swept)
- **game-log.js v1.1, game-over.js** — lifetime stats keyed by settings configuration; bucket created on first game over per config
- **game-over.js v1.9** — lifetime tile matrix suit column order: Z, X, Y, W
- **game-over.js v1.8, game-over.css** — lifetime tile matrix transposed: 13 rank rows (A, 2–12, *) × 4 suit columns; drops unused `ac` glyph
- **game-over.js v1.7, game-over.css, index.html** — lifetime block moved to end of game-over sheet; 4×13 suit×rank tile formation matrix
- **game-log.js v1.0, dice.js, convert.js, turn.js, confirm-anim.js, sweep-anim.js, reroll-outer-anim.js, game-over.js, game-over.css, index.html** — per-game session log (`romino-v2-game-log`, cap 100) with dice frequency, tiles, bank events, settings snapshot; lifetime aggregates (`romino-v2-lifetime-stats`); lifetime stats block on game-over sheet
- **sweeps-row.js v1.13, sweep-anim.js v1.6** — tricolor flushes (joker-inclusive same-suit runs) always use ×1 star multiplier regardless of sweep length
- **settings.js v2.18, settings-panel.js, row.js v1.43** — `tricolorRestriction` toggle (default ON): OFF lifts one-joker-per-row, one-joker-per-suit, and duplicate joker-tile gates; duplicate 3-dice permutation gate unchanged
- **row.js v1.42** — duplicate 3-dice stack gate treats permutations as the same triple (sorted value key)
- **row.js v1.41** — block third die when another column already has the same three dice (bottom→top); extends `passesNoDuplicateTile` placement gate
- **main.js, index.html** — preload and await Numbers Deuce font at boot so first converted tile renders with correct typeface
- **sweep-anim.js v1.5, pip-anim.js v1.7** — sweep bank: score stays at pre-bank total until left-side calculation finishes, then updates on pip arrival (no early `render()` flash)
- **timing.js v1.6** — sweep bank calculation reveal ⅓ faster (520ms + 520ms + 587ms at `--t: 1`)
- **row.js v1.40, action-bar.js v1.35, action-bar.css** — roll button keeps accent border when any 3-dice stack is on the row (number may still be warning red)
- **action-bar.js v1.34, action-bar.css** — roll button face border matches warning-red number when active and remaining dice below N-roll
- **timing.js v1.5, pip-anim.js v1.6** — slower sweep bank reveal: dedicated holds for `stars×mult` and product before pip fly (780ms + 780ms + 880ms at `--t: 1`)
- **hud-v2.js, hud-v2.css** — score HUD: star icon pinned beside vertical bar at centre; star count / sweep equation grows left in col 1 without shifting bar, star, or points anchor
- **row.js v1.39** — tricolor joker placement: spent-suit full stacks no longer block; incidental 2-dice stacks no longer gate other columns (same-suit still blocked via `jokerSuitBlocked`)
- **sweeps-row.js v1.12, sweep-anim.js v1.4, pip-anim.js v1.5, hud-v2.css** — sweep star multiplier (×1 at 3 cards, +1 per extra card); bank once after all sweeps using max mult; HUD shows `stars×mult` → product in accent yellow before pip fly to score; multiplier bank only when a sweep actually ran (stars persist if confirm had no sweep)
- **row.js v1.38, turn.js v2.6, action-bar.js v1.33, action-bar.css, handlers.js, reroll-outer-anim.js v1.3** — tray stuck: roll button warning-red border + click opens game over (no auto game over on roll)
- **row.js v1.37** — restore one-joker-per-row gate alongside per-suit-per-game cap (`jokerSuitsUsed`); different suits allowed once row is clear
- **reroll-outer-anim.js v1.2, render.js, star-reroll-input.js** — fix multi-star reroll: set `phase: rolled` before `render()` so HUD keeps `is-star-draggable`
- **row.js v1.35, render.js v1.4, base.css** — separator fills warning red while row is at N-spots cap
- **star-reroll-input.js v1.0, hud-v2.js, hud-v2.css, drag-drop.js v2.28, reroll-outer-anim.js v1.1, action-bar.js v1.32, main.js** — `rerollOuter` pay flow: select tray 1/6, tap or drag from `#hud-star-pay` (not direct die tap)
- **turn.js v2.5** — `rerollOuter` ON: fresh game starts with `state.stars === nPlace`; `shouldWarnOnLeave` treats that as unmodified
- **settings.js v2.17, dice.js v2.1, pip-anim.js v1.4, reroll-outer-anim.js v1.0, drag-drop.js v2.27, action-bar.js v1.31, action-bar.css** — `rerollOuter` toggle: tap tray 1/6 to reroll for 1 star (HUD→die fly + `is-new` pop); inactive outers stay tappable
- **settings.js v2.16, convert.js v1.8, row.js v1.32** — `aceJokerStarCost` toggle (default ON): when OFF, ace/joker converts cost no stars; placement no longer blocked by star balance
- **settings.js v2.15, stars.js v1.4, placement-row.js** — `verticalStars` toggle: stack-adjacent same-value pairs (or consecutive when `consecutiveStars` ON) earn stars; live ⭐ markers and collect pip support vertical matches

### Removed
- **settings.js v2.10, settings-panel.js v1.27, row.js v1.17, state.js v2.3, turn.js v2.1** — `adjacentColumnsOnly` toggle and placement-order tracking removed; bar placements no longer restricted to adjacent columns

### Changed
- **row.js v1.34, placement-row.js** — stack dice return/reposition only from the topmost die (LIFO; respects `stackBottomUp`)
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
- **sweeps-row.js v1.11, sweep-anim.js v1.3** — re-scan for sweep runs after each apply so chain sweeps (e.g. joker flush split by a middle tile swept first) are not missed
- **row.js v1.33** — tricolor placement: dead 2-dice stacks (all joker suits already spent) no longer block completing a tricolor on another column; Tricolor Sevens + Tricolors paths unchanged
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
