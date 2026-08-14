---
module: stack-swap-anim
layer: ui/transitions
v: 1.1
date: 2026-08-14
deps: [state, settings, star-powers, pip-anim, dice-visual, game-log, render, convert-anim.css]
---
# Stack Swap Anim

Star-pay swap of top/bottom dice in a 2-dice column. Both dice cross with `die--cube-merge-blend` (convert merge style). Commits `swapStackDice` — bottom index 0 drives suit on convert. Marks column in `swapStackCols` for this-turn tap refund.

## Exports
- `tryStarSwapStackPay(col)` — gate + start anim
- `swapStackWithAnim(col)` — star fly → simultaneous ±`DIE_STACK_STEP` translate → reverse dice array
- `tryRefundSwapStack(col)` / `refundSwapStackWithAnim(col)` — reverse swap + star fly to HUD
