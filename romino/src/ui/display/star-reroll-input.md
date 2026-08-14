---
module: star-reroll-input
layer: ui/display
v: 1.5
date: 2026-08-14
deps: [state, settings, domino-roll, star-powers, dice-visual, reroll-outer-anim, domino-reroll-anim, flip-tray-anim, stack-swap-anim, invalid-flash]
---
# Star Reroll Input

HUD `#hud-star-pay` tap/drag routing:

| Target | Action |
|--------|--------|
| Tray 1/6 | Reroll outer when `rerollOuter` ON; flip 1↔6 when Star Powers ON and `rerollOuter` OFF |
| Tray 2–5 | Flip to opposite face (`starPowers`) |
| 2-dice stack, two different inner faces | Swap top/bottom (`starPowers`) — an outer 1/6 or a matching pair blocks the swap |

Reroll wins over flip on tray 1/6 when both available.

**Drag-drop:** pointer flyer follows finger; on release skips HUD→target fly (`skipStarFly`). When `starPowers` ON, drag is the only HUD star-pay path — tap does nothing.

## Exports
- `initStarRerollInput()` — pointer handlers for HUD star tap + drag
- `isHudStarPayDraggable()` — when reroll, domino reroll, or star powers available

## Tap (no drag)
- Disabled when `starPowers` ON (use drag)
- Selected tray die eligible for flip → flip (2–5 always; 1/6 when `rerollOuter` OFF)
- Else selected tray 1/6 / domino → reroll
