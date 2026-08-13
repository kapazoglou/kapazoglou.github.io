---
module: suit-tally
layer: logic
v: 1.3
date: 2026-08-13
deps: [state, settings, dice-visual, game-log]
---
# Suit tally

Per-suit swept/converted counts in `state.suitTally` (Z X Y W). When `sweptSuits` ON: game ends after confirm when any suit exceeds 12; suit-cap game over applies end bonus `2 × lowest suit tally` to `state.points`.

- `tallySuit(suit)` — increment one suit
- `tallySwitcherConvert(values)` — Switcher Jokers: suit tally + `convertSweepTiles` (joker rank, missing suit)
- `suitTallyGameOverReason()` — `'suit tally complete'` or null
- `applySweptSuitsEndBonus()` — `SWEPT_SUIT_END_BONUS_PER` (2) × lowest-count bonus at game over
- `SWEPT_SUIT_END_BONUS_PER` — end bonus multiplier (2)
- `buildSessionSweepTiles()` — flat list of all session swept tiles
- `buildSessionSweepTileCounts()` — suit:rank counts from `buildSessionSweepTiles()`
- `SWEEP_DISCOVERY_RANKS` — 13 rank rows for discovery matrix
