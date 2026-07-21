import { state } from './state.js';
import { getOccupiedCols } from './row.js';
import { JOKER_RANK } from './dice-visual.js';
import { settings } from './settings.js';

/** Wheel values used for consecutive-run assignment (13 = ace-high). */
const ALL_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

function isJokerTile(tile) {
  return tile.rank === JOKER_RANK;
}

/** Ace tiles (rankSum 1) may read as 1 or 13 when checking run adjacency. */
function rankValues(rankSum) {
  return rankSum === 1 ? [1, 13] : [rankSum];
}

function fixedRankCandidates(tile) {
  return isJokerTile(tile) ? null : rankValues(tile.rankSum);
}

/** +1 step, or ace wrap bridges on the 2…12 wheel (e.g. 2–A–12, 12–A–2, A–2–3, 11–12–A). */
function isRankStep(prev, next) {
  if (next === prev + 1) return true;
  if (prev === 2 && next === 1) return true;
  if (prev === 1 && next === 12) return true;
  if (prev === 13 && next === 2) return true;
  return false;
}

function isRankStepDesc(prev, next) {
  if (next === prev - 1) return true;
  if (prev === 12 && next === 1) return true;
  if (prev === 1 && next === 2) return true;
  if (prev === 2 && next === 13) return true;
  return false;
}

function possibleNextAsc(prev) {
  return ALL_RANKS.filter(v => isRankStep(prev, v));
}

function possibleNextDesc(prev) {
  return ALL_RANKS.filter(v => isRankStepDesc(prev, v));
}

/** Jokers may assume any rank; propagate feasible values left→right. */
function canConsecutiveAsc(tiles) {
  let prevSet = null;
  for (const tile of tiles) {
    const fixed = fixedRankCandidates(tile);
    if (fixed === null) {
      if (prevSet === null) {
        prevSet = new Set(ALL_RANKS);
      } else {
        const next = new Set();
        for (const p of prevSet) {
          for (const v of possibleNextAsc(p)) next.add(v);
        }
        if (!next.size) return false;
        prevSet = next;
      }
    } else if (prevSet === null) {
      prevSet = new Set(fixed);
    } else {
      const next = new Set();
      for (const p of prevSet) {
        for (const v of fixed) {
          if (isRankStep(p, v)) next.add(v);
        }
      }
      if (!next.size) return false;
      prevSet = next;
    }
  }
  return prevSet !== null && prevSet.size > 0;
}

function canConsecutiveDesc(tiles) {
  let prevSet = null;
  for (const tile of tiles) {
    const fixed = fixedRankCandidates(tile);
    if (fixed === null) {
      if (prevSet === null) {
        prevSet = new Set(ALL_RANKS);
      } else {
        const next = new Set();
        for (const p of prevSet) {
          for (const v of possibleNextDesc(p)) next.add(v);
        }
        if (!next.size) return false;
        prevSet = next;
      }
    } else if (prevSet === null) {
      prevSet = new Set(fixed);
    } else {
      const next = new Set();
      for (const p of prevSet) {
        for (const v of fixed) {
          if (isRankStepDesc(p, v)) next.add(v);
        }
      }
      if (!next.size) return false;
      prevSet = next;
    }
  }
  return prevSet !== null && prevSet.size > 0;
}

function runHasJoker(tiles) {
  return tiles.some(isJokerTile);
}

/** Ace wrap is only for bridging wheel ends (e.g. 12–A–2), not same rank both sides (2–A–2). */
function hasAceBetweenSameRanks(tiles) {
  for (let i = 1; i < tiles.length - 1; i++) {
    const mid = tiles[i];
    if (mid.rankSum !== 1 || isJokerTile(mid)) continue;
    const left = tiles[i - 1];
    const right = tiles[i + 1];
    if (isJokerTile(left) || isJokerTile(right)) continue;
    if (left.rankSum === right.rankSum) return true;
  }
  return false;
}

function isConsecutiveRun(tiles) {
  if (settings.jokerFlushOnly && runHasJoker(tiles)) return false;
  const ok = canConsecutiveAsc(tiles) || canConsecutiveDesc(tiles);
  return ok && !hasAceBetweenSameRanks(tiles);
}

/** Jokers may match any rank; non-jokers must agree. */
function isEqualRun(tiles) {
  if (settings.jokerFlushOnly && runHasJoker(tiles)) return false;
  const fixed = tiles.filter(t => !isJokerTile(t)).map(t => t.rankSum);
  if (!fixed.length) return true;
  return fixed.every(s => s === fixed[0]);
}

/** Joker flush: all non-jokers share one suit, with at least two of that suit. */
function isFlushRunWithJokers(tiles) {
  const nonJokers = tiles.filter(t => !isJokerTile(t));
  if (nonJokers.length < 2) return false;
  const suit = nonJokers[0].suit;
  return nonJokers.every(t => t.suit === suit);
}

function qualifiesAsSweep(tiles) {
  if (runHasJoker(tiles)) {
    return settings.jokerFlushOnly
      ? isFlushRunWithJokers(tiles)
      : (isEqualRun(tiles) || isConsecutiveRun(tiles));
  }
  return isEqualRun(tiles) || isConsecutiveRun(tiles);
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
      const tiles = slice.map(([, t]) => t);
      if (isAdjacentTileRun(slice) && qualifiesAsSweep(tiles)) {
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
