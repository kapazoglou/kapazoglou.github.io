---
module: cards
layer: logic
v: 1.36
date: 2026-06-13
deps: [state, settings]
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
- `dieInCard(dieId)` — returns `"cardId-slotIdx"` if die is placed in any card
- `isSlotForbidden(cardId, si, dieId)` — pure constraint check (no DOM); in SQUARE mode, slot 1 and corners 0/2 cannot swap within the same card; corner 0↔2 moves bypass fill-order slot rules
- `squareFilledCount` / `squareSuitSlot` / `squareAlignment` / `squareDisplayIndex` / `squareIndexColor` / `updateSquareLayout` / `squarePartialConverted` / `squareDieLocked` — SQUARE mode helpers (settings.square); `squareSuitSlot` returns 0, 1, or 2 (suit may land in middle slot); tricolor cards use center layout; single die index is plain suit; tricolor index is `V` or `*` + suit (Z/X/Y/W); `squareAlignment` / `updateSquareLayout`: slots 0+1 → `horizontal`, slots 1+2 → `vertical`, 3 dice from suit slot, else `center`; `squareDieLocked` blocks slot-1 selection when all three dice are filled; blocks corner selection when slot 1 and exactly one corner are filled
- `wouldCreateDuplicate(cardId, si, dieId)` — detects grid rank/suit conflicts; when `settings.uniqueIndex` ON, forbids any placement whose placed-dice multiset matches another grid card (any slot count, partial or complete)
- `isDieSelectable(dieId)` — false when no legal move (placement or tray return) avoids a duplicate; move simulation clears the die's source slot
- `diePipRotationDeg(slotIdx, value, cardId)` — clockwise pip rotation: 90° everywhere; 180° for value 6 in slot 0; slot 1 + value 6 → 180° when slot 0 filled, or when corners 0+2 filled only if slot 1 forms rank with slot 0 (square suit@2)
- `dieSVG(value, size, pipRotationDeg)` — returns SVG string for a single die face (pips rotated, face upright)
- `ndTranscribe(str)` — converts digit chars to Numbers Deuce font glyph letters
- Constants: `SUIT_LETTER`, `SUIT_COLOR`, `DISCARD_RANKS`, `PIP_COLOR`, `DIE_PIP_COLOR`

## Related
[[state]] · [[settings]] · [[dice]] · [[grid]] · [[sweeps]]
