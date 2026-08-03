import { state } from './state.js';
import { settings } from './settings.js';
import { isDominoDeckCountdown } from './deck-size.js';

/** @typedef {[number, number]} PairCombo */
/** @typedef {[number, number, number]} TripleCombo */

const PAIR_POOL_SIZE = 21;
const TRIPLE_POOL_SIZE = 56;

export function buildPairCombos() {
  /** @type {PairCombo[]} */
  const combos = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      combos.push([a, b]);
    }
  }
  return combos;
}

export function buildTripleCombos() {
  /** @type {TripleCombo[]} */
  const combos = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      for (let c = b; c <= 6; c++) {
        combos.push([a, b, c]);
      }
    }
  }
  return combos;
}

/** @param {number[]} combo */
export function comboKey(combo) {
  return combo.join(',');
}

function shuffle(keys) {
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
}

function buildPairPoolKeys() {
  return buildPairCombos().map(comboKey);
}

function buildTriplePoolKeys() {
  return buildTripleCombos().map(comboKey);
}

function listCap(nRoll) {
  if (settings.deckSize > 0) return settings.deckSize;
  return nRoll === 3 ? TRIPLE_POOL_SIZE : PAIR_POOL_SIZE;
}

/** @param {() => string[]} buildFull @param {number} cap */
function buildCappedPool(buildFull, cap) {
  const keys = buildFull();
  shuffle(keys);
  return keys.slice(0, cap);
}

function rebuildPairPool() {
  state.dominoPairPool = buildCappedPool(buildPairPoolKeys, listCap(2));
  state.dominoPairDiscard = [];
}

function rebuildTriplePool() {
  state.dominoTriplePool = buildCappedPool(buildTriplePoolKeys, listCap(3));
  state.dominoTripleDiscard = [];
}

/** @returns {string[]} */
function activeDominoPool(nRoll) {
  return nRoll === 3 ? state.dominoTriplePool : state.dominoPairPool;
}

/** @returns {string[]} */
function activeDominoDiscard(nRoll) {
  return nRoll === 3 ? state.dominoTripleDiscard : state.dominoPairDiscard;
}

/** @param {number} [nRoll] @returns {string[]} discard pile keys (oldest first) */
export function getDominoDiscardKeys(nRoll = settings.nRoll) {
  return activeDominoDiscard(nRoll);
}

/** Deck badge = draw pool + discard pile + tray offers (excludes locked row spots). */
export function syncDominoDeckCount(nRoll = settings.nRoll) {
  if (!isDominoDeckCountdown()) return;
  state.deckRemaining = activeDominoPool(nRoll).length
    + activeDominoDiscard(nRoll).length
    + state.dominoOfferedKeys.length;
}

/** Track combo keys offered in the tray this roll; refreshes deck counter. */
export function setCurrentRollOfferedKeys(keys) {
  state.dominoOfferedKeys = [...keys];
  syncDominoDeckCount();
}

export function syncDominoDeckRemaining(nRoll = settings.nRoll) {
  syncDominoDeckCount(nRoll);
}

/** @param {number} nRoll @param {number} needed */
function reshuffleDiscardIntoPool(nRoll, needed) {
  const pool = activeDominoPool(nRoll);
  if (pool.length >= needed) return;
  const discard = activeDominoDiscard(nRoll);
  if (!discard.length) return;
  pool.push(...discard.splice(0));
  shuffle(pool);
  syncDominoDeckCount(nRoll);
}

/** @param {string[]} pool */
function drawRandomFromPool(pool) {
  if (!pool.length) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool.splice(idx, 1)[0];
}

/** @param {string} key @returns {number[]} */
export function parseDominoKey(key) {
  return key.split(',').map(Number);
}

export function initDominoPools() {
  if (!settings.dominoRoll) {
    state.dominoPairPool = [];
    state.dominoTriplePool = [];
    state.dominoPairDiscard = [];
    state.dominoTripleDiscard = [];
    return;
  }
  rebuildPairPool();
  rebuildTriplePool();
  syncDominoDeckCount();
}

export function clearDominoTrayState() {
  state.dominoPairGroups = null;
  state.dominoChosenPairIndex = null;
  state.dominoPairComboKeys = null;
}

/** @param {string} key — vacate-undo only; swept/unbound offers use discardDominoKey. */
export function returnKeyToPool(key) {
  if (key.split(',').length === 3) state.dominoTriplePool.push(key);
  else state.dominoPairPool.push(key);
  syncDominoDeckCount();
}

/** @param {string} key */
export function discardDominoKey(key) {
  if (key.split(',').length === 3) state.dominoTripleDiscard.push(key);
  else state.dominoPairDiscard.push(key);
  syncDominoDeckCount();
}

/** @param {Set<number>} placedDieIds */
export function settleDominoQuadRoll(placedDieIds) {
  if (!settings.dominoRoll || settings.nRoll !== 4) return;
  if (settings.dominoSpots) return;
  const keys = state.dominoPairComboKeys;
  const groups = state.dominoPairGroups;
  if (!keys || keys.length !== 2 || !groups) return;

  let usedIdx = state.dominoChosenPairIndex;
  if (usedIdx == null) {
    const placed0 = groups[0].some(id => placedDieIds.has(id));
    const placed1 = groups[1].some(id => placedDieIds.has(id));
    if (placed0 && !placed1) usedIdx = 0;
    else if (placed1 && !placed0) usedIdx = 1;
    else if (!placed0 && !placed1) {
      discardDominoKey(keys[0]);
      discardDominoKey(keys[1]);
      state.dominoPairComboKeys = null;
      state.dominoOfferedKeys = [];
      syncDominoDeckCount();
      return;
    } else {
      usedIdx = placed0 ? 0 : 1;
    }
  }

  const unusedIdx = usedIdx === 0 ? 1 : 0;
  discardDominoKey(keys[unusedIdx]);
  state.dominoPairComboKeys = null;
  state.dominoOfferedKeys = [];
  syncDominoDeckCount();
}

/**
 * @param {number} nRoll
 * @returns {{ values: number[], pairGroups?: PairCombo[], pairComboKeys?: string[], comboKeys?: string[] } | null}
 */
export function drawDominoRoll(nRoll) {
  if (nRoll === 2) {
    const needed = 1;
    reshuffleDiscardIntoPool(nRoll, needed);
    const pool = state.dominoPairPool;
    if (pool.length < needed) return null;
    const key = drawRandomFromPool(pool);
    if (!key) return null;
    return { values: parseDominoKey(key), comboKeys: [key] };
  }
  if (nRoll === 3) {
    const needed = 1;
    reshuffleDiscardIntoPool(nRoll, needed);
    const pool = state.dominoTriplePool;
    if (pool.length < needed) return null;
    const key = drawRandomFromPool(pool);
    if (!key) return null;
    return { values: parseDominoKey(key), comboKeys: [key] };
  }
  if (nRoll === 4) {
    const needed = 2;
    reshuffleDiscardIntoPool(nRoll, needed);
    const pool = state.dominoPairPool;
    if (pool.length < needed) return null;
    const keyA = drawRandomFromPool(pool);
    const keyB = drawRandomFromPool(pool);
    if (!keyA || !keyB) return null;
    const pairA = parseDominoKey(keyA);
    const pairB = parseDominoKey(keyB);
    return {
      values: [...pairA, ...pairB],
      pairGroups: [pairA, pairB],
      pairComboKeys: [keyA, keyB],
      comboKeys: [keyA, keyB],
    };
  }
  return { values: [] };
}

/** @returns {boolean} */
export function isDominoQuadRollActive() {
  return settings.dominoRoll
    && settings.nRoll === 4
    && state.dominoPairGroups != null;
}

/** @param {number} dieId @returns {0 | 1 | null} */
export function getDominoPairIndex(dieId) {
  if (!state.dominoPairGroups) return null;
  if (state.dominoPairGroups[0].includes(dieId)) return 0;
  if (state.dominoPairGroups[1].includes(dieId)) return 1;
  return null;
}

/** @param {number} dieId */
export function setDominoChosenPairFromDie(dieId) {
  if (!isDominoQuadRollActive()) return;
  const idx = getDominoPairIndex(dieId);
  if (idx == null) return;
  state.dominoChosenPairIndex = idx;
}

export function clearDominoChosenPair() {
  state.dominoChosenPairIndex = null;
}

/** Active pair: dragging, selected, or has a die on the row this roll. */
export function getDominoEngagedPairIndex() {
  if (!isDominoQuadRollActive()) return null;
  const groups = state.dominoPairGroups;
  if (!groups) return null;

  if (state.draggingDieId != null) {
    const idx = getDominoPairIndex(state.draggingDieId);
    if (idx != null) return idx;
  }
  if (state.selectedDieId != null) {
    const idx = getDominoPairIndex(state.selectedDieId);
    if (idx != null) return idx;
  }
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].some(id => state.placedDieIds.has(id))) return i;
  }
  return null;
}

/** Clear stale chosen-pair state when nothing is engaged. */
export function syncDominoTrayIdleUnlock() {
  if (getDominoEngagedPairIndex() == null) clearDominoChosenPair();
}

/** Tray return: drop selection; unlock when all quad dice are idle in tray. */
export function onDominoDieReturnedToTray(dieId) {
  if (!isDominoQuadRollActive()) return;
  if (state.selectedDieId === dieId) state.selectedDieId = null;
  syncDominoTrayIdleUnlock();
}

/** @param {number} dieId */
export function isDominoPairLocked(dieId) {
  const engaged = getDominoEngagedPairIndex();
  if (engaged == null) return false;
  const idx = getDominoPairIndex(dieId);
  return idx != null && idx !== engaged;
}
