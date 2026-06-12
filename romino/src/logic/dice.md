---
module: dice
layer: logic
v: 1.2
date: 2026-06-12
deps: [state, settings, cards]
---
# Dice — User Story

As a player, I need dice drawn from a shuffled deck of unique combinations (or random when `deckDice` is off) so that I see variety without repeats until the deck runs out. Decks respect `blankDie` and `filterExtremes`; random mode uses independent rolls (1-die uses the same 2–5 + extreme pool as the 1-die deck).

## Exports
- `spawnDice(count)` — draws `count/3` combinations, pushes dice to state, returns ids
- `getDeckSize()` — total unique 3-die combos under current settings
- `getCardDeckSize()` — total cards in the slot-count deck (15 or 78)
- `getAllDiceCombos()` — returns full unshuffled combo list
- `drawDiceCombination()` / `peekNextDiceCombination()` — deck draw / non-consuming peek
- `shuffleArray(arr)` — Fisher-Yates in-place shuffle
- `nextComboForDisplay()` — next preview combo sorted by display rules
- `sortDiceValuesForDisplay(values)` — display-order sort (blanks left, 1s/6s right)
- `sortDiceIdsForDisplay(ids)` — same but for die ID arrays
- `orderDiceIdsByValues(ids, valueOrder)` — align tray order to a saved preview sequence
- `selectLeftmostTrayDie()` — sets `state.selectedDieId` to the first unplaced tray die

## Related
[[state]] · [[settings]] · [[cards]] · [[action-bar]] · [[phase]]
