---
module: end-game-prompt
layer: ui/display
v: 1.0
date: 2026-07-29
deps: [turn]
---
# End Game Prompt

UI-only armed state for the roll-button KO confirm bar. Not stored in `state.js`.

## Exports
- `armEndGamePrompt(reason)` — expand roll wrap; store pending game-over reason
- `disarmEndGamePrompt()` — collapse; cleared on PLAY AGAIN
- `isEndGamePromptArmed()` / `getPendingEndGameReason()`

## Flow
1. Warning-red number tap or roll-button `{ pendingEndGame }` → arm
2. Red **KO** tap → `commitRollButtonGameOver(reason)` → overlay
3. Number tap while armed → disarm (cancel)

## Related
[[handlers]] · [[action-bar]] · [[turn]] · [[game-over]]
