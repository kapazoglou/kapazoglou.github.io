---
module: placement-input
layer: ui/display
v: 1.8
date: 2026-08-17
deps: [row, placement-row, placement-anim, invalid-flash]
---
# Placement Input

Direct-placement mode: maps pointer coordinates to a slot via `resolveSlotFromPointer`, validates with `getValidSlotsForDie`, places or flashes invalid red overlay. Push-from-below is **not** resolved from pointer coordinates — use `attemptPushBelowOnBottomDie` (select tray die → tap bottom die).

Red flash when: slot resolves but rules block it; `placeDieWithAnim` rejects; pointer on `#placement-row` but no slot (illegal zone) — unless `suppressInvalidFlash` (row reposition cancel). No flash when dropping outside the row.

## Exports
- `attemptPushBelowOnBottomDie(dieId, bottomDieEl)` → `'placed' | 'invalid' | 'none'` — select tray die, tap visual bottom die
- `attemptPlacementAtPoint(dieId, clientX, clientY, stackY?, existingFlyer?)` → `'placed' | 'invalid' | 'none'`
