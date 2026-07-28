---
module: turn
layer: logic
v: 2.12
date: 2026-07-28
deps: [state, settings, dice, tile-deck, deck-flank, confirm-anim, deal-discard-anim]
---
# Turn

`rollDice`, `confirmTurn(onGameOver)`, `resetGame`, `initialStarCount()`, `handleRollButton(onGameOver)`, `evaluateGameOver(context)`, `shouldBlockGameOver(reason)`, `shouldWarnOnLeave()`, `finishRollAfterDiscard(onGameOver)`.

Game over when: `dicePool < nRoll` (idle roll click), deck depleted on cadence deal, no legal placements (tray stuck tap or dealt tile auto), or `well-done` when both deck-flank stacks are empty after sweeps. Pre-Flank rules unchanged when `deckFlank` OFF. **Deck Flank ON:** only pool-exhausted loss is suppressed while `flankEndgamePending()` (stacks treated as row tiles via `canRoll` top-up + `shouldBlockGameOver`); tray/dealt stuck use the same pre-Flank checks with flank tops as tile neighbors in `row.js`.

`resetGame()` sets `state.stars` to `nPlace` when `rerollOuter` ON, else 0; initializes flank stacks when `deckFlank` ON.

`rollDice()` returns `'ok' | 'deck-depleted' | 'discard-anim' | null`. Cadence deal skipped when `deckFlank` ON.
