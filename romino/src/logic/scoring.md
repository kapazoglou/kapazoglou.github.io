---
module: scoring
layer: logic
v: 1.6
date: 2026-06-15
deps: [state, settings, cards]
---
# Scoring — User Story

As a player, I want to earn coins when I complete a card whose dice satisfy bonus rules (suit matches a rank die; rank dice sum to 7). The coin badge appears on the card during dice placement and animates to the score counter when the card fills.

## Exports
- `evaluateCardScore(cardId)` — returns 1 if any scoring rule fires, else 0
- `updateScorePreview(cardId)` — shows/hides the 🪙 badge on an in-progress card
- `detectCombo(tiles)` — 2-tile combo label/stars (used for legacy ticker, data-only)
- `CARD_SCORE_RULES` — array of rule functions for easy extension

## Related
[[state]] · [[settings]] · [[cards]] · [[card-anim]] · [[hud]]
