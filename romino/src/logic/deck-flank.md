---
module: deck-flank
layer: logic
v: 2.3
date: 2026-07-28
deps: [state, settings, tile-deck, row, dice-visual]
---
# Deck Flank

52-card deck split into two virtual 26-card stacks when `deckFlank` ON. Mutually exclusive with `tileDealtEvery`.

- `initFlankStacks()` — shuffle 52, split 26/26, reveal top on each side
- `flankStackCount(side)` / `flankStackTop(side)` — visible top + remaining count
- `flankTopMatchesIdentity(suit, rank)` / `flankBuriedMatchesIdentity(suit, rank)` — identity lookup (not placement gates; buried cards stay in deck)
- `findFlankSidesWithTopMatch(suit, rank)` — sides whose top matches a converted tile
- `flankMatchesIdentity(suit, rank)` — top or buried (full stack)
- `flankEndgamePending()` — ON and either stack still holds cards (`canRoll` top-up only; does not block game-over overlay)
- `getFlankSweepCol(side)` — virtual col for sweep adjacency (player min−1 / max+1)
- `popFlankStack(side)` — after sweep: discard top, reveal next from `remaining`, returns `'well-done'` when both stacks empty
- `sweepTileEntriesWithFlanks()` — row tiles + flank tops for sweep detection

Row-edge UI in `flank-stacks.js`. Stacks do not occupy N-spots or `state.row`.
