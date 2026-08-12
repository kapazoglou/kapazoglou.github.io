---
module: starting-dice
layer: logic
v: 1.3
date: 2026-08-12
deps: [state, settings, dice]
---
# Starting Dice

`seedStartingDice()` — on `resetGame`, places `settings.startingDice` dice via pair rolls: any outer (1/6) on first throw → reroll outers until inner, one stacked column; both inner → two single-die columns (no stack). Odd remainder is one rerolled-inner singleton. Contiguous columns centered on col 0; max 2 per column. Bypasses placement rules; committed board state. Debits `dicePool` by seeded count.
