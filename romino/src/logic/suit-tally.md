---
module: suit-tally
layer: logic
v: 1.4
date: 2026-08-13
deps: [state, settings, dice-visual, game-log]
---
# Suit tally

Per-suit swept/converted counts in `state.suitTally` (Z X Y W). When `sweptSuits` ON: game ends after confirm when any suit exceeds 12; suit-cap game over applies end bonus `(2 × lowest suit tally) + (1 × unique rank+suit combos, max 52)` to `state.points`.

- `tallySuit(suit)` — increment one suit
- `tallySwitcherConvert(values)` — Switcher Jokers: suit tally + `convertSweepTiles` (joker rank, missing suit)
- `suitTallyGameOverReason()` — `'suit tally complete'` or null
- `applySweptSuitsEndBonus()` — lowest-suit tally bonus + unique combo bonus at game over
- `countUniqueSessionSweepCombos()` — distinct swept suit:rank keys this session (cap 52)
- `SWEPT_SUIT_END_BONUS_PER` — end bonus multiplier per lowest suit tally (2)
- `SWEPT_SUIT_UNIQUE_COMBO_BONUS_PER` — end bonus per unique rank+suit combo (1)
- `SWEPT_SUIT_UNIQUE_COMBO_CAP` — max combos counted (52)
- `buildSessionSweepTiles()` — flat list of all session swept tiles
- `buildSessionSweepTileCounts()` — suit:rank counts from `buildSessionSweepTiles()`
- `SWEEP_DISCOVERY_RANKS` — 13 rank rows for discovery matrix
