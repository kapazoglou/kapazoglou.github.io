import { state } from './state.js';
import { settings } from './settings.js';
import { getDominoPairIndex, returnKeyToPool, tickDominoDeckBy } from './domino-roll.js';

export function isDominoSpotsActive() {
  return settings.dominoRoll && settings.dominoSpots;
}

/** @param {string[]} keys */
export function setDominoOfferedKeys(keys) {
  if (!isDominoSpotsActive()) return;
  state.dominoOfferedKeys = [...keys];
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
  state.dominoSpotCols = [];
}

export function clearDominoSpotsRollState() {
  state.dominoOfferedKeys = [];
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
  state.dominoSpotCols = [];
}

export function clearAllDominoSpotBindings() {
  for (const column of Object.values(state.row)) {
    if (column.dominoKey) delete column.dominoKey;
  }
  clearDominoSpotsRollState();
}

/** @param {number} dieId */
function syncUsedUnusedFromDie(dieId) {
  const offered = state.dominoOfferedKeys;
  if (!offered.length) return;

  if (settings.nRoll === 4 && state.dominoPairGroups) {
    const idx = getDominoPairIndex(dieId);
    if (idx == null) return;
    state.dominoUsedKey = offered[idx];
    state.dominoUnusedKey = offered.length > 1 ? offered[idx === 0 ? 1 : 0] : null;
  } else {
    state.dominoUsedKey = offered[0];
    state.dominoUnusedKey = null;
  }
}

/** @param {number} spotIndex @returns {string | null} */
function spotKeyForIndex(spotIndex) {
  if (spotIndex === 0) return state.dominoUsedKey;
  if (spotIndex === 1) return state.dominoUnusedKey;
  return null;
}

/** @param {number} col @param {string | null} key */
function bindKeyToColumn(col, key) {
  if (!key) return;
  const column = state.row[col];
  if (!column) return;
  column.dominoKey = key;
}

/** @param {number} dieId @param {number} col */
function registerNewSpotCol(dieId, col) {
  syncUsedUnusedFromDie(dieId);
  state.dominoSpotCols.push(col);
  const spotIndex = state.dominoSpotCols.length - 1;
  bindKeyToColumn(col, spotKeyForIndex(spotIndex));
}

/** @param {number} dieId @param {number} col */
export function onTrayDiePlaced(dieId, col) {
  if (!isDominoSpotsActive()) return;
  if (state.dominoSpotCols.includes(col)) {
    syncUsedUnusedFromDie(dieId);
    return;
  }
  registerNewSpotCol(dieId, col);
}

/** @param {number} fromCol @param {number} toCol @param {number} dieId */
export function onSpotColReposition(fromCol, toCol, dieId) {
  if (!isDominoSpotsActive()) return;
  syncUsedUnusedFromDie(dieId);

  const idx = state.dominoSpotCols.indexOf(fromCol);
  if (idx !== -1) {
    state.dominoSpotCols[idx] = toCol;
    bindKeyToColumn(toCol, spotKeyForIndex(idx));
    return;
  }

  if (!state.dominoSpotCols.includes(toCol)) {
    registerNewSpotCol(dieId, toCol);
  }
}

/** @param {number} col @param {string | null | undefined} boundKey */
export function onColumnVacated(col, boundKey = undefined) {
  if (!isDominoSpotsActive()) return;

  const idx = state.dominoSpotCols.indexOf(col);
  if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

  if (boundKey) returnKeyToPool(boundKey);

  if (state.dominoSpotCols.length === 0) {
    state.dominoUsedKey = null;
    state.dominoUnusedKey = null;
  }
}

/** @param {Set<number>} placedDieIds */
function resolveUsedUnusedFromPlaced(placedDieIds) {
  if (settings.nRoll === 4 && state.dominoPairGroups) {
    const placed0 = state.dominoPairGroups[0].some(id => placedDieIds.has(id));
    const placed1 = state.dominoPairGroups[1].some(id => placedDieIds.has(id));
    if (placed0 && !placed1) syncUsedUnusedFromDie(state.dominoPairGroups[0][0]);
    else if (placed1 && !placed0) syncUsedUnusedFromDie(state.dominoPairGroups[1][0]);
    else if (placed0) syncUsedUnusedFromDie(state.dominoPairGroups[0][0]);
  } else if (placedDieIds.size > 0) {
    syncUsedUnusedFromDie(placedDieIds.values().next().value);
  }
}

function boundOfferKeysThisTurn() {
  const keys = new Set();
  for (const col of state.dominoSpotCols) {
    const key = state.row[col]?.dominoKey;
    if (key) keys.add(key);
  }
  return keys;
}

/** @param {Set<number>} placedDieIds */
export function settleDominoSpotsOnConfirm(placedDieIds) {
  if (!isDominoSpotsActive()) return;

  const offered = state.dominoOfferedKeys;
  if (!offered.length) return;

  if (!state.dominoUsedKey && placedDieIds.size > 0) {
    resolveUsedUnusedFromPlaced(placedDieIds);
  }

  const spotCount = state.dominoSpotCols.length;
  tickDominoDeckBy(spotCount);

  const bound = boundOfferKeysThisTurn();
  for (const key of offered) {
    if (!bound.has(key)) returnKeyToPool(key);
  }

  clearDominoSpotsRollState();
}

/** @param {number[]} cols */
export function releaseDominoKeysForCols(cols) {
  if (!isDominoSpotsActive()) return;

  for (const col of cols) {
    const column = state.row[col];
    if (!column?.dominoKey) continue;
    returnKeyToPool(column.dominoKey);
    delete column.dominoKey;
  }
}

/** @param {number} spotIndex @returns {string | null} */
export function getDominoSpotKey(spotIndex) {
  if (!isDominoSpotsActive()) return null;
  if (spotIndex === 0) return state.dominoUsedKey;
  if (spotIndex === 1) return state.dominoUnusedKey;
  return null;
}

/** @param {number} col @returns {string | null} */
export function getDominoKeyForCol(col) {
  const column = state.row[col];
  return column?.dominoKey ?? null;
}

/** @param {number} dieId @returns {boolean} */
export function isDieFromUsedDomino(dieId) {
  if (!isDominoSpotsActive()) return false;

  if (state.dominoUsedKey) {
    if (settings.nRoll === 4 && state.dominoPairGroups) {
      const idx = getDominoPairIndex(dieId);
      return idx != null && state.dominoOfferedKeys[idx] === state.dominoUsedKey;
    }
    return state.dominoOfferedKeys.length === 1;
  }

  if (settings.nRoll === 4) return getDominoPairIndex(dieId) != null;
  return state.dominoOfferedKeys.length === 1
    && (state.actionBar.includes(dieId) || state.placedDieIds.has(dieId));
}

/** @param {number} dieId @returns {string | null} */
export function getDominoKeyForDie(dieId) {
  if (!isDieFromUsedDomino(dieId)) return null;
  if (state.dominoUsedKey) return state.dominoUsedKey;
  if (settings.nRoll === 4) {
    const idx = getDominoPairIndex(dieId);
    return idx != null ? state.dominoOfferedKeys[idx] ?? null : null;
  }
  return state.dominoOfferedKeys[0] ?? null;
}

export function countDominoSpotsCreated() {
  return state.dominoSpotCols.length;
}
