---
module: sweeps
layer: logic
v: 1.9
date: 2026-07-10
deps: [state, settings, cards]
---
# Sweeps — User Story

As a player, I want filled cards in a line to trigger a scoring sweep when they form a Set, Run, Flush, Domino, or other enabled pattern. The swept cards are removed and the next phase begins.

## Exports
- `getGridSize()` / `getGridTotal()` / `getGridLines()` — grid geometry helpers
- `lineExitKey(line)` — returns `'h'|'v'|'d1'|'d2'` for CSS sweep direction
- `cardIsGridRepositionable(cardId)` — true if card has no dice yet
- `SCORING_RULES.set` — wildcards: `rank '*'`, tarok `V`, `isSuitOnlyJokerTile` (suit-dedup skipped); 1+6 aces never wild
- `isConsecutiveRanks(cardIds)` — consecutive-rank test with wildcard support (`rank '*'`, `isSuitOnlyJokerTile`); 1+6 aces are fixed rank `A`
- `effectiveSuitsFlush(cardIds)` / `effectiveSuitsDiff(cardIds)` — wildTarok suit resolution
- `findAllMatchesOnLine(lineSlots)` — all rules matching a slot segment; null grid slot in segment = incomplete (no match); blocker cards skipped; all other slots must be `filled`
- `findScoringMatchOnLine(lineSlots)` — first match only (for quick peek)
- `getThreeSweepSegments()` — deduped 3-slot candidates on 4×4 when `sweepThreeInRow` is on (subsegments + offset diagonals)
- `collectScoringMatches()` — ordered matches: full grid lines first, then 3-segments not subsumed by a full-line match
- `peekAnyScoringMatch()` — true when `collectScoringMatches()` is non-empty

## Related
[[state]] · [[settings]] · [[cards]] · [[sweep-anim]] · [[phase]]
