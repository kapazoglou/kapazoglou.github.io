---
module: turn
layer: logic
v: 2.19
date: 2026-07-28
deps: [state, settings, dice, tile-deck, deck-flank, confirm-anim, deal-discard-anim]
---
# Turn

`rollDice`, `confirmTurn()`, `resetGame`, `initialStarCount()`, `handleRollButton()`, `evaluateGameOver(context)`, `setGameOverHandler(fn)`, `triggerGameOver(reason)`, `isRollPoolLow()`, `isRollButtonWarningRedBorder()`, `isRollButtonEndGameTap()`, `shouldWarnOnLeave()`, `finishRollAfterDiscard()`, `tryContinueAfterConfirm()`.

Game over when: `dicePool < nRoll` (idle roll click), deck depleted on cadence deal, no legal placements (tray stuck tap or dealt tile auto), or `well-done` when both deck-flank stacks are empty after sweeps. **`setGameOverHandler`** (wired in `main.js`) shows the overlay for every `triggerGameOver` call — including async confirm/WELL DONE in Deck Flank. **Roll button border**: warning red (`isRollButtonWarningRedBorder`) → tap game over; accent → idle roll or rolled confirm (`handleRollButton`). **Deck Flank ON:** `canRoll` + pool top-up extend play while stacks hold tiles; loss screens identical to Flank OFF.

`resetGame()` sets `state.stars` to `nPlace` when `rerollOuter` ON, else 0; initializes flank stacks when `deckFlank` ON.

`rollDice()` returns `'ok' | 'deck-depleted' | 'discard-anim' | null`. Cadence deal skipped when `deckFlank` ON.
