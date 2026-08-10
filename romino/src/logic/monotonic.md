---
module: monotonic
layer: logic
v: 1.3
date: 2026-08-10
deps: [state, settings, dice-visual]
---
# Monotonic

When `monotonic` + `diceAndCubes` ON and ≥2 qualifying rank-cube tiles on row: 3rd-die stack completions must satisfy spatial rank zones. Jokers exempt.

**Non-ace pairs:** ascending left→right — left outward `rank ≤ rLow`, between `rLow..rHigh`, right outward `rank ≥ rHigh`.

**Ace at left boundary** (partner R at right boundary):
- R ≥ 12: left `≤ 1`, between `1..R`, right `< R`
- R = 2: left/right outward `≥ 13` (high wrap edge case)
- R 3–11: left `< 13` (ace as 13 ceiling), between `1..R`, right `> R`

**Ace at right boundary:** mirror of above.

## Exports
- `monotonicEnabled()` — settings gate
- `getQualifyingAnchorTiles()` — row scan `{ col, rankSum }[]`
- `boundsFromRow()` — `{ leftCol, rightCol, rLow, rHigh, boundaryCols, anchors } | null`
- `monotonicActive()` — bounds exist (≥2 anchors)
- `monotonicRankAllowed(col, rankSum)` — zone test for would-be convert
- `monotonicBoundaryCols()` — leftmost + rightmost cols for flash
