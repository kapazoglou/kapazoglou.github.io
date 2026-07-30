---
module: settings
layer: logic
v: 2.22
date: 2026-07-30
deps: []
---
# Settings

v2: `nDice`, `nRoll`, `nPlace`, `nSpots`, `tileDealtEvery`, `deckSize` steppers; `tileDealtChainDraw`, `deckFlank`, `oneToOne`, `suitRestriction`, `consecutiveStars`, `verticalStars`, `aceJokerStarCost`, `rerollOuter`, `tricolors`, `tricolorSevens`, `tricolorRestriction`, `jokerFlushOnly`, `stackBottomUp`, `directPlacement`, `snapping`, `fastAnimations`, `tutoria` toggles. `deckSize` 0 = off; 1–108 = HUD deck counter + WELL DONE when conversions exhaust it. `deckFlank` and `tileDealtEvery` are mutually exclusive (`clampSettings`). Persisted to localStorage.
