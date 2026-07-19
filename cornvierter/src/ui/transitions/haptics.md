---
module: haptics
layer: ui/transitions
v: 1.1
date: 2026-06-13
deps: []
---
# Haptics — User Story

As a player on a phone, I want a subtle device buzz when my dragged die or card enters a valid drop target so placement feels tactile without repeating while I hold still.

## Exports
- `isHapticsSupported()` — true when `navigator.vibrate` is available
- `vibrateSlotHover()` — single short pulse for valid die slots and empty grid cells
- `vibrateActionBarHover()` — double pulse for action-bar return-to-tray hover

## Notes
Uses the Vibration API (Android Chrome). iOS Safari does not expose `navigator.vibrate`; calls are no-ops there.

## Related
[[drag-drop]] · [[timing]]
