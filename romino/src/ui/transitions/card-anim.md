---
module: card-anim
layer: ui/transitions
v: 1.3
date: 2026-06-11
deps: [state, settings, phase, render, hud]
---
# Card Anim — User Story

As a player, I want to see a coin fly from a filled card's score badge to the score counter, and then the card's dice area collapse into its rank/suit identity with a smooth animation.

## Exports
- `launchPip(fromRect, toRect, onArrival, onDone)` — coin pop → travel → fade animation
- `launchPenaltyPip(toRect)` — reverse coin (score → forbidden slot, for paid-slot penalty)
- `firePipsSequential(fromRect, toRect, pts, idx, onAllDone)` — chain multiple coin launches
- `processCardFills(queue, index, onDone)` — sequentially animates each card in the fill queue

## Animation sequence (per card)
1. If pts > 0: `firePipsSequential` flies coins from score badge to HUD counter
2. `.is-converting` class triggers CSS: dice area fades, card-index expands to centre
3. `fillOneCard(cardId)` mutates state; `render()` re-renders the filled card

## 2-slot conversion variants
- **Domino fill** (`vSuitDominoFill` ON, default): `.converter-card--2slot.is-converting:not(.converter-card--2slot-compact-fill)` suppresses the dice fadeout so bottom dice remain through the animation
- **Compact fill** (`vSuitDominoFill` OFF): no suppression; dice fade normally like a standard 3-slot card

## 1-slot conversion variants
- **Domino fill** (`vSuitDominoFill` ON, default): `.converter-card--1slot.is-converting:not(.converter-card--1slot-compact-fill)` suppresses the dice fadeout so the center die remains through the animation
- **Compact fill** (`vSuitDominoFill` OFF): no suppression; center die fades normally

## SQUARE conversion (settings.square)
- `square-index-expand` keyframe: bottom-left 36px → centred 54px
- `.square-dice` fades on convert; partial-converted stub suppresses fade

## Related
[[timing]] · [[scoring]] · [[phase]] · [[hud]] · [[render]]
