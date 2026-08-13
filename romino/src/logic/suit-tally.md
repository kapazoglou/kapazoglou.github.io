---
module: suit-tally
layer: logic
v: 1.0
date: 2026-08-13
deps: [state, settings, dice-visual]
---
# Suit tally

Per-suit swept/converted counts in `state.suitTally` (Z X Y W). When `sweptSuits` ON: game ends after confirm when any suit exceeds 12; suit-cap game over applies end bonus `10 × lowest suit tally` to `state.points`.

- `tallySuit(suit)` — increment one suit
- `suitTallyGameOverReason()` — `'suit tally complete'` or null
- `applySweptSuitsEndBonus()` — lowest-count bonus at game over
