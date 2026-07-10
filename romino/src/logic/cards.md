---
module: cards
layer: logic
v: 1.92
date: 2026-07-10
deps: [state, settings, cool-off]
---
# Cards — User Story

As a player, I need cards to be spawned with empty die slots and to display their rank/suit once all three slots are filled. As the engine, I need helpers to read card identity (rank, suit, colour) and to detect illegal placements (forbidden slots, duplicate cards on grid).

## Exports
- `spawnCard()` — appends a new empty card to `state.cards`, returns its id
- `cardRank(id)` / `cardSuit(id)` / `cardColor(id)` — computed identity from dice values
- `isTricolorCard(id)` / `tricolorSevenKey(id)` / `tricolorComboKey(id)` / `TRICOLOR_COMBOS` — Tricolor detection (3-color combo; portrait also requires rank sum 7; square requires combo only); square tricolor suit = missing pip from {2,3,4,5} (234→W, 235→Y, 245→X, 345→Z)
- `cardIdentityKey(id)` — reads `card.discoveryKey` snapshot when set
- `snapshotCardIdentity(id)` — identity at fill time; 2-slot/V/3-slot domino: `prefix:suit:pipPair`
- `compareDiscoveredCards(aId, bId)` — sort comparator for game-over grid (rank 2→12, A, *; suit Z→X→Y→W→V→2-slot; pip pair tie-break)
- `buildGameOverFourSquareGrid(cardIds)` — 4×13 grid (rows Z/X/Y/W, cols suit-only/2–12/A) for `fourSquare` game-over layout
- `buildFillDiscoveryGrid(cardIds)` — 4×13 grid; rank columns A…V stack bottom-up in conversion order (`fillDiscovery`)
- `isFillDiscoveryEnd(cardIds)` — true when bottom row is full or ≥2 rank columns hold four cards
- `FILL_DISCOVERY_RANK_HEADERS` — rank header labels for fill-discovery grid
- `dieInCard(dieId)` — returns `"cardId-slotIdx"` if die is placed in any card
- `countAvailableDiceSlots()` — grid total of slots placeable by adjacency/capacity (max 3 dice per card; ignores forbidden value rules)
- `isSlotForbidden(cardId, si, dieId)` — pure constraint check (no DOM); always blocks completing a card whose dice are only 1s and/or 6s (111, 116, 661, 666, …; 1-slot suit cards exempt); **blocks completing a joker whose identity key is already in Discovery** (`discoveredKeys`: `3:A:V`, `3:Z:`, `3:X:`, `3:Y:`, `3:W:`); first die on an empty card may use any active slot; 4-square requires orthogonal edge adjacency from the 2nd die onward (no diagonals); when `placementRestrictions` ON: classic 3-slot fill order, slot 1↔corner swap guards, CW/CCW third slot, monotonic values, middle 1/6 ban, blank-die rules from 2nd die onward; when `progressiveDicePlacement` ON: fill-order value gates + progressive suit/rank resolve; **`partialUniqueIndex` fully inert**; `uniqueIndex` dedup at 3 dice only (same single die or pair allowed on two tiles at 1–2 dice); when OFF: all-extremes block, 4-square edge adjacency from 2nd die, plus independent toggles (`uniqueIndex`, `coolOff`, duplicate checks)
- `isProgressiveSuitOnlyJoker(cardId)` — true when `progressiveSuitJoker` ON and off-color non-1/6 third completes as suit-only V joker (rank `''`, suit = missing pip from {2,3,4,5} among all three dice — same as tricolor)
- `isCardPlayableFull(cardId)` — true when all active slots hold dice (3 of 4 for `fourSquare`, else every slot)
- `squareFilledCount` / `squareSuitSlot` / `squareRankSlots` / `squareFourSquareBarOrientation` / `squareDieLocked` / … — SQUARE mode helpers; `fourSquare`: rank pair is always an edge-adjacent domino (diagonal `[0,2]` never rank); invalid 3-dice layouts forbidden in `isSlotForbidden`; `oneToOne` OFF disables tricolor and forbids duplicate rank+suit on grid at completion; `forbidThirdExtreme` rejects third die 1/6 (no rank switch); progressive ON: domino frame on last two placed dice at 2–3 dice, except when die1 is 1/6 (frame on first two); progressive ON: `squareDieLocked` LIFO — only the last placed die on a card may be picked up
- `wouldCreateDuplicate(cardId, si, dieId)` — detects grid rank/suit conflicts; when `settings.uniqueIndex` ON, forbids any placement whose placed-dice multiset matches another grid card; skipped for 1–2 dice cards when `partialUniqueIndex` is off
- `squareIndexSlot(cardId)` — 4-square index tile slot; returns null at 1 die when `partialUniqueIndex` is off; progressive ON at 1–2 dice with die1 1/6: null; progressive ON at 2 dice otherwise: empty slot diagonal from last placed die (suit index stays)
- `isDieSelectable(dieId)` — false when no legal move (placement or tray return) avoids a duplicate; move simulation clears the die's source slot
- `diePipRotationDeg(slotIdx, value, cardId)` — clockwise pip rotation: 90° everywhere; value 6 in square domino rank slots → 0° (hor bar) or 90° (ver bar) so pip rows align with frame long side; legacy slot-0/1 rules when outside domino rank pair
- `dieSVG(value, size, pipRotationDeg)` — returns SVG string for a single die face (pips rotated, face upright)
- `ndTranscribe(str)` — converts digit chars to Numbers Deuce font glyph letters
- Constants: `SUIT_LETTER`, `SUIT_COLOR`, `DISCARD_RANKS`, `PIP_COLOR`, `DIE_PIP_COLOR`

## Related
[[state]] · [[settings]] · [[dice]] · [[grid]] · [[sweeps]]
