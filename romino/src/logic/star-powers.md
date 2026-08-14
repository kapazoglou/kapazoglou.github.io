---
module: star-powers
layer: logic
v: 1.5
date: 2026-08-14
deps: [state, settings, dice]
note: never import row.js — row imports this module
---
# Star Powers

Pure rules for `starPowers` / `buggerSingles` toggles. No DOM.

## Exports
- `starPowersEnabled()`, `buggerSinglesEnabled()`, `canSpendStarPower()`
- `oppositeDieValue(v)` — 1↔6, 2↔5, 3↔4
- `canStarFlipTrayDie(dieId)` — tray 2–5 only
- `passesPushBelowMatch(top, bottom, push)` — tray 2–5 only; blocks uniform stacks (top === bottom); top 6 → push ≤ bottom; top 1 → push ≥ bottom; else exact match with bottom
- `passesPushBelowAtCol(col, pushValue)` — match rules only (snap ghosts / highlights)
- `canPushBelowAtCol(col, pushValue)` — rules + star balance + rolled phase
- `canStarSwapStack(col)` — 2-dice stack, both faces inner 2–5 and different (any outer 1/6, or a matching pair, locks the swap), `swapStackDice(col)`
- `markBuggerPendingCol(col)`, `clearBuggerPendingCol(col)`, `isBuggerPendingCol(col)`
- `isStarRerollTrayDie(dieId)` — outer 1/6 reroll takes priority over flip
