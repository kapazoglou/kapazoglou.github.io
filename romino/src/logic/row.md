---
module: row
layer: logic
v: 1.58
date: 2026-08-03
deps: [state, settings, domino-roll, domino-spots, dealt-strip]
---
# Row

Column placement, validity, return-to-bar. Jokers: when `tricolorRestriction` ON (default), `rowHasJoker` — at most one committed joker (tile or full tricolor stack) on the row at a time; spent-suit full stacks do not count; 2-dice stacks no longer gate other columns (`jokerSuitBlocked` still blocks same suit). `jokerSuitsUsed` / `jokerSuitBlocked` — at most one joker per suit per game. When OFF, those caps are lifted; duplicate 3-dice permutations (`rowHasMatchingThreeDiceStack`) and same convert identity (`rowHasMatchingConvertIdentity`) still block tricolor joker completion. `rowHasThreeDiceStack()` — any convert-ready 3-dice stack on the row. `isAtSpotCap()` — row columns only (between-zone strip excluded). Deck-flank stacks are virtual (not in row). `isTrayStuck()` — active bar dice remain but none have a legal slot. `passesNoDuplicateTile` blocks convert identities matching strip tiles or row tiles (`identityBlockedByStripOrRow`). `wouldCompleteBlockedDuplicate()` / `convertIdentityForStackCompletion()` — duplicate-block feedback UX. Ace/joker stack completion requires stars when `aceJokerStarCost` ON.
