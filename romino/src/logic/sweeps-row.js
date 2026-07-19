import { state } from './state.js';
import { getOccupiedCols } from './row.js';

/** Ace tiles (rankSum 1) may read as 1 or 13 when checking run adjacency. */
function rankValues(rankSum) {
  return rankSum === 1 ? [1, 13] : [rankSum];
}

/** +1 step, or ace wrap bridges on the 2…12 wheel (e.g. 2–A–12, 12–A–2, 11–12–A). */
function isRankStep(prev, next) {
  if (next === prev + 1) return true;
  if (prev === 2 && next === 1) return true;
  if (prev === 1 && next === 12) return true;
  if (prev === 13 && next === 2) return true;
  return false;
}

function isConsecutivePair(prevSum, nextSum) {
  for (const prev of rankValues(prevSum)) {
    for (const next of rankValues(nextSum)) {
      if (isRankStep(prev, next)) return true;
    }
  }
  return false;
}

function isRankStepDesc(prev, next) {
  if (next === prev - 1) return true;
  if (prev === 12 && next === 1) return true;
  if (prev === 1 && next === 2) return true;
  if (prev === 2 && next === 13) return true;
  return false;
}

function isConsecutivePairDesc(prevSum, nextSum) {
  for (const prev of rankValues(prevSum)) {
    for (const next of rankValues(nextSum)) {
      if (isRankStepDesc(prev, next)) return true;
    }
  }
  return false;
}

function isConsecutiveAscending(sums) {
  for (let i = 1; i < sums.length; i++) {
    if (!isConsecutivePair(sums[i - 1], sums[i])) return false;
  }
  return true;
}

function isConsecutiveDescending(sums) {
  for (let i = 1; i < sums.length; i++) {
    if (!isConsecutivePairDesc(sums[i - 1], sums[i])) return false;
  }
  return true;
}

function isConsecutiveRun(sums) {
  return isConsecutiveAscending(sums) || isConsecutiveDescending(sums);
}

function isEqualRun(sums) {
  return sums.every(s => s === sums[0]);
}

/** No other occupied column (e.g. stack) may sit between run tiles on the row. */
function isAdjacentTileRun(entries) {
  const occupied = getOccupiedCols();
  const runCols = new Set(entries.map(([col]) => col));
  const minCol = entries[0][0];
  const maxCol = entries[entries.length - 1][0];
  for (const col of occupied) {
    if (col < minCol || col > maxCol) continue;
    if (!runCols.has(col)) return false;
  }
  return true;
}

function findSweepRunsFromEntries(tileEntries) {
  const runs = [];
  let i = 0;
  while (i < tileEntries.length) {
    let best = null;
    for (let len = tileEntries.length - i; len >= 3; len--) {
      const slice = tileEntries.slice(i, i + len);
      const sums = slice.map(([, t]) => t.rankSum);
      if (
        isAdjacentTileRun(slice) &&
        (isEqualRun(sums) || isConsecutiveRun(sums))
      ) {
        best = slice;
        break;
      }
    }
    if (best) {
      runs.push(best);
      i += best.length;
    } else {
      i++;
    }
  }
  return runs;
}

export function findSweepRuns() {
  const cols = getOccupiedCols();
  const tileEntries = cols
    .filter(col => state.row[col]?.kind === 'tile')
    .map(col => [col, state.row[col]]);
  return findSweepRunsFromEntries(tileEntries);
}

export function applySweepRun(run) {
  state.sweepHistory.push(
    run.map(([, tile]) => ({ suit: tile.suit, rank: tile.rank, rankSum: tile.rankSum })),
  );
  for (const [, tile] of run) {
    const suit = tile.suit;
    if (state.suitTally[suit] != null) state.suitTally[suit]++;
  }
  for (const [col] of run) {
    delete state.row[col];
  }
}

/** Remove swept tiles, tally suits, bank stars → points. Returns swept col indices. */
export function resolveSweeps() {
  const runs = findSweepRuns();
  const sweptCols = new Set(runs.flatMap(run => run.map(([col]) => col)));

  if (sweptCols.size > 0) {
    state.points += state.stars;
    state.stars = 0;
  }

  for (const run of runs) applySweepRun(run);

  return [...sweptCols];
}
