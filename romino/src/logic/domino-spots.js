import { state } from './state.js';
import { settings } from './settings.js';
import {
  getDominoPairIndex,
  returnKeyToPool,
  discardDominoKey,
  getDominoEngagedPairIndex,
  setCurrentRollOfferedKeys,
  syncDominoDeckCount,
} from './domino-roll.js';

export function isDominoSpotsActive() {
  return settings.dominoRoll && settings.dominoSpots;
}

/** @param {string[]} keys */
export function setDominoOfferedKeys(keys) {
  if (!isDominoSpotsActive()) return;
  setCurrentRollOfferedKeys(keys);
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
}

export function clearDominoSpotsRollState() {
  state.dominoOfferedKeys = [];
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
  state.dominoSpotCols = [];
  state.dominoSpotsCreatedThisTurn = [];
  state.newDominoSpotCols.clear();
}

function clearDominoSpotsOfferState() {
  state.dominoOfferedKeys = [];
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
  state.dominoSpotsCreatedThisTurn = [];
}

export function clearAllDominoSpotBindings() {
  for (const column of Object.values(state.row)) {
    if (column.dominoKey) delete column.dominoKey;
  }
  state.dominoSpotKeys = {};
  clearDominoSpotsRollState();
}

/** @param {number} dieId @returns {boolean} */
function syncUsedUnusedFromDie(dieId) {
  const offered = state.dominoOfferedKeys;
  if (!offered.length) return false;

  if (settings.nRoll === 4 && state.dominoPairGroups) {
    const idx = getDominoPairIndex(dieId);
    if (idx == null) return false;
    state.dominoUsedKey = offered[idx];
    state.dominoUnusedKey = offered.length > 1 ? offered[idx === 0 ? 1 : 0] : null;
  } else {
    state.dominoUsedKey = offered[0];
    state.dominoUnusedKey = null;
  }
  return true;
}

/** @returns {boolean} */
function syncUsedUnusedFromEngagedPair() {
  const offered = state.dominoOfferedKeys;
  if (!offered.length) return false;

  if (settings.nRoll === 4 && state.dominoPairGroups) {
    const idx = getDominoEngagedPairIndex();
    if (idx == null) return false;
    state.dominoUsedKey = offered[idx];
    state.dominoUnusedKey = offered.length > 1 ? offered[idx === 0 ? 1 : 0] : null;
  } else {
    state.dominoUsedKey = offered[0];
    state.dominoUnusedKey = null;
  }
  return true;
}

function rebindThisTurnSpotDominoKeys() {
  for (let i = 0; i < state.dominoSpotsCreatedThisTurn.length; i++) {
    const col = state.dominoSpotsCreatedThisTurn[i];
    if (getDominoKeyForCol(col)) continue;
    bindKeyToColumn(col, spotKeyForIndex(i));
  }
}

/** Rebind this-turn spot cols to engaged pair (spot 1 = used, spot 2 = unused). */
export function syncDominoSpotKeysFromEngagement() {
  if (!isDominoSpotsActive() || !state.dominoSpotsCreatedThisTurn.length) return false;
  if (!syncUsedUnusedFromEngagedPair()) return false;

  const before = state.dominoSpotCols
    .map(col => `${col}:${getDominoKeyForCol(col) ?? ''}`)
    .join('|');
  rebindThisTurnSpotDominoKeys();
  const after = state.dominoSpotCols
    .map(col => `${col}:${getDominoKeyForCol(col) ?? ''}`)
    .join('|');
  return before !== after;
}

/** @param {number} spotIndex @returns {string | null} */
function spotKeyForIndex(spotIndex) {
  if (spotIndex === 0) return state.dominoUsedKey;
  if (spotIndex === 1) return state.dominoUnusedKey;
  return null;
}

/** @param {number} col @param {string | null} key */
function bindKeyToColumn(col, key) {
  if (!key || state.dominoSpotKeys[col]) return;
  state.dominoSpotKeys[col] = key;
  const column = state.row[col];
  if (column) column.dominoKey = key;
}

/** @param {number} fromCol @param {number} toCol @param {string | null} key */
function moveDominoSpotKey(fromCol, toCol, key) {
  if (!key) return;
  if (fromCol !== toCol) delete state.dominoSpotKeys[fromCol];
  if (state.dominoSpotKeys[toCol]) return;
  state.dominoSpotKeys[toCol] = key;
  const column = state.row[toCol];
  if (column) column.dominoKey = key;
}

/** @param {number} fromCol @param {number} delta */
function shiftDominoSpotKeys(fromCol, delta) {
  if (!delta) return;
  const remapped = {};
  for (const [colStr, key] of Object.entries(state.dominoSpotKeys)) {
    const col = Number(colStr);
    remapped[col >= fromCol ? col + delta : col] = key;
  }
  state.dominoSpotKeys = remapped;
}

/** @param {number} dieId @param {number} col */
function registerNewSpotCol(dieId, col) {
  if (!state.dominoSpotCols.includes(col)) state.dominoSpotCols.push(col);
  state.newDominoSpotCols.add(col);
  state.dominoSpotsCreatedThisTurn.push(col);
  if (!syncUsedUnusedFromEngagedPair()) syncUsedUnusedFromDie(dieId);
  rebindThisTurnSpotDominoKeys();
}

/** @param {number} dieId @param {number} col */
export function onTrayDiePlaced(dieId, col) {
  if (!isDominoSpotsActive()) return;
  if (state.dominoSpotCols.includes(col)) return;
  registerNewSpotCol(dieId, col);
}

/** Remap spot col indices when row columns shift for gap insert. */
export function shiftDominoSpotCols(fromCol, delta) {
  if (!isDominoSpotsActive() || !delta) return;

  shiftDominoSpotKeys(fromCol, delta);
  state.dominoSpotCols = state.dominoSpotCols.map(col => (col >= fromCol ? col + delta : col));
  state.dominoSpotsCreatedThisTurn = state.dominoSpotsCreatedThisTurn.map(col =>
    (col >= fromCol ? col + delta : col),
  );

  const remapped = new Set();
  for (const col of state.newDominoSpotCols) {
    remapped.add(col >= fromCol ? col + delta : col);
  }
  state.newDominoSpotCols = remapped;
}

/** @param {number} fromCol @param {number} toCol @param {number} dieId @param {string | null} preservedKey */
export function onSpotColReposition(fromCol, toCol, dieId, preservedKey = null) {
  if (!isDominoSpotsActive()) return;
  if (!syncUsedUnusedFromEngagedPair()) syncUsedUnusedFromDie(dieId);

  const idx = state.dominoSpotCols.indexOf(fromCol);
  if (idx !== -1) {
    const key = preservedKey ?? getDominoKeyForCol(fromCol);
    if (state.dominoSpotCols.includes(toCol)) {
      state.dominoSpotCols.splice(idx, 1);
      const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(fromCol);
      if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);
    } else {
      state.dominoSpotCols[idx] = toCol;
      state.newDominoSpotCols.add(toCol);
      const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(fromCol);
      if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn[turnIdx] = toCol;
    }
    moveDominoSpotKey(fromCol, toCol, key);
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

  const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(col);
  if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);

  delete state.dominoSpotKeys[col];

  if (boundKey) {
    const offerIdx = state.dominoOfferedKeys.indexOf(boundKey);
    if (offerIdx !== -1) state.dominoOfferedKeys.splice(offerIdx, 1);
    returnKeyToPool(boundKey);
  }

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
  for (const col of state.dominoSpotsCreatedThisTurn) {
    const key = getDominoKeyForCol(col);
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

  const bound = boundOfferKeysThisTurn();
  for (const key of offered) {
    if (!bound.has(key)) discardDominoKey(key);
  }

  clearDominoSpotsOfferState();
  syncDominoDeckCount();
}

/** @param {number[]} cols */
export function releaseDominoKeysForCols(cols) {
  if (!isDominoSpotsActive()) return;

  for (const col of cols) {
    const key = getDominoKeyForCol(col);
    if (!key) continue;
    discardDominoKey(key);
    delete state.dominoSpotKeys[col];

    const column = state.row[col];
    if (column?.dominoKey) delete column.dominoKey;

    const idx = state.dominoSpotCols.indexOf(col);
    if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

    const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(col);
    if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);
  }
}

/** Active spot columns that still have a bound domino key. */
export function getActiveDominoSpotCols() {
  if (!isDominoSpotsActive()) return [];
  return state.dominoSpotCols.filter(col => getDominoKeyForCol(col) != null);
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
  let key = state.dominoSpotKeys[col] ?? null;
  if (!key) {
    key = state.row[col]?.dominoKey ?? null;
    if (key) state.dominoSpotKeys[col] = key;
  }
  const column = state.row[col];
  if (key && column && column.dominoKey !== key) column.dominoKey = key;
  return key;
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
  return state.dominoSpotsCreatedThisTurn.length;
}
