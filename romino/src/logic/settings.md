---
module: settings
layer: logic
v: 2.0
date: 2026-06-12
deps: []
---
# Settings — User Story

As a player, I want to toggle game rules on/off (grid size, sweep types, forbidden slots, scoring options) so I can customise difficulty and strategy. As an AI/engine, I need a single `settings` object that all modules read for feature-flag checks.

## Exports
- `SETTINGS_CONFIG` — grouped config array; source of truth for labels, keys, defaults
- `settings` — live flat object `{ extendedGrid, fastAnimations, … }` initialised from defaults
- `spd(ms)` — scales a millisecond value by 0.5 when `fastAnimations` is on

## Groups
- **Card Deck** — diceDecks, extendedCardDeck, deckDice, vSuitDominoFill, tricolor
- **Grid** — extendedGrid, square, emptyCards, fastAnimations, autoplayLongPress, autoplayFirstTwo
- **Dice Deck** — blankDie, blanksInRank, filterExtremes, sortDice
- **Grid** — extendedGrid, square, uniqueIndex, colorRestriction, emptyCards, fastAnimations, autoplayLongPress, autoplayFirstTwo
- **Constraints** — forbiddenSlots, paidSlots, refundOnMove, swapDice
- **Scoring** — scoreSuitRepeat, scoreSuitExtreme, scoreRankSum7
- **Sweeps** — set, runFlush, runDiff, runAny, wildTarok, flush, tarokFlush, domino

## Notes
- `vSuitDominoFill` (default `true`) — when `true`, converted 2-slot V cards show the domino layout (rank + blank, bottom dice visible); when `false`, they show a compact filled index (centered rank + literal **V**, gold color, no dice) matching the converted 3-slot non-V style. Same toggle applies to 1-slot V cards: domino (`*` + blank, center die visible) when on; compact (`*` + **V**, no die) when off.
- `tricolor` (default `true`) — when `true`, a filled 3-slot card whose dice match one of four 3-color combos (2-3-4, 2-3-5, 2-4-5, 3-4-5) **and whose rank dice sum to 7** converts with a blank rank and only sweeps as Set or Flush.
- `square` (default `false`) — square 110×110 card layout with progressive rank/suit display; mutually exclusive with `diceDecks`; toggling resets the game.
- `uniqueIndex` (default `true`) — when ON, forbids any placement whose resulting placed-dice multiset (sorted values of all active slots so far) matches another grid card; rank and index are irrelevant; works even when `forbiddenSlots` is off.
- `colorRestriction` (default `false`) — when ON together with `square`, treats die values 1 and 6 as equivalent in the unique-index dice comparison (both mapped to 1), so `[1,3]` and `[6,3]` are considered the same multiset.
[[state]] · [[settings-panel]] · [[sweeps]] · [[scoring]]
