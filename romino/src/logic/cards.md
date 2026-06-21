---
module: cards
layer: logic
v: 1.62
date: 2026-06-21
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
- `dieInCard(dieId)` — returns `"cardId-slotIdx"` if die is placed in any card
- `isSlotForbidden(cardId, si, dieId)` — pure constraint check (no DOM); always blocks completing a card whose dice are only 1s and/or 6s (111, 116, 661, 666, …; 1-slot suit cards exempt); first die on an empty card may use any active slot; 4-square requires orthogonal edge adjacency from the 2nd die onward (no diagonals); when `placementRestrictions` ON: classic 3-slot fill order, slot 1↔corner swap guards, CW/CCW third slot, monotonic values, middle 1/6 ban, blank-die rules from 2nd die onward; when OFF: all-extremes block, 4-square edge adjacency from 2nd die, plus independent toggles (`uniqueIndex`, `coolOff`, duplicate checks)
- `isCardPlayableFull(cardId)` — true when all active slots hold dice (3 of 4 for `fourSquare`, else every slot)
- `squareFilledCount` / `squareSuitSlot` / `squareRankSlots` / `squareDieLocked` / … — SQUARE mode helpers; `fourSquare`: orthogonal edge adjacency always; CW/CCW third slot when `placementRestrictions` ON; at 3 dice only current-roll dice edge-adjacent to `squareIndexSlot` may return to tray
- `wouldCreateDuplicate(cardId, si, dieId)` — detects grid rank/suit conflicts; when `settings.uniqueIndex` ON, forbids any placement whose placed-dice multiset matches another grid card; skipped for 1–2 dice cards when `partialUniqueIndex` is off
- `squareIndexSlot(cardId)` — 4-square index tile slot; returns null at 1 die when `partialUniqueIndex` is off
- `isDieSelectable(dieId)` — false when no legal move (placement or tray return) avoids a duplicate; move simulation clears the die's source slot
- `diePipRotationDeg(slotIdx, value, cardId)` — clockwise pip rotation: 90° everywhere; 180° for value 6 in slot 0; slot 1 + value 6 → 180° when slot 0 filled, or when corners 0+2 filled only if slot 1 forms rank with slot 0 (square suit@2)
- `dieSVG(value, size, pipRotationDeg)` — returns SVG string for a single die face (pips rotated, face upright)
- `ndTranscribe(str)` — converts digit chars to Numbers Deuce font glyph letters
- Constants: `SUIT_LETTER`, `SUIT_COLOR`, `DISCARD_RANKS`, `PIP_COLOR`, `DIE_PIP_COLOR`

## Related
[[state]] · [[settings]] · [[dice]] · [[grid]] · [[sweeps]]
