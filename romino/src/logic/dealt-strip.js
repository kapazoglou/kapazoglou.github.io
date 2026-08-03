import { state } from './state.js';
import { JOKER_RANK } from './dice-visual.js';
import { releaseDominoKeysForCols } from './domino-spots.js';
import { releaseWithheldDice } from './convert.js';

/** Sort key: A=1, ranks 2–12, *=14 (highest). */
export function stripTileSortKey(tile) {
  if (tile.rank === JOKER_RANK || tile.rankSum === 0) return 14;
  if (tile.rank === 'A' || tile.rankSum === 1) return 1;
  if (tile.rankSum >= 2 && tile.rankSum <= 12) return tile.rankSum;
  return 13;
}

const SUIT_ORDER = { Z: 0, X: 1, Y: 2, W: 3 };

export function compareStripTiles(a, b) {
  const rankDiff = stripTileSortKey(a) - stripTileSortKey(b);
  if (rankDiff !== 0) return rankDiff;
  const suitDiff = (SUIT_ORDER[a.suit] ?? 99) - (SUIT_ORDER[b.suit] ?? 99);
  if (suitDiff !== 0) return suitDiff;
  return a.stripId - b.stripId;
}

/** Strip tiles sorted A (low) → * (high). */
export function sortedDealtStrip() {
  return state.dealtStrip.slice().sort(compareStripTiles);
}

export function appendDealtStripTile(tile) {
  const stripId = state.nextDealtStripId++;
  const entry = {
    suit: tile.suit,
    rank: tile.rank,
    rankSum: tile.rankSum,
    bottomValue: tile.bottomValue,
    stripId,
  };
  state.dealtStrip.push(entry);
  state.newDealtStripIds.add(stripId);
  return entry;
}

export function clearDealtStrip() {
  state.dealtStrip = [];
  state.newDealtStripIds.clear();
  state.dealtStripWarningIds.clear();
}

export function isIdentityInStrip(suit, rank) {
  return state.dealtStrip.some(t => t.suit === suit && t.rank === rank);
}

export function getStripTileForIdentity(suit, rank) {
  return state.dealtStrip.find(t => t.suit === suit && t.rank === rank) ?? null;
}

export function getRowColForIdentity(suit, rank) {
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind === 'tile' && column.suit === suit && column.rank === rank) {
      return Number(colKey);
    }
  }
  return null;
}

export function stripTileHasRowDuplicate(stripId) {
  const tile = state.dealtStrip.find(t => t.stripId === stripId);
  if (!tile) return false;
  return getRowColForIdentity(tile.suit, tile.rank) != null;
}

export function identityBlockedByStripOrRow(suit, rank, excludeCol = null) {
  if (isIdentityInStrip(suit, rank)) return true;
  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (col === excludeCol) continue;
    if (column.kind === 'tile' && column.suit === suit && column.rank === rank) return true;
  }
  return false;
}

/**
 * Remove strip tile + matching row column (accent pair-sweep). No scoring.
 * @returns {{ rowCol: number, tile: object, stripId: number } | null}
 */
export function pairSweepStripTile(stripId) {
  if (!stripTileHasRowDuplicate(stripId)) return null;

  const idx = state.dealtStrip.findIndex(t => t.stripId === stripId);
  if (idx === -1) return null;

  const [stripTile] = state.dealtStrip.splice(idx, 1);
  state.dealtStripWarningIds.delete(stripId);

  const rowCol = getRowColForIdentity(stripTile.suit, stripTile.rank);
  if (rowCol == null) return null;

  const column = state.row[rowCol];
  if (!column || column.kind !== 'tile') return null;

  const tile = {
    suit: column.suit,
    rank: column.rank,
    rankSum: column.rankSum,
    bottomValue: column.bottomValue,
  };
  releaseDominoKeysForCols([rowCol]);
  releaseWithheldDice(1);
  delete state.row[rowCol];
  if (Object.keys(state.row).length === 0) state.hasPlacedFirstDie = false;
  state.rowTileWarningCols.delete(rowCol);

  return { rowCol, tile, stripId };
}
