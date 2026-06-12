---
module: sweeps
layer: logic
v: 1.3
date: 2026-06-10
deps: [state, settings, cards]
---
# Sweeps — User Story

As a player, I want filled cards in a line to trigger a scoring sweep when they form a Set, Run, Flush, Domino, or other enabled pattern. The swept cards are removed and the next phase begins.

## Exports
- `getGridSize()` / `getGridTotal()` / `getGridLines()` — grid geometry helpers
- `lineExitKey(line)` — returns `'h'|'v'|'d1'|'d2'` for CSS sweep direction
- `cardIsGridRepositionable(cardId)` — true if card has no dice yet
- `SWEEP_RULE_ORDER` / `SCORING_RULE_LABELS` / `SCORING_RULES` — rule registry
- `isConsecutiveRanks(cardIds)` — consecutive-rank test with wildcard support; returns false when any card is Tricolor
- `effectiveSuitsFlush(cardIds)` / `effectiveSuitsDiff(cardIds)` — wildTarok suit resolution
- `findAllMatchesOnLine(lineSlots)` — all rules matching a fully-filled line; null grid slot = incomplete (no match); blocker cards skipped; all other slots must be `filled`
- `findScoringMatchOnLine(lineSlots)` — first match only (for quick peek)
- `peekAnyScoringMatch()` — true if any line on the grid currently matches

## Related
[[state]] · [[settings]] · [[cards]] · [[sweep-anim]] · [[phase]]
