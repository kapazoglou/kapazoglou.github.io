---
module: settings
layer: logic
v: 2.13
date: 2026-06-21
deps: []
---
# Settings — User Story

As a player, I want to toggle game rules on/off (grid size, sweep types, forbidden slots, scoring options) so I can customise difficulty and strategy. As an AI/engine, I need a single `settings` object that all modules read for feature-flag checks.

## Exports
- `SETTINGS_CONFIG` — grouped config array; source of truth for labels, keys, defaults
- `settings` — live flat object `{ extendedGrid, fastAnimations, … }` initialised from defaults
- `spd(ms)` — scales a millisecond value by 0.5 when `fastAnimations` is on
- `getInitialStartCardCount()` — opening deal size (1, or 2/3 with `extraStartCards`)

## Groups
- **Card Deck** — diceDecks, extendedCardDeck, deckDice, vSuitDominoFill, tricolor
- **Grid** — extendedGrid, square, fourSquare, uniqueIndex, colorRestriction, emptyCards, fastAnimations, autoplayLongPress, autoplayFirstTwo, peekUnconvertedLayout
- **Dice Deck** — blankDie, blanksInRank, filterExtremes, sortDice
- **Constraints** — forbiddenSlots, paidSlots, refundOnMove, coinFlipDice, swapDice
- **Scoring** — scoring, gridCoinsExcludeConverted, scoreSuitRepeat, scoreSuitExtreme, scoreRankSum7
- **Sweeps** — set, runFlush, runDiff, runAny, wildTarok, flush, tarokFlush, domino

- `gridCoinsExcludeConverted` (default `true`) — when ON with SQUARE + Scoring, filled (converted) cards do not participate in grid coin matches.
- `gridCoinsSum7` (default `false`) — when ON with SQUARE + Scoring, grid coins spawn when adjacent opposite dice differ; when OFF, dice must match (equal number). Pairs involving 1 or 6 never qualify.

## Notes
- `vSuitDominoFill` (default `true`) — when `true`, converted 2-slot V cards show the domino layout (rank + blank, bottom dice visible); when `false`, they show a compact filled index (centered rank + literal **V**, gold color, no dice) matching the converted 3-slot non-V style. Same toggle applies to 1-slot V cards: domino (`*` + blank, center die visible) when on; compact (`*` + **V**, no die) when off.
- `tricolor` (default `true`) — when `true`, a filled 3-slot card whose dice match one of four 3-color combos (2-3-4, 2-3-5, 2-4-5, 3-4-5) **and whose rank dice sum to 7** converts with a blank rank and only sweeps as Set or Flush.
- `square` (default `false`) — square 110×110 card layout with progressive rank/suit display; mutually exclusive with `diceDecks`; toggling resets the game.
- `fourSquare` (default `false`) — requires `square`; cards spawn with 4 slots in a 2×2 grid (slot 3 = bottom-left); only 3 dice may be placed (any-start CW/CCW); converts like standard 3-dice square cards.
- `placementRestrictions` (default `true`) — when ON, enforces fill order, monotonic values, middle-slot 1/6 ban, and blank-die rank rules (4-square CW/CCW third slot). When OFF, 4-square still requires orthogonal edge adjacency (no diagonals); only the all-1s/6s completion block remains from other placement rules (plus independent toggles: `uniqueIndex`, `coolOff`, duplicate checks).
- `uniqueIndex` (default `true`) — when ON, forbids any placement whose resulting placed-dice multiset (sorted values of all active slots so far) matches another grid card; rank and index are irrelevant; works even when `forbiddenSlots` is off.
- `partialUniqueIndex` (default `true`) — when ON with `uniqueIndex`, applies the duplicate-dice rule to cards with 1 or 2 dice placed; in 4-square, shows the suit index tile on the forbidden slot when only 1 die is placed. When OFF, 1–2 dice cards may share dice multisets with other grid cards, and 4-square 1-die cards show a hard-forbidden slot instead of the suit index tile.
- `colorRestriction` (default `false`) — when ON together with `square`, treats die values 1 and 6 as equivalent in the unique-index dice comparison (both mapped to 1), so `[1,3]` and `[6,3]` are considered the same multiset.
- `coinFlipDice` (default `false`) — when ON with Scoring, drag the HUD coin onto a tray die during place-dice to flip it to the opposite face (1↔6, 2↔5, 3↔4) for 1 coin; blanks cannot flip.
- `peekUnconvertedLayout` (default `false`) — when ON, tapping a converted card on the grid instantly toggles between converted and pre-conversion layout (no animation).
[[state]] · [[settings-panel]] · [[sweeps]] · [[scoring]]
