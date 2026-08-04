import { state } from './state.js';
import { settings } from './settings.js';
import { JOKER_RANK, rankGlyphFromSum } from './dice-visual.js';
import { tileKey } from './tile-deck.js';

const SUITS = ['Z', 'X', 'Y', 'W'];
const PAIRS_EVEN = [[1, 7], [3, 9], [5, 11]];
const PAIRS_ODD = [[2, 8], [4, 10], [6, 12]];
const JOKER_CUBE = 'J';

function buildCubeTiles(pairs, omitIndex) {
  const remaining = SUITS.filter((_, i) => i !== omitIndex);
  const tiles = [];
  for (let k = 0; k < 3; k++) {
    const suit = remaining[(k + omitIndex) % 3];
    for (const rankSum of pairs[k]) {
      tiles.push({ suit, rank: rankGlyphFromSum(rankSum) });
    }
  }
  return tiles;
}

function buildCubeMap() {
  const map = new Map();
  for (let o = 0; o < 4; o++) {
    for (const tile of buildCubeTiles(PAIRS_EVEN, o)) {
      map.set(tileKey(tile), `E${o}`);
    }
    for (const tile of buildCubeTiles(PAIRS_ODD, o)) {
      map.set(tileKey(tile), `O${o}`);
    }
  }
  for (const suit of SUITS) {
    map.set(tileKey({ suit, rank: JOKER_RANK }), JOKER_CUBE);
  }
  return map;
}

const TILE_TO_CUBE = buildCubeMap();

/** 0 = off, 1 = one cube set, 2 = two identical cube sets (capacity per cube). */
export function nineCubesActive() {
  return settings.nineCubes > 0;
}

/** Max converted row tiles allowed per cube before blocking (equals setting value). */
export function nineCubesCapacity() {
  return settings.nineCubes;
}

/** @returns {'E0'|'E1'|'E2'|'E3'|'O0'|'O1'|'O2'|'O3'|'J'|null} */
export function cubeIdForIdentity(suit, rank) {
  return TILE_TO_CUBE.get(`${suit}:${rank}`) ?? null;
}

/** Row cols of converted tiles in this cube (sorted). */
export function getRowColsInCube(cubeId, excludeCol = null) {
  if (!cubeId) return [];
  const cols = [];
  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (col === excludeCol) continue;
    if (column.kind !== 'tile') continue;
    if (cubeIdForIdentity(column.suit, column.rank) === cubeId) cols.push(col);
  }
  return cols.sort((a, b) => a - b);
}

/** Row col of a converted tile locking this cube, or null. */
export function getRowTileLockingCube(cubeId, excludeCol = null) {
  return getRowColsInCube(cubeId, excludeCol)[0] ?? null;
}

export function isCubeLockedForIdentity(suit, rank, excludeCol = null) {
  if (!nineCubesActive()) return false;
  const cubeId = cubeIdForIdentity(suit, rank);
  if (!cubeId) return false;
  return getRowColsInCube(cubeId, excludeCol).length >= nineCubesCapacity();
}

/** Col of a row tile to flash when cube capacity is full. */
export function getCubeLockColForBlockedAttempt(suit, rank, excludeCol = null) {
  if (!nineCubesActive()) return null;
  const cubeId = cubeIdForIdentity(suit, rank);
  if (!cubeId) return null;
  const cols = getRowColsInCube(cubeId, excludeCol);
  if (cols.length < nineCubesCapacity()) return null;
  return cols[0];
}
