---
module: settings
layer: logic
v: 2.30
date: 2026-08-04
deps: []
---
# Settings

v2: `nDice`, `nRoll`, `nPlace`, `nSpots`, `tileDealtEvery`, `deckSize` steppers; `nineCubes` stepper (0=off, 1=one cube set, 2=two identical cube sets); `deckFlank`, `oneToOne`, `suitRestriction`, `nextMustFollow`, `consecutiveStars`, `verticalStars`, `aceJokerStarCost`, `rerollOuter`, `dominoRoll`, `dominoSpots`, `tricolors`, `tricolorSevens`, `tricolorRestriction`, `jokerFlushOnly`, `tileDiceHold`, `stackBottomUp`, `directPlacement`, `snapping`, `fastAnimations`, `tutoria` toggles. `nineCubes` 1+: converted row tiles consume per-cube capacity (1 or 2 slots). `tileDiceHold` ON: convert returns 2 dice to pool and withholds 1 virtual die per tile until sweep or pair-sweep (roll-button count only feedback). `deckSize` 0 = off; 1–108 = HUD deck counter + WELL DONE when conversions exhaust it. `deckFlank` and `tileDealtEvery` are mutually exclusive (`clampSettings`). `dominoSpots` requires `dominoRoll` (`clampSettings`). `dominoSpots` and `tileDealtEvery` are mutually exclusive (`clampSettings`). Persisted to localStorage.
