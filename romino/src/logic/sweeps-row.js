import { state } from './state.js';
import { getOccupiedCols } from './row.js';
import { JOKER_RANK } from './dice-visual.js';
import { settings } from './settings.js';
import {
  sweepTileEntriesWithFlanks,
  flankSideForSweepCol,
  popFlankStack,
  bothFlankStacksEmpty,
} from './deck-flank.js';
import { releaseDominoKeysForCols } from './domino-spots.js';
import { releaseWithheldDice } from './convert.js';
import { tallySuit } from './suit-tally.js';

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

/** +1 step only; ace reads as 1 or 13 via rankValues (A–2–3 low, 11–12–A high — no wheel wrap). */
function isRankStep(prev, next) {
  return next === prev + 1;
}

function isRankStepDesc(prev, next) {
  return next === prev - 1;
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

/** Reject ace sandwiched by two tiles of the same rank (e.g. 2–A–2). */
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

/**
 * Joker flush: ≥2 non-jokers share one suit and every joker matches that suit.
 * Joker suit is assigned at convert (tricolorSevens → bottom die; tricolors → missing inner die).
 */
function isFlushRunWithJokers(tiles) {
  const nonJokers = tiles.filter(t => !isJokerTile(t));
  if (nonJokers.length < 2) return false;
  const suit = nonJokers[0].suit;
  if (!nonJokers.every(t => t.suit === suit)) return false;
  return tiles.filter(isJokerTile).every(j => j.suit === suit);
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
  const tileEntries = sweepTileEntriesWithFlanks();
  return findSweepRunsFromEntries(tileEntries);
}

/** ×1 at 3 cards; +1 per card above 3. */
export function sweepStarMultiplier(cardCount) {
  return 1 + Math.max(0, cardCount - 3);
}

/** Joker-inclusive same-suit flush (tricolor joker tiles). */
function isTricolorFlush(tiles) {
  return runHasJoker(tiles) && isFlushRunWithJokers(tiles);
}

/** Run-length multiplier; tricolor flushes always ×1. */
export function sweepStarMultiplierForRun(tiles) {
  if (isTricolorFlush(tiles)) return 1;
  return sweepStarMultiplier(tiles.length);
}

export function applySweepRun(run) {
  state.sweepHistory.push(
    run.map(([, tile]) => ({ suit: tile.suit, rank: tile.rank, rankSum: tile.rankSum })),
  );
  for (const [, tile] of run) {
    tallySuit(tile.suit);
  }

  const flankSidesToPop = new Set();
  const playerColsToDelete = [];

  for (const [col] of run) {
    const flankSide = flankSideForSweepCol(col);
    if (flankSide) flankSidesToPop.add(flankSide);
    else playerColsToDelete.push(col);
  }

  for (const side of flankSidesToPop) {
    popFlankStack(side);
  }
  releaseWithheldDice(playerColsToDelete.length);
  releaseDominoKeysForCols(playerColsToDelete);
  for (const col of playerColsToDelete) {
    delete state.row[col];
  }
  state.rowTileWarningCols.clear();
}

/** @returns {'well-done' | null} */
export function checkFlankWellDone() {
  if (settings.deckFlank && bothFlankStacksEmpty()) return 'well-done';
  return null;
}

/** Remove swept tiles, tally suits, bank stars → points. Returns swept col indices. */
export function resolveSweeps() {
  const sweptCols = new Set();
  let anySwept = false;
  let totalMult = 0;

  while (true) {
    const runs = findSweepRuns();
    if (!runs.length) break;
    anySwept = true;
    for (const run of runs) {
      totalMult += sweepStarMultiplierForRun(run.map(([, t]) => t));
      applySweepRun(run);
      for (const [col] of run) sweptCols.add(col);
    }
  }

  if (anySwept) {
    state.points += state.stars * totalMult;
    state.stars = 0;
  }

  return [...sweptCols];
}
