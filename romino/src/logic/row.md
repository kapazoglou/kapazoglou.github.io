---
module: row
layer: logic
v: 1.62
date: 2026-08-04
deps: [state, settings, domino-roll, domino-spots, dealt-strip, nine-cubes]
---
# Row

Column placement, validity, return-to-bar. `nextMustFollow` ON: when any lone-die stack matches the placed die’s value, gap-insert and new-column slots are blocked; stacking on any valid column remains allowed (bar or row reposition). Lone-die detection ignores the die being repositioned so the rule still applies when dragging the top die off a 2-dice stack. Jokers: when `tricolorRestriction` ON (default), `rowHasJoker` — at most one committed joker (tile or full tricolor stack) on the row at a time; spent-suit full stacks do not count; 2-dice stacks no longer gate other columns (`jokerSuitBlocked` still blocks same suit). `jokerSuitsUsed` / `jokerSuitBlocked` — at most one joker per suit per game. When OFF, those caps are lifted; duplicate 3-dice permutations (`rowHasMatchingThreeDiceStack`) and same convert identity (`rowHasMatchingConvertIdentity`) still block tricolor joker completion. `rowHasThreeDiceStack()` — any convert-ready 3-dice stack on the row. `isAtSpotCap()` — row columns only (between-zone strip excluded). Deck-flank stacks are virtual (not in row). `isTrayStuck()` — active bar dice remain but none have a legal slot. `passesNoDuplicateTile` blocks convert identities matching strip tiles or row tiles (`identityBlockedByStripOrRow`) and, when `nineCubes` ON, cube locks (`isCubeLockedForIdentity`). `wouldCompleteBlockedDuplicate()` / `convertIdentityForStackCompletion()` — duplicate-block feedback UX. `wouldCompleteBlockedCube()` / `cubeLockColForStackCompletion()` — nine-cubes lock feedback UX. Ace/joker stack completion requires stars when `aceJokerStarCost` ON.
