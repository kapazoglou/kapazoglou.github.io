---
module: dice
layer: logic
v: 1.9
date: 2026-07-10
deps: [state, settings, cards]
---
# Dice — User Story

As a player, I need dice drawn from a shuffled deck of unique combinations (or random when `deckDice` is off) so that I see variety without repeats until the deck runs out. Decks respect `blankDie` and `filterExtremes`; random mode uses independent rolls via `crypto.getRandomValues` (1-die uses the same 2–5 + extreme pool as the 1-die deck).

## Exports
- `spawnDice(count, valueOrder?)` — pushes dice to state, returns ids; optional `valueOrder` spawns exact values (random mode preview sync)
- `getDeckSize()` — total unique 3-die combos under current settings
- `getCardDeckSize()` — total cards in the slot-count deck (15 or 78)
- `getAllDiceCombos()` — returns full unshuffled combo list
- `drawDiceCombination()` / `peekNextDiceCombination()` — deck draw / non-consuming peek
- `shuffleArray(arr)` — Fisher-Yates in-place shuffle
- `nextComboForDisplay()` — next preview combo sorted by display rules
- `sortDiceValuesForDisplay(values)` — display-order sort (blanks left, 1s/6s right)
- `sortProgressiveDiceValuesForDisplay(values)` — progressive placement tray/preview order (duplicates first; others lead toward 1/6 at end)
- `sortDiceIdsForDisplay(ids)` — same but for die ID arrays
- `orderDiceIdsByValues(ids, valueOrder)` — align tray order to a saved preview sequence
- `prependReturnedDieToTrayOrder(dieId)` — prepends a returned die before dice already in the tray
- `selectLeftmostTrayDie()` — sets `state.selectedDieId` to the first unplaced tray die
- `oppositeDieValue(value)` — 1↔6, 2↔5, 3↔4; null for blank (0)
- `flipDieValue(dieId)` — mutates die to opposite face; false when not flippable

## Related
[[state]] · [[settings]] · [[cards]] · [[action-bar]] · [[phase]]
