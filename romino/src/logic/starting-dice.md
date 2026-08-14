---
module: starting-dice
layer: logic
v: 1.5
date: 2026-08-14
deps: [state, settings, dice, star-powers]
---
# Starting Dice

`seedStartingDice()` — on `resetGame`, places `settings.startingDice` dice on the row: every pair → one 2-high stack (outers rerolled until inner); odd remainder → one single-die column inserted at a random position in column order (`buggerSingles` ON: odd singleton is random 1 or 6 + `markBuggerPendingCol`). Contiguous columns centered on col 0. Bypasses placement rules; committed board state. Debits `dicePool` by seeded count.
