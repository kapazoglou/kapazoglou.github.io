import { state } from './state.js';
import { settings } from './settings.js';
import { JOKER_RANK } from './dice-visual.js';

/** Partner rank at/above 12 — ace pair wraps toward low ranks outward. */
const ACE_HIGH_PARTNER = 12;
/** Partner rank 2 — ace pair wraps toward high ranks (13+) both outward sides. */
const ACE_LOW_PARTNER_EDGE = 2;

function aceLeftOutwardLeft(partner, rankSum) {
  if (partner >= ACE_HIGH_PARTNER) return rankSum <= 1;
  if (partner === ACE_LOW_PARTNER_EDGE) return rankSum >= 13;
  return rankSum < 13;
}

function aceLeftOutwardRight(partner, rankSum) {
  if (partner >= ACE_HIGH_PARTNER) return rankSum < partner;
  if (partner === ACE_LOW_PARTNER_EDGE) return rankSum >= 13;
  return rankSum > partner;
}

function aceRightOutwardLeft(partner, rankSum) {
  if (partner >= ACE_HIGH_PARTNER) return rankSum < partner;
  if (partner === ACE_LOW_PARTNER_EDGE) return rankSum >= 13;
  return rankSum > partner;
}

function aceRightOutwardRight(partner, rankSum) {
  if (partner >= ACE_HIGH_PARTNER) return rankSum <= 1;
  if (partner === ACE_LOW_PARTNER_EDGE) return rankSum >= 13;
  return rankSum < 13;
}

export function monotonicEnabled() {
  return settings.monotonic && settings.diceAndCubes;
}

/** @returns {{ col: number, rankSum: number }[]} */
export function getQualifyingAnchorTiles() {
  if (!monotonicEnabled()) return [];
  const anchors = [];
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind !== 'tile') continue;
    if (column.rank === JOKER_RANK) continue;
    anchors.push({ col: Number(colKey), rankSum: column.rankSum });
  }
  return anchors.sort((a, b) => a.col - b.col);
}

function isAce(rankSum) {
  return rankSum === 1;
}

function anchorAtCol(anchors, col) {
  return anchors.find(a => a.col === col) ?? null;
}

/** Between-zone bounds — ace counts as rank 1 only (no dual expansion). */
function betweenRankBounds(anchors) {
  const sums = anchors.map(a => a.rankSum);
  return { rLow: Math.min(...sums), rHigh: Math.max(...sums) };
}

/** @returns {{ leftCol: number, rightCol: number, rLow: number, rHigh: number, boundaryCols: number[], anchors: { col: number, rankSum: number }[] } | null} */
export function boundsFromRow() {
  const anchors = getQualifyingAnchorTiles();
  if (anchors.length < 2) return null;
  const cols = anchors.map(a => a.col);
  const leftCol = Math.min(...cols);
  const rightCol = Math.max(...cols);
  const { rLow, rHigh } = betweenRankBounds(anchors);
  return {
    leftCol,
    rightCol,
    rLow,
    rHigh,
    boundaryCols: leftCol === rightCol ? [leftCol] : [leftCol, rightCol],
    anchors,
  };
}

export function monotonicActive() {
  return boundsFromRow() != null;
}

/**
 * Ace at boundary: partner ≥12 low wrap; partner ===2 high wrap (13+); partner 3–11 ascending
 * (left of ace <13, between 1..R, right of R >R). Non-ace pairs: ascending left→right.
 */
export function monotonicRankAllowed(col, rankSum) {
  if (rankSum === 0) return true;
  const bounds = boundsFromRow();
  if (!bounds) return true;

  const { leftCol, rightCol, rLow, rHigh, anchors } = bounds;
  const leftAnchor = anchorAtCol(anchors, leftCol);
  const rightAnchor = anchorAtCol(anchors, rightCol);

  if (col > leftCol && col < rightCol) {
    return rankSum >= rLow && rankSum <= rHigh;
  }

  if (leftAnchor && isAce(leftAnchor.rankSum)) {
    const partner = rightAnchor.rankSum;
    if (col < leftCol) return aceLeftOutwardLeft(partner, rankSum);
    if (col > rightCol) return aceLeftOutwardRight(partner, rankSum);
  }

  if (rightAnchor && isAce(rightAnchor.rankSum)) {
    const partner = leftAnchor.rankSum;
    if (col < leftCol) return aceRightOutwardLeft(partner, rankSum);
    if (col > rightCol) return aceRightOutwardRight(partner, rankSum);
  }

  if (col < leftCol) return rankSum <= rLow;
  if (col > rightCol) return rankSum >= rHigh;
  return true;
}

/** Boundary anchor cols for flash feedback. */
export function monotonicBoundaryCols() {
  return boundsFromRow()?.boundaryCols ?? [];
}
