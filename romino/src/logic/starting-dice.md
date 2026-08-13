---
module: starting-dice
layer: logic
v: 1.4
date: 2026-08-13
deps: [state, settings, dice]
---
# Starting Dice

`seedStartingDice()` — on `resetGame`, places `settings.startingDice` dice on the row: every pair → one 2-high stack (outers rerolled until inner); odd remainder → one single-die column inserted at a random position in column order. Contiguous columns centered on col 0. Bypasses placement rules; committed board state. Debits `dicePool` by seeded count.
