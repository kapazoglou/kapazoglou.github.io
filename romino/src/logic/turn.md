---
module: turn
layer: logic
v: 2.21
date: 2026-07-30
deps: [state, settings, dice, tile-deck, deck-flank, deck-size, confirm-anim, deal-discard-anim]
---
# Turn

`rollDice`, `confirmTurn()`, `resetGame`, `initialStarCount()`, `handleRollButton()`, `evaluateGameOver(context)`, `setGameOverHandler(fn)`, `triggerGameOver(reason)`, `getRollButtonEndGameReason()`, `commitRollButtonGameOver(reason)`, `isRollPoolLow()`, `isRollButtonWarningRedBorder()`, `isRollButtonEndGameTap()`, `shouldWarnOnLeave()`, `finishRollAfterDiscard()`, `tryContinueAfterConfirm()`.

Game over when: `dicePool < nRoll` (idle roll click), deck depleted on cadence deal, no legal placements (tray stuck tap or dealt tile auto), `well-done` when both deck-flank stacks are empty after sweeps, or `well-done` when `deckSize` counter reaches 0 after conversions. **`setGameOverHandler`** (wired in `main.js`) shows the overlay for every `triggerGameOver` call — including async confirm/WELL DONE in Deck Flank. **Roll button border**: warning red (`isRollButtonWarningRedBorder`) → tap arms KO confirm bar (handlers); accent → idle roll or rolled confirm (`handleRollButton`). Roll-button game-over paths return `{ pendingEndGame }` for KO confirm; auto/async paths still call `enterGameOver` immediately. **Deck Flank ON:** `canRoll` + pool top-up extend play while stacks hold tiles; loss screens identical to Flank OFF.

`resetGame()` sets `state.stars` to `nPlace` when `rerollOuter` ON, else 0; initializes flank stacks when `deckFlank` ON; initializes `deckRemaining` when `deckSize` > 0.

`rollDice()` returns `'ok' | 'deck-depleted' | 'discard-anim' | null`. Cadence deal skipped when `deckFlank` ON.
