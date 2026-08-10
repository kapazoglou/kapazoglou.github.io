import { state } from './state.js';
import { settings } from './settings.js';
import { JOKER_RANK, tileIdentityFromStackValues, isSwitcherTricolorStack } from './dice-visual.js';

const WHEEL_LEN = 13;

/**
 * PATH RULE (invariant — do not regress):
 * - Between-zone for one consecutive anchor pair is pair-local.
 * - No ace in that pair → linear rangeSet(min, max) ONLY. Never wheel arcs.
 * - Ace tile in that pair → aceBetween() only; 1/13 wrap paths live there.
 * - rankInSet: ace converts may match as 1 or 13 (validation, not path pick).
 */

function allRanksSet() {
  const s = new Set();
  for (let r = 1; r <= WHEEL_LEN; r++) s.add(r);
  return s;
}

function rangeSet(lo, hi) {
  const s = new Set();
  for (let r = lo; r <= hi; r++) s.add(r);
  return s;
}

/** Ace tile → wheel values 1 and 13. */
function wheelValues(rankSum) {
  return rankSum === 1 ? [1, 13] : [rankSum];
}

function pairHasAce(left, right) {
  return left.rankSum === 1 || right.rankSum === 1;
}

/** Linear between-zone for a pair with no ace anchor. Sole path for non-ace gaps. */
function linearBetween(left, right) {
  return rangeSet(
    Math.min(left.rankSum, right.rankSum),
    Math.max(left.rankSum, right.rankSum),
  );
}

/** Wheel arc — ONLY from aceBetween (ace-bounded gap). short = fewer wheel steps. */
function aceWheelArc(from, to, short) {
  const n = WHEEL_LEN;
  const a = from - 1;
  const b = to - 1;
  const cw = (b - a + n) % n;
  const ccw = (a - b + n) % n;
  const set = new Set();
  const useCw = short ? cw <= ccw : cw >= ccw;
  const steps = short ? Math.min(cw, ccw) : Math.max(cw, ccw);
  for (let i = 0; i <= steps; i++) {
    const idx = useCw ? (a + i) % n : (a - i + n) % n;
    set.add(idx + 1);
  }
  return set;
}

/** Union wheel arcs for ace orientation pairs — ONLY from aceBetween. */
function aceUnionArc(fromVals, toVals, short) {
  const set = new Set();
  for (const f of fromVals) {
    for (const t of toVals) {
      for (const r of aceWheelArc(f, t, short)) set.add(r);
    }
  }
  return set;
}

export function monotonicEnabled() {
  return settings.monotonic && settings.diceAndCubes;
}

function convertOptions() {
  return { tricolors: settings.tricolors, tricolorSevens: settings.tricolorSevens };
}

/** Rank-cube tiles + full stacks awaiting convert (recalc after sweep / within turn). */
function getMonotonicAnchors(excludeCol = null) {
  if (!monotonicEnabled()) return [];
  const anchors = [];

  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (column.kind !== 'tile') continue;
    if (column.rank === JOKER_RANK) continue;
    anchors.push({ col, rankSum: column.rankSum });
  }

  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (col === excludeCol) continue;
    if (column.kind !== 'stack' || column.dice.length !== 3) continue;
    const values = column.dice.map(id => state.dice[id].value);
    if (isSwitcherTricolorStack(values)) continue;
    const { rank, rankSum } = tileIdentityFromStackValues(values, convertOptions());
    if (rank === JOKER_RANK) continue;
    anchors.push({ col, rankSum });
  }

  return anchors.sort((a, b) => a.col - b.col);
}

/** @returns {{ col: number, rankSum: number }[]} */
export function getQualifyingAnchorTiles(excludeCol = null) {
  return getMonotonicAnchors(excludeCol);
}

/** @returns {{ leftCol: number, rightCol: number, boundaryCols: number[], anchors: { col: number, rankSum: number }[] } | null} */
export function boundsFromRow(excludeCol = null) {
  const anchors = getMonotonicAnchors(excludeCol);
  if (anchors.length < 2) return null;
  const cols = anchors.map(a => a.col);
  const leftCol = Math.min(...cols);
  const rightCol = Math.max(...cols);
  return {
    leftCol,
    rightCol,
    boundaryCols: leftCol === rightCol ? [leftCol] : [leftCol, rightCol],
    anchors,
  };
}

export function monotonicActive() {
  return boundsFromRow() != null;
}

function orderedPair(a, b) {
  return a.col <= b.col ? [a, b] : [b, a];
}

/**
 * Between-zone when an ace anchor bounds this pair.
 * shortGap: 3+ anchors on row (A–12 → short ace–12 arc); else two-anchor rules.
 */
function aceBetween(left, right, shortGap) {
  const L = left.rankSum;
  const R = right.rankSum;
  const partner = L === 1 ? R : L;

  if (partner >= 12) {
    return shortGap ? aceWheelArc(1, 12, true) : aceUnionArc([1], [12], false);
  }
  if (partner === 2) return aceUnionArc([1], [2], true);
  if (partner >= 3 && partner <= 11) return rangeSet(1, partner);
  return aceUnionArc(wheelValues(L), wheelValues(R), true);
}

/** Two-anchor between zone (any number of empty columns in the gap). */
function twoAnchorBetween(left, right) {
  if (!pairHasAce(left, right)) return linearBetween(left, right);
  return aceBetween(left, right, false);
}

/** Two-anchor outward — ace pairs mirror; [6][8] uses side-specific caps. */
function twoAnchorOutward(left, right, side) {
  const L = left.rankSum;
  const R = right.rankSum;

  if (L === 1 && R === 12) return allRanksSet();
  if (L === 1 && R === 2) return rangeSet(2, WHEEL_LEN);
  if (L === 1 && R >= 3 && R <= 11) return rangeSet(R + 1, WHEEL_LEN);

  if (R === 1 && L === 12) return allRanksSet();
  if (R === 1 && L === 2) return rangeSet(2, WHEEL_LEN);
  if (R === 1 && L >= 3 && L <= 11) return rangeSet(L + 1, WHEEL_LEN);

  if (side === 'left') return rangeSet(1, L);
  return rangeSet(R, WHEEL_LEN);
}

/** 3+ anchors — pair-local between (PATH RULE: linear unless ace in pair). */
function multiAnchorBetween(left, right) {
  if (!pairHasAce(left, right)) return linearBetween(left, right);
  return aceBetween(left, right, true);
}

function multiAnchorOutwardLeft(anchors) {
  if (anchors.some(a => a.rankSum === 1)) return allRanksSet();
  const left = anchors[0];
  return rangeSet(1, left.rankSum);
}

function multiAnchorOutwardRight(anchors) {
  const right = anchors[anchors.length - 1];
  if (right.rankSum >= 12) return allRanksSet();
  return rangeSet(right.rankSum, WHEEL_LEN);
}

/** @returns {{ kind: 'between' | 'outside-left' | 'outside-right', i: number } | null} */
function segmentForCol(col, anchors) {
  if (col < anchors[0].col) return { kind: 'outside-left', i: 0 };
  if (col > anchors[anchors.length - 1].col) return { kind: 'outside-right', i: anchors.length - 1 };
  for (let i = 0; i < anchors.length - 1; i++) {
    if (col > anchors[i].col && col < anchors[i + 1].col) return { kind: 'between', i };
  }
  return null;
}

function allowedRanksForSegment(segment, anchors) {
  const n = anchors.length;
  if (segment.kind === 'between') {
    const left = anchors[segment.i];
    const right = anchors[segment.i + 1];
    return n >= 3 ? multiAnchorBetween(left, right) : twoAnchorBetween(left, right);
  }
  if (segment.kind === 'outside-left') {
    if (n >= 3) return multiAnchorOutwardLeft(anchors);
    const [left, right] = orderedPair(anchors[0], anchors[1]);
    return twoAnchorOutward(left, right, 'left');
  }
  if (n >= 3) return multiAnchorOutwardRight(anchors);
  const [left, right] = orderedPair(anchors[0], anchors[1]);
  return twoAnchorOutward(left, right, 'right');
}

function rankInSet(rankSum, allowed) {
  for (const v of wheelValues(rankSum)) {
    if (allowed.has(v)) return true;
  }
  return false;
}

/** Boundary anchor cols bracketing the segment containing `col`. */
export function monotonicBoundaryColsForCol(col) {
  const bounds = boundsFromRow(col);
  if (!bounds) return [];
  const { anchors } = bounds;
  const segment = segmentForCol(col, anchors);
  if (!segment) return bounds.boundaryCols;
  if (segment.kind === 'between') {
    return [anchors[segment.i].col, anchors[segment.i + 1].col];
  }
  if (segment.kind === 'outside-left') return [anchors[0].col];
  return [anchors[anchors.length - 1].col];
}

/** @returns {boolean} */
export function monotonicRankAllowed(col, rankSum) {
  if (rankSum === 0) return true;
  const bounds = boundsFromRow(col);
  if (!bounds) return true;

  const segment = segmentForCol(col, bounds.anchors);
  if (!segment) return true;

  const allowed = allowedRanksForSegment(segment, bounds.anchors);
  return rankInSet(rankSum, allowed);
}

/** Span endpoints for flash when segment col unknown. */
export function monotonicBoundaryCols() {
  return boundsFromRow()?.boundaryCols ?? [];
}
