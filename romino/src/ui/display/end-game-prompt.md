---
module: end-game-prompt
layer: ui/display
v: 1.1
date: 2026-07-29
deps: [turn]
---
# End Game Prompt

UI-only armed state for the roll-button KO confirm bar. Not stored in `state.js`.

## Exports
- `armEndGamePrompt(reason, source?)` — expand roll wrap; `source`: `'warning-red'` (number tap) or `'pending-roll'` (post-roll game over)
- `disarmEndGamePrompt()` — collapse; cleared on PLAY AGAIN
- `isEndGamePromptArmed()` / `getPendingEndGameReason()`
- `syncEndGamePromptWithRollChrome(isWarningRedBorder)` — auto-disarm warning-red arms when roll border is no longer red

## Flow
1. Warning-red number tap or roll-button `{ pendingEndGame }` → arm
2. Red **KO** tap → `commitRollButtonGameOver(reason)` → overlay
3. Number tap while armed → disarm (cancel)
4. Warning-red arm + border clears (render sync) → auto-disarm

## Related
[[handlers]] · [[action-bar]] · [[turn]] · [[game-over]]
