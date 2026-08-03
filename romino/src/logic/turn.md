---
module: turn
layer: logic
v: 2.29
date: 2026-08-03
deps: [state, settings, dice, domino-roll, domino-spots, tile-deck, dealt-strip, deck-flank, deck-size, confirm-anim]
---
# Turn

`rollDice`, `confirmTurn()`, `resetGame`, `initialStarCount()`, `handleRollButton()`, `evaluateGameOver(context)`, `setGameOverHandler(fn)`, `triggerGameOver(reason)`, `getRollButtonEndGameReason()`, `commitRollButtonGameOver(reason)`, `isRollPoolLow()`, `isRollButtonWarningRedBorder()`, `isRollButtonEndGameTap()`, `shouldWarnOnLeave()`, `tryContinueAfterConfirm()`.

Game over when: `dicePool < nRoll` (idle roll click), tray stuck tap, `well-done` when tile-deck empty on cadence deal, both deck-flank stacks empty after sweeps, or `deckSize` counter reaches 0 after conversions. **`setGameOverHandler`** (wired in `main.js`) shows the overlay for every `triggerGameOver` call. **Roll button border**: warning red → tap arms KO confirm bar; accent → idle roll or rolled confirm. **Deck Flank ON:** `canRoll` + pool top-up extend play while stacks hold tiles.

`rollDice()` uses `drawDominoRoll()` when `dominoRoll` ON and `nRoll` is 2, 3, or 4; otherwise random spawn. When `dominoSpots` ON, offered combo keys tracked and settled via `settleDominoSpotsOnConfirm()` on confirm (replaces quad settle). Returns `'ok' | 'well-done' | null`. Cadence deal appends to `dealtStrip` when `tileDealtEvery` > 0 and `deckFlank` OFF.
