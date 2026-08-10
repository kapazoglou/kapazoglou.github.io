---
module: monotonic
layer: logic
v: 1.9
date: 2026-08-10
deps: [state, settings, dice-visual]
---
# Monotonic

When `monotonic` + `diceAndCubes` ON and ≥2 qualifying anchors on row (converted tiles **or** full 3-dice stacks awaiting convert): 3rd-die stack completions must fit a **zone** derived from consecutive anchor pairs. Jokers exempt. Empty columns between anchors do not matter — only region (outside-left, between pair, outside-right). Anchors recalc on every check — stacks count before confirm so post-sweep turns stay gated.

## Path rule (invariant)

**Default: linear.** Between a consecutive pair with **no ace** anchor → `linearBetween` = ranks min..max only. Never route through 1/13 on the wheel.

**Ace in pair only.** When an ace tile bounds that gap → `aceBetween` (wheel wrap via `aceWheelArc` / `aceUnionArc` allowed). Ace+3–11 → linear 1..R; Ace+12 (two anchors) → long 1..12; Ace+12 (3+ gap) → short ace–12 arc; Ace+2 → 1,2.

**Validation vs path.** `rankInSet` lets ace converts match as **1 or 13** — that picks orientation at check time; it does not choose wheel paths for non-ace gaps.

**Pair-local.** Each gap uses only its two bracketing anchors. Distant tiles (e.g. 12 left of ace) do not affect the ace–partner gap.

## Zones

**Two anchors:** between = path rule above; outward = Ace+4 → 5..13 mirrored; Ace+12 → all; Ace+2 → 2..13; [6][8] → ≤6 / ≥8.

**Three+ anchors:** same path rule per consecutive gap; outward-left = all if ace in span; outward-right = all when rightmost ≥ 12.

## Exports
- `monotonicEnabled()`, `getQualifyingAnchorTiles()`, `boundsFromRow()`, `monotonicActive()`
- `monotonicRankAllowed(col, rankSum)`, `monotonicBoundaryColsForCol(col)`, `monotonicBoundaryCols()`
