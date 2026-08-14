---
module: star-powers
layer: logic
v: 1.15
date: 2026-08-14
deps: [state, settings, dice]
note: never import row.js — row imports this module
---
# Star Powers

Pure rules for `starPowers` / `pushBelowCost` / `buggerSingles`. No DOM.

## Exports
- `starPowersEnabled()`, `pushBelowStarCost()`, `pushBelowEnabled()`, `buggerSinglesEnabled()`, `canSpendStarPower()`
- `oppositeDieValue(v)` — 1↔6, 2↔5, 3↔4
- `canStarFlipTrayDie(dieId)` — all tray faces; outer 1/6 only when `rerollOuter` OFF
- `passesPushBelowMatch(top, bottom, push)` — tray 2–5 only; blocks uniform stacks (top === bottom); top 6 → push ≤ bottom; top 1 → push ≥ bottom; else exact match with bottom
- `passesPushBelowAtCol(col, pushValue)` — match rules only; 1-die lone outer + 2-die all-outer use permissive inner push
- `isLoneBuggerOuterCol(col)` / `isBuggerPendingCol(col)` — lone 1/6 column derived from row shape (not Set membership alone)
- `canPushBelowAtCol(col, pushValue)` — rules + star balance (≥ `pushBelowStarCost()`) + rolled phase
- `canStarSwapStack(col)` — 2-dice stack, both faces inner 2–5 and different, not already swap-paid this turn (any outer 1/6 or matching pair locks swap), `swapStackDice(col)`
- `markSwapStackCol(col)` / `clearSwapStackCol(col)` / `isSwapPaidCol(col)` / `isSwapRefundableDie(dieId)` / `canRefundSwapStack(col)` — this-turn swap refund tracking
- `recordFlip(dieId)` (toggles odd/even) / `isFlippedDie(dieId)` / `clearFlippedDie(dieId)` — this-turn flip refund tracking
- `isAllOuterStack(column)`, `markBuggerOuterStackLockedCol(col)`, `clearBuggerOuterStackLockedCol(col)`, `isBuggerOuterStackLockedCol(col)`, `syncBuggerOuterStackLock(col)`
- `markBuggerPendingCol(col)`, `clearBuggerPendingCol(col)`, `isBuggerPendingCol(col)`
- `getStarPowerCostReminderMatches()` — push gap at row 0; swap at row 0 (fixed on bottom pair) or row 1 only when push die is below; `costReminder` pins through drag/snap
