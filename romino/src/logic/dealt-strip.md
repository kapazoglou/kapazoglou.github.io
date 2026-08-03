---
module: dealt-strip
layer: logic
v: 1.2
date: 2026-08-03
deps: [state.js, convert.js]
---
# Dealt strip

Between-zone tile strip on the row↔tray seam (`tileDealtEvery`).

- `appendDealtStripTile(tile)` — push with monotonic `stripId`
- `clearDealtStrip()` — empty strip (row sweep cascade)
- `identityBlockedByStripOrRow(suit, rank, excludeCol?)` — duplicate gate for converts
- `stripTileHasRowDuplicate(stripId)` — accent border eligibility
- `sortedDealtStrip()` — render order A (low) → 2–12 → * (high)
- `pairSweepStripTile(stripId)` — remove strip tile + matching row column (no score); releases withheld die when `tileDiceHold` ON
