---
module: suit-tally
layer: logic
v: 1.5
date: 2026-08-14
deps: [state, settings, dice-visual, game-log]
---
# Suit tally

Per-suit swept/converted counts in `state.suitTally` (Z X Y W). When `sweptSuits` ON: game ends after confirm when any suit exceeds 12; suit-cap game over applies end bonus `(sweptLowSuitBonus × lowest suit tally) + (1 × unique rank+suit combos, max 52) − (sweptDuplicatePenalty × extra copies per suit:rank)` to `state.points`.

- `tallySuit(suit)` — increment one suit
- `tallySwitcherConvert(values)` — Switcher Jokers: suit tally + `convertSweepTiles` (joker rank, missing suit)
- `suitTallyGameOverReason()` — `'suit tally complete'` or null
- `applySweptSuitsEndBonus()` — lowest-suit tally bonus + unique combo bonus − duplicate penalty at game over
- `countUniqueSessionSweepCombos()` — distinct swept suit:rank keys this session (cap 52)
- `countDuplicateSessionSweepExtras()` — sum of (count − 1) per suit:rank with duplicates
- `SWEPT_SUIT_UNIQUE_COMBO_BONUS_PER` — end bonus per unique rank+suit combo (1)
- `SWEPT_SUIT_UNIQUE_COMBO_CAP` — max combos counted (52)
- `buildSessionSweepTiles()` — flat list of all session swept tiles
- `buildSessionSweepTileCounts()` — suit:rank counts from `buildSessionSweepTiles()`
- `SWEEP_DISCOVERY_RANKS` — 13 rank rows for discovery matrix
