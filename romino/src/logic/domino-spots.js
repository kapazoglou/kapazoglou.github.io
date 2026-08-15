import { state } from './state.js';
import { settings } from './settings.js';
import { isLoneBuggerOuterCol } from './star-powers.js';
import {
  getDominoPairIndex,
  discardDominoKey,
  drawDominoKeyFromPool,
  returnKeyToPool,
  getDominoEngagedPairIndex,
  setCurrentRollOfferedKeys,
  syncDominoDeckCount,
  canDrawDominoKeyFromPool,
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
  state.dominoStarRerollUsedKey = null;
}

export function clearDominoSpotsRollState() {
  state.dominoOfferedKeys = [];
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
  state.dominoStarRerollUsedKey = null;
  state.dominoSpotCols = [];
  state.dominoSpotsCreatedThisTurn = [];
  state.dominoColVacatedSlot = {};
  state.newDominoSpotCols.clear();
}

function clearDominoSpotsOfferState() {
  state.dominoOfferedKeys = [];
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
  state.dominoStarRerollUsedKey = null;
  state.dominoSpotsCreatedThisTurn = [];
}

export function clearAllDominoSpotBindings() {
  for (const column of Object.values(state.row)) {
    if (column.dominoKey) delete column.dominoKey;
  }
  state.dominoSpotKeys = {};
  state.startingDominoSpotCols = new Set();
  state.dominoColSpotSlot = {};
  state.dominoColVacatedSlot = {};
  clearDominoSpotsRollState();
}

function pruneStaleDominoSpotCols() {
  const live = new Set(getRowDominoSpotCols());
  state.dominoSpotCols = state.dominoSpotCols.filter(col => live.has(col));
  state.dominoSpotsCreatedThisTurn = state.dominoSpotsCreatedThisTurn.filter(col => live.has(col));
  for (const colStr of Object.keys(state.dominoColSpotSlot)) {
    if (!live.has(Number(colStr))) delete state.dominoColSpotSlot[colStr];
  }
}

/** @param {string} key @param {number} [exceptCol] */
function isKeyBoundToLiveCol(key, exceptCol = null) {
  for (const col of getRowDominoSpotCols()) {
    if (col === exceptCol) continue;
    if (getDominoKeyForCol(col) === key) return true;
  }
  return false;
}

/** Confirmed prior-turn column — domino key must not change from new dice interaction. */
function isSettledDominoSpotCol(col) {
  if (!state.row[col]) return false;
  if (state.dominoSpotsCreatedThisTurn.includes(col)) return false;
  const key = state.dominoSpotKeys[col] ?? state.row[col]?.dominoKey ?? null;
  return key != null;
}

function isThisTurnSpotCol(col) {
  return state.dominoSpotsCreatedThisTurn.includes(col);
}

/** @param {number} col @param {string} key @param {{ force?: boolean }} [opts] */
function setDominoKeyOnCol(col, key, opts = {}) {
  if (isSettledDominoSpotCol(col)) return;
  const existing = state.dominoSpotKeys[col] ?? state.row[col]?.dominoKey ?? null;
  if (existing && !opts.force) return;
  state.dominoSpotKeys[col] = key;
  const column = state.row[col];
  if (column) column.dominoKey = key;
  if (!state.dominoSpotCols.includes(col)) state.dominoSpotCols.push(col);
  state.newDominoSpotCols.add(col);
}

/** @param {number} col @param {0|1} spotIndex @param {{ force?: boolean }} [opts] @returns {boolean} */
function bindDominoSpotFromOffer(col, spotIndex, opts = {}) {
  if (isSettledDominoSpotCol(col)) return false;
  if (!opts.force && getDominoKeyForCol(col)) return true;
  const key = getDominoSpotKey(spotIndex);
  if (!key || (!opts.force && isKeyBoundToLiveCol(key, col))) return false;
  setDominoKeyOnCol(col, key, { force: Boolean(opts.force) });
  if (!isSettledDominoSpotCol(col)) state.dominoColSpotSlot[col] = spotIndex;
  return Boolean(getDominoKeyForCol(col));
}

function poolDrawNRoll() {
  return settings.nRoll === 1 ? 1 : settings.nRoll;
}

function isTurnPoolReserveKey(key) {
  if (!key) return false;
  if (state.dominoOfferedKeys.includes(key)) return false;
  if (key === state.dominoStarRerollUsedKey) return false;
  return true;
}

/** Pool reserve may live in dominoUnusedKey or still bound on a slot-1 column this turn. */
function syncPoolReserveFromLiveCols() {
  for (const col of getThisTurnSpotCols()) {
    if (state.dominoColSpotSlot[col] !== 1) continue;
    const key = getDominoKeyForCol(col);
    if (key && isTurnPoolReserveKey(key)) {
      state.dominoUnusedKey = key;
      return key;
    }
  }
  return null;
}

/** Turn spot 1: draw once, cache in dominoUnusedKey until confirm or full undo. */
function ensureTurnPoolDrawKey() {
  if (state.dominoUnusedKey) return state.dominoUnusedKey;
  const live = syncPoolReserveFromLiveCols();
  if (live) return live;
  const nRoll = poolDrawNRoll();
  if (!canDrawDominoKeyFromPool(nRoll)) return null;
  const key = drawDominoKeyFromPool(nRoll);
  if (key) state.dominoUnusedKey = key;
  return key;
}

/** Reserve spot-1 pool draw when spot 0 is claimed (nRoll 1/2/3). */
function reserveTurnPoolDraw() {
  if (settings.nRoll === 4) return null;
  return ensureTurnPoolDrawKey();
}

/** @param {number} col @returns {boolean} */
function bindDominoSpotFromPool(col) {
  if (isSettledDominoSpotCol(col)) return true;
  if (getDominoKeyForCol(col)) return true;

  let key;
  if (state.startingDominoSpotCols.has(col)) {
    const nRoll = poolDrawNRoll();
    if (!canDrawDominoKeyFromPool(nRoll)) return false;
    key = drawDominoKeyFromPool(nRoll);
  } else {
    key = ensureTurnPoolDrawKey();
  }
  if (!key) return false;

  setDominoKeyOnCol(col, key);
  if (!state.startingDominoSpotCols.has(col)) {
    state.dominoColSpotSlot[col] = 1;
  }
  return true;
}

/** @returns {0|1|null} */
function nextFreeOfferSpotIndex() {
  const assigned = new Set(
    getThisTurnSpotCols()
      .filter(c => state.dominoColSpotSlot[c] != null)
      .map(c => state.dominoColSpotSlot[c]),
  );
  if (!assigned.has(0)) return 0;
  if (!assigned.has(1) && (state.dominoUnusedKey || syncPoolReserveFromLiveCols())) return 1;
  return null;
}

/** @returns {boolean} */
function isSpotIndexLive(spotIndex) {
  return getThisTurnSpotCols().some(c => state.dominoColSpotSlot[c] === spotIndex);
}

/** Prefer the slot this column had before vacate; else next free slot. */
function resolveSpotIndexForCol(col) {
  const remembered = state.dominoColVacatedSlot[col];
  if (remembered != null) {
    delete state.dominoColVacatedSlot[col];
    if (!isSpotIndexLive(remembered)) return remembered;
  }
  return nextFreeOfferSpotIndex();
}

function getTurnAssignedDominoKeys() {
  const assigned = new Set();
  for (const col of getThisTurnSpotCols()) {
    if (state.dominoColSpotSlot[col] == null) continue;
    const key = getDominoKeyForCol(col);
    if (key) assigned.add(key);
  }
  return assigned;
}

/** @param {number} col */
function columnNeedsOfferDomino(col) {
  if (state.startingDominoSpotCols.has(col)) return false;
  return isLoneBuggerOuterCol(col);
}

/** Assign a domino key to a live row column. @returns {boolean} */
export function ensureDominoSpotForCol(col) {
  if (!isDominoSpotsActive()) return true;
  if (!state.row[col]) return true;
  if (isSettledDominoSpotCol(col)) return true;
  if (getDominoKeyForCol(col)) return true;

  if (state.startingDominoSpotCols.has(col)) {
    return bindDominoSpotFromPool(col);
  }

  const spotIndex = nextFreeOfferSpotIndex();
  if (spotIndex != null && columnNeedsOfferDomino(col)) {
    if (!state.dominoSpotsCreatedThisTurn.includes(col)) {
      state.dominoSpotsCreatedThisTurn.push(col);
    }
    return bindDominoSpotFromOffer(col, spotIndex);
  }

  return false;
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
  if (settings.dominoRoll && settings.nRoll === 1 && state.dominoHandKeys.length > 0) return null;
  for (const col of getRowDominoSpotCols()) {
    if (!getDominoKeyForCol(col)) return 'domino pool exhausted';
  }
  return null;
}

/** Pool-draw one key per starting-dice column; persistent until sweep. */
export function seedStartingDominoSpots() {
  if (!isDominoSpotsActive() || settings.startingDice <= 0) return true;
  state.startingDominoSpotCols = new Set(getRowDominoSpotCols());
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
  if (isSettledDominoSpotCol(fromCol)) return;
  const idx = state.dominoSpotCols.indexOf(fromCol);
  if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

  const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(fromCol);
  if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);

  delete state.dominoSpotKeys[fromCol];
  delete state.dominoColSpotSlot[fromCol];
}

/** @param {number} fromCol @param {number} toCol @param {string | null} key */
function moveDominoSpotKey(fromCol, toCol, key) {
  if (!key) return;
  if (isSettledDominoSpotCol(fromCol) || isSettledDominoSpotCol(toCol)) return;
  if (fromCol !== toCol) {
    delete state.dominoSpotKeys[fromCol];
    if (state.dominoColSpotSlot[fromCol] != null) {
      state.dominoColSpotSlot[toCol] = state.dominoColSpotSlot[fromCol];
      delete state.dominoColSpotSlot[fromCol];
    }
  }
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

  const remappedSlots = {};
  for (const [colStr, slot] of Object.entries(state.dominoColSpotSlot)) {
    const col = Number(colStr);
    remappedSlots[col >= fromCol ? col + delta : col] = slot;
  }
  state.dominoColSpotSlot = remappedSlots;
}

/** v1.15 — vacated used-slot promotes remaining unused-slot column to used (nRoll=4 offers only). */
function promoteUnusedSpotColToUsed() {
  if (!state.dominoUsedKey) return;
  if (settings.nRoll !== 4) return;
  for (const col of state.dominoSpotsCreatedThisTurn) {
    if (!state.row[col]) continue;
    if (state.dominoColSpotSlot[col] === 1) {
      bindDominoSpotFromOffer(col, 0, { force: true });
      return;
    }
  }
}

/** @param {number} col @param {string | null | undefined} key */
function releaseDominoKeyFromCol(col, key) {
  if (!key) return;
  if (state.startingDominoSpotCols.has(col)) {
    returnKeyToPool(key);
  }
}

/** @param {number} dieId @param {number} col @returns {boolean} */
function assignDominoForNewColumn(dieId, col) {
  if (isSettledDominoSpotCol(col)) return Boolean(getDominoKeyForCol(col));
  if (!syncUsedUnusedFromEngagedPair()) syncUsedUnusedFromDie(dieId);

  if (!state.dominoSpotCols.includes(col)) state.dominoSpotCols.push(col);
  if (!state.dominoSpotsCreatedThisTurn.includes(col)) {
    state.dominoSpotsCreatedThisTurn.push(col);
  }

  if (getDominoKeyForCol(col)) return true;

  if (settings.nRoll === 4) {
    const spotIndex = resolveSpotIndexForCol(col);
    if (spotIndex == null || spotIndex > 1) return false;
    return bindDominoSpotFromOffer(col, spotIndex);
  }

  const spotIndex = resolveSpotIndexForCol(col);
  if (spotIndex === 0) {
    if (!bindDominoSpotFromOffer(col, 0)) return false;
    reserveTurnPoolDraw();
    return true;
  }
  if (spotIndex === 1) {
    if (!state.dominoUnusedKey) reserveTurnPoolDraw();
    return bindDominoSpotFromOffer(col, 1);
  }

  return false;
}

/** @param {number} dieId @param {number} col */
export function onTrayDiePlaced(dieId, col) {
  if (!isDominoSpotsActive()) return;
  assignDominoForNewColumn(dieId, col);
}

/** Remap spot col indices when row columns shift for gap insert. */
export function shiftDominoSpotCols(fromCol, delta) {
  if (!isDominoSpotsActive() || !delta) return;

  shiftDominoSpotKeys(fromCol, delta);
  state.dominoSpotCols = state.dominoSpotCols.map(col => (col >= fromCol ? col + delta : col));
  state.dominoSpotsCreatedThisTurn = state.dominoSpotsCreatedThisTurn.map(col =>
    (col >= fromCol ? col + delta : col),
  );

  const remappedStarting = new Set();
  for (const col of state.startingDominoSpotCols) {
    remappedStarting.add(col >= fromCol ? col + delta : col);
  }
  state.startingDominoSpotCols = remappedStarting;

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
      releaseDominoKeyFromCol(fromCol, key);
      maybeRebindDominoSpotToUsed(toCol, dieId);
    } else {
      state.dominoSpotCols[idx] = toCol;
      state.newDominoSpotCols.add(toCol);
      const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(fromCol);
      if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn[turnIdx] = toCol;
      moveDominoSpotKey(fromCol, toCol, key);
    }
    if (!getDominoKeyForCol(toCol)) assignDominoForNewColumn(dieId, toCol);
    enforceSingleColumnUsedDomino();
    return;
  }

  if (!state.dominoSpotCols.includes(toCol)) {
    assignDominoForNewColumn(dieId, toCol);
  } else if (!getDominoKeyForCol(toCol)) {
    ensureDominoSpotForCol(toCol);
  }
  enforceSingleColumnUsedDomino();
}

/** Turn spot cols only — excludes confirmed columns from prior turns. */
function getThisTurnSpotCols() {
  return state.dominoSpotsCreatedThisTurn.filter(
    col => state.row[col] && !state.startingDominoSpotCols.has(col),
  );
}

/** Exactly one turn spot col → used offer on seam; pool reserve unbinds to dominoUnusedKey. */
function enforceSingleColumnUsedDomino() {
  if (!isDominoSpotsActive()) return;
  const turnCols = getThisTurnSpotCols();
  if (turnCols.length !== 1) return;

  const col = turnCols[0];
  const key = getDominoKeyForCol(col);
  const slot = state.dominoColSpotSlot[col];

  if (slot === 0 && key && !isTurnPoolReserveKey(key)) return;

  if (settings.nRoll !== 4 && key && isTurnPoolReserveKey(key)) {
    state.dominoUnusedKey = key;
  }
  if (!state.dominoUsedKey && state.dominoOfferedKeys.length) {
    state.dominoUsedKey = state.dominoOfferedKeys[0];
  }

  bindDominoSpotFromOffer(col, 0, { force: true });
}

/** Post-placement invariant sync (single-column used rule). */
export function syncDominoSpotInvariants() {
  enforceSingleColumnUsedDomino();
}

/** Clear used/unused when this roll's spot allocation is fully undone. */
function resetDominoSpotAllocationIfIdle() {
  if (state.dominoSpotsCreatedThisTurn.length > 0) return;
  if (state.dominoOfferedKeys.length > 0 || state.dominoStarRerollUsedKey) return;
  state.dominoUsedKey = null;
  state.dominoUnusedKey = null;
}

/** @param {number} col @param {string | null | undefined} boundKey */
export function onColumnVacated(col, boundKey = undefined) {
  if (!isDominoSpotsActive()) return;
  if (isSettledDominoSpotCol(col)) return;

  const key = boundKey ?? getDominoKeyForCol(col);
  const vacatedSlot = state.dominoColSpotSlot[col];

  if (key && isTurnPoolReserveKey(key)) {
    state.dominoUnusedKey = key;
  }

  if (vacatedSlot != null && !state.startingDominoSpotCols.has(col)) {
    state.dominoColVacatedSlot[col] = vacatedSlot;
  }

  releaseDominoKeyFromCol(col, key);

  const idx = state.dominoSpotCols.indexOf(col);
  if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

  const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(col);
  if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);

  delete state.dominoSpotKeys[col];
  delete state.dominoColSpotSlot[col];
  const column = state.row[col];
  if (column?.dominoKey) delete column.dominoKey;

  if (vacatedSlot === 0) promoteUnusedSpotColToUsed();

  resetDominoSpotAllocationIfIdle();
  enforceSingleColumnUsedDomino();
}

/** Used die onto slot-1 column → bind used offer; pool reserve returns to dominoUnusedKey (nRoll 1/2/3). */
export function maybeRebindDominoSpotToUsed(col, dieId) {
  if (!isDominoSpotsActive()) return;
  if (!isThisTurnSpotCol(col)) return;
  if (state.dominoColSpotSlot[col] !== 1) return;
  if (!isDieFromUsedDomino(dieId)) return;
  if (!syncUsedUnusedFromEngagedPair()) syncUsedUnusedFromDie(dieId);

  if (settings.nRoll !== 4) {
    const poolKey = getDominoKeyForCol(col);
    if (poolKey && isTurnPoolReserveKey(poolKey)) {
      state.dominoUnusedKey = poolKey;
    }
  }

  bindDominoSpotFromOffer(col, 0, { force: true });
  enforceSingleColumnUsedDomino();
}

/** @param {Set<number>} placedDieIds */
export function settleDominoSpotsOnConfirm(placedDieIds) {
  if (!isDominoSpotsActive()) return;

  const offered = state.dominoOfferedKeys;
  const offerCandidates = [...new Set([
    ...offered,
    ...(state.dominoStarRerollUsedKey ? [state.dominoStarRerollUsedKey] : []),
  ])];
  const poolReserveKey = state.dominoUnusedKey && !offered.includes(state.dominoUnusedKey)
    ? state.dominoUnusedKey
    : null;

  if (!offerCandidates.length && !poolReserveKey) return;

  if (!state.dominoUsedKey && placedDieIds.size > 0 && offered.length) {
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

  const assigned = getTurnAssignedDominoKeys();
  for (const key of offerCandidates) {
    if (!assigned.has(key)) discardDominoKey(key);
  }
  if (poolReserveKey && !assigned.has(poolReserveKey)) {
    returnKeyToPool(poolReserveKey);
  }

  clearDominoSpotsOfferState();
  state.dominoColSpotSlot = {};
  state.dominoColVacatedSlot = {};
  syncDominoDeckCount();
}

/** @param {number[]} cols */
export function releaseDominoKeysForCols(cols) {
  if (!isDominoSpotsActive() || !cols.length) return;

  for (const col of cols) {
    const key = getDominoKeyForCol(col);
    if (!key) continue;
    returnKeyToPool(key);
    delete state.dominoSpotKeys[col];
    delete state.dominoColSpotSlot[col];

    const column = state.row[col];
    if (column?.dominoKey) delete column.dominoKey;

    const idx = state.dominoSpotCols.indexOf(col);
    if (idx !== -1) state.dominoSpotCols.splice(idx, 1);

    const turnIdx = state.dominoSpotsCreatedThisTurn.indexOf(col);
    if (turnIdx !== -1) state.dominoSpotsCreatedThisTurn.splice(turnIdx, 1);
  }

  syncDominoDeckCount();
}

/** @param {number} spotIndex @returns {string | null} */
export function getDominoSpotKey(spotIndex) {
  if (!isDominoSpotsActive()) return null;
  if (spotIndex === 0) {
    return state.dominoUsedKey ?? state.dominoStarRerollUsedKey ?? state.dominoOfferedKeys[0] ?? null;
  }
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

  if (state.dominoStarRerollUsedKey && !state.dominoOfferedKeys.length) {
    return state.actionBar.includes(dieId) || state.placedDieIds.has(dieId);
  }

  if (settings.nRoll === 4) return getDominoPairIndex(dieId) != null;
  return state.dominoOfferedKeys.length === 1
    && (state.actionBar.includes(dieId) || state.placedDieIds.has(dieId));
}

/** @param {number} dieId @returns {string | null} */
export function getDominoKeyForDie(dieId) {
  if (!isDieFromUsedDomino(dieId)) return null;
  if (state.dominoUsedKey) return state.dominoUsedKey;
  if (state.dominoStarRerollUsedKey) return state.dominoStarRerollUsedKey;
  if (settings.nRoll === 4) {
    const idx = getDominoPairIndex(dieId);
    return idx != null ? state.dominoOfferedKeys[idx] ?? null : null;
  }
  return state.dominoOfferedKeys[0] ?? null;
}

export function countDominoSpotsCreated() {
  return state.dominoSpotsCreatedThisTurn.length;
}
