---
module: settings
layer: logic
v: 2.25
date: 2026-08-03
deps: []
---
# Settings

v2: `nDice`, `nRoll`, `nPlace`, `nSpots`, `tileDealtEvery`, `deckSize` steppers; `deckFlank`, `oneToOne`, `suitRestriction`, `consecutiveStars`, `verticalStars`, `aceJokerStarCost`, `rerollOuter`, `dominoRoll`, `dominoSpots`, `tricolors`, `tricolorSevens`, `tricolorRestriction`, `jokerFlushOnly`, `stackBottomUp`, `directPlacement`, `snapping`, `fastAnimations`, `tutoria` toggles. `deckSize` 0 = off; 1–108 = HUD deck counter + WELL DONE when conversions exhaust it. `deckFlank` and `tileDealtEvery` are mutually exclusive (`clampSettings`). `dominoSpots` requires `dominoRoll` (`clampSettings`). Persisted to localStorage.
