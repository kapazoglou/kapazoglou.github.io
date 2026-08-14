---
module: settings
layer: logic
v: 2.36
date: 2026-08-14
deps: []
---
# Settings

v2: `nDice`, `nRoll`, `nPlace`, `nSpots`, `startingDice`, `tileDealtEvery`, `deckSize` steppers; `nineCubes` stepper (0=off, 1=one cube set, 2=two identical cube sets); `deckFlank`, `oneToOne`, `suitRestriction`, `nextMustFollow`, `consecutiveStars`, `verticalStars`, `aceJokerStarCost`, `rerollOuter`, `dominoRoll`, `dominoSpots`, `tricolors`, `switcherJokers`, `tricolorSevens`, `tricolorRestriction`, `jokerFlushOnly`, `starPowers`, `buggerSingles`, `tileDiceHold`, `stackBottomUp`, `directPlacement`, `snapping`, `fastAnimations`, `diceAndCubes`, `monotonic`, `sweptSuits`, `tutoria` toggles. `buggerSingles` clamped to `starPowers` ON. `startingDice` clamped to `min(nDice, nSpots×2, 24)`; seeds row on reset via `starting-dice.js`. `monotonic` ON (with `diceAndCubes`): spatial rank-zone gate on 3rd-die stack completion; row-derived anchors; ace dual 1|13 widens bounds. `switcherJokers` ON: standard tricolor stacks convert to a lone die of the missing inner color (not a joker tile); mutually exclusive with `tricolorSevens`; requires `tricolors` ON (`clampSettings`). `diceAndCubes` ON: row converted tiles use rank cube + suit die visual + in-place convert anim; forces `tileDiceHold` ON (`clampSettings`). `tileDiceHold` OFF forces `diceAndCubes` OFF. `nineCubes` 1+: converted row tiles consume per-cube capacity (1 or 2 slots). `tileDiceHold` ON: convert returns 2 dice to pool and withholds 1 virtual die per tile until sweep or pair-sweep (roll-button count only feedback). `sweptSuits` ON: HUD left shows per-suit swept tile counts (Z X Y W); score right-aligned. `deckSize` 0 = off; 1–108 = HUD deck counter + WELL DONE when conversions exhaust it. `deckFlank` and `tileDealtEvery` are mutually exclusive (`clampSettings`). `dominoSpots` requires `dominoRoll` (`clampSettings`). `dominoSpots` and `tileDealtEvery` are mutually exclusive (`clampSettings`). Persisted to localStorage.
