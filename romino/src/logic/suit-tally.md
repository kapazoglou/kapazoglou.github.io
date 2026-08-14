---
module: suit-tally
layer: logic
v: 1.13
date: 2026-08-14
deps: [state, settings, dice-visual, game-log]
---
# Suit tally

Per-suit swept/converted counts in `state.suitTally` (Z X Y W). When `sweptSuits` ON: game ends after confirm when all 52 unique rank+suit combos are swept (WINNER) or with zero duplicates (FLAWLESS); otherwise when any suit exceeds 13; **every** game over applies end bonus `(sweptLowSuitBonus × lowest suit tally) + (1 × unique rank+suit combos, max 52) − (sweptDuplicatePenalty × extra copies per suit:rank)` to `state.points`.

- `tallySuit(suit)` — increment one suit
- `tallySwitcherConvert(values)` — Switcher Jokers: suit tally + `convertSweepTiles` (joker rank, missing suit)
- `discoveryWinGameOverReason()` — `'flawless'` | `'winner'` | null (before suit-cap check)
- `discoveryWinMultiplierBonus(reason)` — +2 flawless, +1 winner, added to full-sweep multiplier at game over
- `isDiscoveryGridComplete()` / `isDiscoveryFlawless()` — 52 unique combos; flawless = no duplicate suit:rank copies
- `suitTallyGameOverReason()` — `'suit tally complete'` or null
- `applySweptSuitsEndBonus()` — apply breakdown to `state.points`; returns breakdown object
- `computeSweptSuitsEndBonus()` — breakdown without mutating state
- `countUniqueSessionSweepCombos()` — distinct swept suit:rank keys this session (cap 52)
- `countDuplicateSessionSweepExtras()` — sum of (count − 1) per suit:rank with duplicates
- `SWEPT_SUIT_UNIQUE_COMBO_BONUS_PER` — end bonus per unique rank+suit combo (1)
- `SWEPT_SUIT_UNIQUE_COMBO_CAP` — max combos counted (52)
- `buildSessionSweepTiles()` — flat list of all session swept tiles
- `buildSessionSweepTileCounts()` — suit:rank counts from `buildSessionSweepTiles()`
- `sessionSweepPriorCount(suit, rank)` — prior session count for suit:rank
- `sessionSweepDuplicateNumber(suit, rank)` — duplicate index if swept next (1 = −1 label, 2 = −2, …; 0 = first copy)
- `stackConvertSweepDuplicateNumber(values)` — same for 3-dice convert stack
- `SWEEP_DISCOVERY_RANKS` — 13 rank rows for discovery matrix
