---
module: nine-cubes
layer: logic
v: 1.1
date: 2026-08-04
deps: [state, settings, dice-visual, tile-deck]
---
# Nine Cubes

`nineCubes` stepper: **0** = off, **1** = one cube set, **2** = two identical cube sets (each cube may hold up to N converted row tiles, N = setting value).

When active, all 52 tile identities partition into 9 cubes. Converted row tiles consume capacity in their cube — further stack completions in that cube block when capacity is full.

## Cube map (rotate-by-omit)

**Evens** (rankSum 1,3,5,7,9,11 — A=1):

| Cube | Omits | Tiles |
|------|-------|-------|
| E0 | Z | X:A, X:g, Y:c, Y:i, W:e, W:aa |
| E1 | X | Y:A, Y:g, W:c, W:i, Z:e, Z:aa |
| E2 | Y | W:A, W:g, Z:c, Z:i, X:e, X:aa |
| E3 | W | Z:A, Z:g, X:c, X:i, Y:e, Y:aa |

**Odds** (rankSum 2,4,6,8,10,12):

| Cube | Omits | Tiles |
|------|-------|-------|
| O0 | Z | X:b, X:h, Y:d, Y:aj, W:f, W:ab |
| O1 | X | Y:b, Y:h, W:d, W:aj, Z:f, Z:ab |
| O2 | Y | W:b, W:h, Z:d, Z:aj, X:f, X:ab |
| O3 | W | Z:b, Z:h, X:d, X:aj, Y:f, Y:ab |

**Jokers:** J = Z:*, X:*, Y:*, W:* (one active joker on row at a time).

Pair rule: ranks 6 apart share a suit within a cube. Suit assignment: for cube omitting suit index `o` in `[Z,X,Y,W]`, pair `k` maps to `remaining[(k + o) % 3]`.

## API

- `nineCubesActive()` — setting > 0
- `nineCubesCapacity()` — 1 or 2 (max tiles per cube on row)
- `cubeIdForIdentity(suit, rank)` — cube id or null
- `getRowColsInCube(cubeId, excludeCol)` — locking row cols
- `isCubeLockedForIdentity(suit, rank, excludeCol)` — gate check (count ≥ capacity)
- `getCubeLockColForBlockedAttempt(suit, rank, excludeCol)` — col for flash feedback

Lock source: converted row tiles only. Additive to existing rank+suit duplicate rules in `row.js`.
