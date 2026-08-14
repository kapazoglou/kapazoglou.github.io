---
module: turn
layer: logic
v: 2.53
date: 2026-08-14
deps: [state, settings, dice, domino-roll, domino-spots, tile-deck, dealt-strip, deck-flank, deck-size, confirm-anim, starting-dice, suit-tally]
---
# Turn

`rollDice()`, `confirmTurn()`, `resetGame`, `initialStarCount()` (`startingStars` + N-place when rerollOuter or nRoll=2 + nPlace=2 + dominoRoll), `handleRollButton()`, `rerollDominoPairOffer()`, `evaluateGameOver(context)`, `setGameOverHandler(fn)`, `triggerGameOver(reason)`, `getRollButtonEndGameReason()`, `commitRollButtonGameOver(reason)`, `rollAffordanceRemaining()`, `isRollPoolLow()`, `isRollPoolNumberLow()`, `isRollButtonWarningRedBorder()`, `isRollButtonEndGameTap()`, `shouldWarnOnLeave()`, `tryContinueAfterConfirm()`.

Game over when: `dicePool < nRoll` (idle roll click), tray stuck tap, `well-done` when tile-deck empty on cadence deal, both deck-flank stacks empty after sweeps, `deckSize` counter reaches 0 after conversions, **`sweptSuits` ON and any suit tally > 13** after confirm (`suit tally complete`), **Domino Spots ON and any row column lacks a pool-assigned seam domino** (`dominoSpotAssignmentGameOverReason`), or **Domino Spots ON** active draw pool cannot satisfy next roll (`domino pool exhausted`). **`placeDie`** returns `'domino-exhausted'` when assignment fails. **Roll-button affordance** (`rollAffordanceRemaining`): `nDice − row stack dice − diceWithheld` when `tileDiceHold` ON. **nRoll=4 + dominoRoll:** pool-low / KO / idle game-over use **N-place** on roll-button affordance; roll debits **N-place** from `dicePool` (tray still draws N-roll domino dice). **Domino Spots:** discard reshuffles into pool only on sweep; empty active pool blocks roll and triggers KO/endgame. **`setGameOverHandler`** (wired in `main.js`) shows the overlay for every `triggerGameOver` call. **Roll button border**: warning red → tap arms KO confirm bar; accent → idle roll or rolled confirm. **Deck Flank ON:** `canRoll` + pool top-up extend play while stacks hold tiles.

`resetGame()` calls `seedStartingDice()` then `seedStartingDominoSpots()` after init — row may start with committed stacks and bound seam dominos when both toggles ON; dice pool and domino pool debited accordingly. **`shouldWarnOnLeave`**: fresh idle session when row dice count and pool match the seed (not empty-row only).

`rollDice()` uses `drawDominoRoll()` when `dominoRoll` ON and `nRoll` is 2, 3, or 4; otherwise random spawn. When `dominoSpots` ON, offered combo keys tracked and settled via `settleDominoSpotsOnConfirm()` on confirm (replaces quad settle). Returns `'ok' | 'well-done' | null`. Cadence deal appends to `dealtStrip` when `tileDealtEvery` > 0 and `deckFlank` OFF.
