import { state } from './state.js';

/** Rows Z→X→Y→W; cols suit-only→2–12→A (same layout as Square v1 game-over). */
export const DISCOVERY_GRID_SUITS = ['Z', 'X', 'Y', 'W'];
const DISCOVERY_GRID_RANK_COLS = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'aj', 'aa', 'ab'];

export function tileDiscoveryKey(tile) {
  return `${tile.suit}:${tile.rank}`;
}

export function discoveryGridColumn(rank) {
  if (rank === '' || rank === 'gg') return 0;
  if (rank === 'A') return 12;
  const i = DISCOVERY_GRID_RANK_COLS.indexOf(rank);
  return i >= 0 ? i + 1 : -1;
}

export function discoveryGridRow(suit) {
  const i = DISCOVERY_GRID_SUITS.indexOf(suit);
  return i >= 0 ? i : -1;
}

export function discoveryGridCell(tile) {
  const row = discoveryGridRow(tile.suit);
  const col = discoveryGridColumn(tile.rank);
  if (row < 0 || col < 0) return null;
  return { row, col };
}

/** 4×13 grid of tile snapshots (null = empty cell). Later discoveries overwrite same cell. */
export function buildDiscoveryGrid(tiles) {
  const grid = Array.from({ length: 4 }, () => Array(13).fill(null));
  for (const tile of tiles) {
    const cell = discoveryGridCell(tile);
    if (!cell) continue;
    grid[cell.row][cell.col] = tile;
  }
  return grid;
}

export function recordTileDiscovery(tile) {
  const key = tileDiscoveryKey(tile);
  if (state.discoveredKeys.has(key)) return;
  state.discoveredKeys.add(key);
  state.discoveredTiles.push({
    suit: tile.suit,
    rank: tile.rank,
    rankSum: tile.rankSum,
  });
}
