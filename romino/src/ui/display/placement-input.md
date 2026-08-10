---
module: placement-input
layer: ui/display
v: 1.4
date: 2026-08-10
deps: [row, placement-row, placement-anim, invalid-flash]
---
# Placement Input

Direct-placement mode: maps pointer coordinates to a slot via `resolveSlotFromPointer`, validates with `getValidSlotsForDie`, places or flashes invalid red overlay.

Red flash when: slot resolves but rules block it; `placeDieWithAnim` rejects; pointer on `#placement-row` but no slot (illegal zone). Monotonic-blocked stack completion flashes boundary anchor cube borders via `flashMonotonicBlocked`. No flash when dropping outside the row.

## Exports
- `attemptPlacementAtPoint(dieId, clientX, clientY, stackY?, existingFlyer?)` → `'placed' | 'invalid' | 'none'`
