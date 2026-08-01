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
}

function rebuildTriplePool() {
  state.dominoTriplePool = buildCappedPool(buildTriplePoolKeys, listCap(3));
}

/** @returns {string[]} */
function activeDominoPool(nRoll) {
  return nRoll === 3 ? state.dominoTriplePool : state.dominoPairPool;
}

export function syncDominoDeckRemaining(nRoll = settings.nRoll) {
  if (!isDominoDeckCountdown()) return;
  state.deckRemaining = listCap(nRoll);
}

/** HUD counter ticks down once per roll-button roll (not on confirm or pool settle). */
export function tickDominoDeckOnRoll(nRoll = settings.nRoll) {
  if (!isDominoDeckCountdown()) return;
  if (state.deckRemaining == null) state.deckRemaining = listCap(nRoll);
  state.deckRemaining -= 1;
  if (state.deckRemaining <= 0) {
    state.deckRemaining = listCap(nRoll);
    if (nRoll === 3) rebuildTriplePool();
    else rebuildPairPool();
  }
}

/** @param {number} nRoll */
function ensureActivePool(nRoll) {
  const pool = activeDominoPool(nRoll);
  if (pool.length) return;
  if (nRoll === 3) rebuildTriplePool();
  else rebuildPairPool();
}

/** @param {string[]} pool */
function drawRandomFromPool(pool) {
  if (!pool.length) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool.splice(idx, 1)[0];
}

/** @param {string} key @returns {number[]} */
function keyToValues(key) {
  return key.split(',').map(Number);
}

export function initDominoPools() {
  if (!settings.dominoRoll) {
    state.dominoPairPool = [];
    state.dominoTriplePool = [];
    return;
  }
  rebuildPairPool();
  rebuildTriplePool();
  syncDominoDeckRemaining();
}

export function clearDominoTrayState() {
  state.dominoPairGroups = null;
  state.dominoChosenPairIndex = null;
  state.dominoPairComboKeys = null;
}

function ensurePairPoolForQuadDraw() {
  if (!state.dominoPairPool.length) rebuildPairPool();
}

/** @param {Set<number>} placedDieIds */
export function settleDominoQuadRoll(placedDieIds) {
  if (!settings.dominoRoll || settings.nRoll !== 4) return;
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
      state.dominoPairPool.push(keys[0], keys[1]);
      state.dominoPairComboKeys = null;
      return;
    } else {
      usedIdx = placed0 ? 0 : 1;
    }
  }

  const unusedIdx = usedIdx === 0 ? 1 : 0;
  state.dominoPairPool.push(keys[unusedIdx]);
  state.dominoPairComboKeys = null;
}

/**
 * @param {number} nRoll
 * @returns {{ values: number[], pairGroups?: PairCombo[] } | null}
 */
export function drawDominoRoll(nRoll) {
  if (nRoll === 2) {
    ensureActivePool(nRoll);
    const pool = state.dominoPairPool;
    const key = drawRandomFromPool(pool);
    if (!key) return null;
    return { values: keyToValues(key) };
  }
  if (nRoll === 3) {
    ensureActivePool(nRoll);
    const pool = state.dominoTriplePool;
    const key = drawRandomFromPool(pool);
    if (!key) return null;
    return { values: keyToValues(key) };
  }
  if (nRoll === 4) {
    ensurePairPoolForQuadDraw();
    const pool = state.dominoPairPool;
    let keyA;
    let keyB;
    if (pool.length >= 2) {
      keyA = drawRandomFromPool(pool);
      keyB = drawRandomFromPool(pool);
    } else if (pool.length === 1) {
      keyA = pool.pop();
      rebuildPairPool();
      keyB = drawRandomFromPool(state.dominoPairPool);
    } else {
      return null;
    }
    if (!keyA || !keyB) return null;
    const pairA = keyToValues(keyA);
    const pairB = keyToValues(keyB);
    return {
      values: [...pairA, ...pairB],
      pairGroups: [pairA, pairB],
      pairComboKeys: [keyA, keyB],
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

/** @param {number} dieId */
export function isDominoPairLocked(dieId) {
  if (!isDominoQuadRollActive()) return false;
  if (state.dominoChosenPairIndex == null) return false;
  const idx = getDominoPairIndex(dieId);
  return idx != null && idx !== state.dominoChosenPairIndex;
}
