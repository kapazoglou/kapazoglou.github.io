import { state } from './state.js';
import { settings } from './settings.js';
import {
  getDominoPairIndex,
  discardDominoKey,
  drawDominoKeyFromPool,
  returnKeyToPool,
  getDominoEngagedPairIndex,
  setCurrentRollOfferedKeys,
  syncDominoDeckCount,
  reshuffleDominoPoolAtSweep,
} from './domino-roll.js';

export function isDominoSpotsActive() {
  return settings.dominoRoll && settings.dominoSpots;
}

/** Row columns that must carry a seam domino while they exist. */
export function getRowDominoSpotCols() {
  if (!isDominoSpotsActive()) return [];
  return Object.keys(state.row).map(Number).sort((a, b) => a - b);
}

/** @deprecated alias — all live row cols, not filtered by key presence */
export function getActiveDominoSpotCols() {
  return getRowDominoSpotCols();
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

function pruneStaleDominoSpotCols() {
  const live = new Set(getRowDominoSpotCols());
  state.dominoSpotCols = state.dominoSpotCols.filter(col => live.has(col));
  state.dominoSpotsCreatedThisTurn = state.dominoSpotsCreatedThisTurn.filter(col => live.has(col));
}

/** @param {number} col @returns {boolean} */
function bindDominoSpotFromPool(col) {
  if (getDominoKeyForCol(col)) return true;
  const key = drawDominoKeyFromPool();
  if (!key) return false;
  state.dominoSpotKeys[col] = key;
  const column = state.row[col];
  if (column) column.dominoKey = key;
  if (!state.dominoSpotCols.includes(col)) state.dominoSpotCols.push(col);
  state.newDominoSpotCols.add(col);
  return true;
}

/** Assign a pool key to a live row column; false when the pool is empty. */
export function ensureDominoSpotForCol(col) {
  if (!isDominoSpotsActive()) return true;
  if (!state.row[col]) return true;
  return bindDominoSpotFromPool(col);
}

/** Every row column must have a bound domino key. @returns {boolean} */
export function syncAllRowDominoSpots() {
  if (!isDominoSpotsActive()) return true;
  for (const col of getRowDominoSpotCols()) {
    if (!ensureDominoSpotForCol(col)) return false;
  }
  pruneStaleDominoSpotCols();
  return true;
}

/** @returns {string|null} */
export function dominoSpotAssignmentGameOverReason() {
  if (!isDominoSpotsActive()) return null;
  for (const col of getRowDominoSpotCols()) {
    if (!getDominoKeyForCol(col)) return 'domino pool exhausted';
  }
  return null;
}

/** One random pool key per starting-dice column; persistent until sweep. */
export function seedStartingDominoSpots() {
  if (!isDominoSpotsActive() || settings.startingDice <= 0) return true;
  return syncAllRowDominoSpots();
}

/** @deprecated — pool assignment is unified; kept for call-site compat */
export function maybeAssignBuggerDominoSpot(col) {
  return ensureDominoSpotForCol(col);
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

/** Ensure row cols have keys — no offer rebinding (prevents render flash). */
export function syncDominoSpotKeysFromEngagement() {
  if (!isDominoSpotsActive()) return false;
  syncAllRowDominoSpots();
  return false;
}

function removeSpotColFromTurn(fromCol) {
  const idx = state.dominoSpotCols.indexOf(fromCol);
  if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

  const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(fromCol);
  if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);

  delete state.dominoSpotKeys[fromCol];
}

/** @param {number} fromCol @param {number} toCol @param {string | null} key */
function moveDominoSpotKey(fromCol, toCol, key) {
  if (!key) return;
  if (fromCol !== toCol) delete state.dominoSpotKeys[fromCol];
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
  if (!state.dominoSpotsCreatedThisTurn.includes(col)) {
    state.dominoSpotsCreatedThisTurn.push(col);
  }
  if (!syncUsedUnusedFromEngagedPair()) syncUsedUnusedFromDie(dieId);
}

/** @param {number} dieId @param {number} col */
export function onTrayDiePlaced(dieId, col) {
  if (!isDominoSpotsActive()) return;
  registerNewSpotCol(dieId, col);
  ensureDominoSpotForCol(col);
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
      removeSpotColFromTurn(fromCol);
      if (key) returnKeyToPool(key);
    } else {
      state.dominoSpotCols[idx] = toCol;
      state.newDominoSpotCols.add(toCol);
      const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(fromCol);
      if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn[turnIdx] = toCol;
      moveDominoSpotKey(fromCol, toCol, key);
    }
    ensureDominoSpotForCol(toCol);
    return;
  }

  if (!state.dominoSpotCols.includes(toCol)) {
    registerNewSpotCol(dieId, toCol);
  }
  ensureDominoSpotForCol(toCol);
}

/** Clear used/unused when this roll's spot allocation is fully undone. */
function resetDominoSpotAllocationIfIdle() {
  if (state.dominoSpotsCreatedThisTurn.length > 0) return;
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
}

/** @param {number} col @param {string | null | undefined} boundKey */
export function onColumnVacated(col, boundKey = undefined) {
  if (!isDominoSpotsActive()) return;

  const key = boundKey ?? getDominoKeyForCol(col);
  if (key) returnKeyToPool(key);

  const idx = state.dominoSpotCols.indexOf(col);
  if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

  const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(col);
  if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);

  delete state.dominoSpotKeys[col];
  const column = state.row[col];
  if (column?.dominoKey) delete column.dominoKey;

  resetDominoSpotAllocationIfIdle();
}

/** @param {Set<number>} placedDieIds */
export function settleDominoSpotsOnConfirm(placedDieIds) {
  if (!isDominoSpotsActive()) return;

  const offered = state.dominoOfferedKeys;
  if (!offered.length) return;

  if (!state.dominoUsedKey && placedDieIds.size > 0) {
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

  for (const key of offered) discardDominoKey(key);

  clearDominoSpotsOfferState();
  syncDominoDeckCount();
}

/** @param {number[]} cols */
export function releaseDominoKeysForCols(cols) {
  if (!isDominoSpotsActive() || !cols.length) return;

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

  reshuffleDominoPoolAtSweep();
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
