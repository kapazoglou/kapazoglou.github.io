import { state } from './state.js';
import { settings } from './settings.js';
import { spawnKnownDie } from './dice.js';
import { isDominoDeckCountdown } from './deck-size.js';
import { setDominoOfferedKeys, isDominoSpotsActive, clearDominoSpotsRollState } from './domino-spots.js';
import { purgePreviewPlacementsFromRow } from './row.js';

/** @typedef {[number, number]} PairCombo */
/** @typedef {[number, number, number]} TripleCombo */

const PAIR_POOL_SIZE = 21;
const TRIPLE_POOL_SIZE = 56;
export const DOMINO_RESHUFFLE_MAX = 3;
export const DOMINO_HAND_SIZE = 7;
export const DOMINO_HAND_DICE_PLACE = 2;

/** nRoll=1 + dominoRoll: 7-domino hand with preview / lock / confirm. */
export function isDominoHandMode() {
  return settings.dominoRoll && settings.nRoll === 1;
}

/** nRoll=1 hand still has selectable dominos in the discard-row band. */
export function isDominoHandPlayable() {
  return isDominoHandMode() && state.dominoHandKeys.length > 0;
}

/** nRoll=1 + Spots: loss only when hand and active pool both cannot supply another turn. */
export function isDominoHandAndPoolExhausted() {
  if (!isDominoHandMode()) return false;
  if (state.dominoHandKeys.length > 0) return false;
  return !canDrawDominoKeyFromPool(1);
}

export function dominoHandDicePlaceQuota() {
  return isDominoHandMode() ? DOMINO_HAND_DICE_PLACE : settings.nPlace;
}

export function dominoHandBothDicePlaced() {
  return state.placedThisTurn >= DOMINO_HAND_DICE_PLACE && state.actionBar.length === 0;
}

export function isDominoHandLocked() {
  return Boolean(state.dominoHandLocked);
}

export function isDominoHandPreviewActive() {
  return isDominoHandMode()
    && state.dominoHandPreviewKey != null
    && !state.dominoHandLocked;
}

function clearDominoHandState() {
  state.dominoHandKeys = [];
  state.dominoHandSelectedIndex = null;
  state.dominoHandCommittedKey = null;
  state.dominoHandPreviewKey = null;
  state.dominoHandLocked = false;
  state.dominoHandPreviewDieIds = [];
  state.newDominoHandKeys = new Set();
}

function syncHandSelectedIndexFromPreview() {
  if (!state.dominoHandPreviewKey) {
    state.dominoHandSelectedIndex = null;
    return;
  }
  const idx = state.dominoHandKeys.indexOf(state.dominoHandPreviewKey);
  state.dominoHandSelectedIndex = idx >= 0 ? idx : null;
}

function clearPreviewTrayDice() {
  for (const id of state.dominoHandPreviewDieIds) {
    delete state.dice[id];
  }
  state.dominoHandPreviewDieIds = [];
  state.actionBar = [];
  state.newTrayDieIds = new Set();
}

export function clearHandPreviewState() {
  state.dominoHandPreviewKey = null;
  state.dominoHandLocked = false;
  state.dominoHandSelectedIndex = null;
  clearPreviewTrayDice();
}

function spawnPreviewTrayPair(values) {
  clearPreviewTrayDice();
  for (const value of values) {
    const id = spawnKnownDie(value);
    state.actionBar.push(id);
    state.dominoHandPreviewDieIds.push(id);
    state.newTrayDieIds.add(id);
  }
}

function setHandPreviewOfferedKeys(key) {
  if (isDominoSpotsActive()) setDominoOfferedKeys([key]);
  else setCurrentRollOfferedKeys([key]);
}

/** Undo preview placements, tray dice, and spot turn state (hand switch). */
export function revertHandPreviewTurn() {
  if (!isDominoHandMode()) return;

  purgePreviewPlacementsFromRow();
  clearPreviewTrayDice();
  clearDominoSpotsRollState();
  state.dominoOfferedKeys = [];
  state.pushBelowDieIds.clear();
  state.swapStackCols.clear();
  state.pushReminderCols.clear();
  state.swapReminderCols.clear();
  state.flippedDieIds.clear();
  state.selectedDieId = null;
  state.dominoPairRerollAvailable = false;
}

/** Splice preview key from hand; mark locked. */
export function lockHandDomino() {
  const key = state.dominoHandPreviewKey ?? state.dominoHandCommittedKey;
  if (!key) return false;

  if (state.dominoHandPreviewKey) {
    const idx = state.dominoHandKeys.indexOf(state.dominoHandPreviewKey);
    if (idx !== -1) state.dominoHandKeys.splice(idx, 1);
  }

  state.dominoHandCommittedKey = key;
  state.dominoHandPreviewKey = null;
  state.dominoHandLocked = true;
  state.dominoHandSelectedIndex = null;
  state.dominoHandPreviewDieIds = [];
  return true;
}

function removeOfferedKeysFromHand(keys) {
  for (const key of keys) {
    const idx = state.dominoHandKeys.indexOf(key);
    if (idx !== -1) state.dominoHandKeys.splice(idx, 1);
  }
}

/**
 * @param {number} i
 * @returns {boolean}
 */
export function previewHandDomino(i) {
  if (!isDominoHandMode() || state.dominoHandLocked) return false;
  if (i < 0 || i >= state.dominoHandKeys.length) return false;

  const key = state.dominoHandKeys[i];
  if (state.dominoHandPreviewKey && state.dominoHandPreviewKey !== key) {
    revertHandPreviewTurn();
  } else if (state.dominoHandPreviewKey === key) {
    return true;
  }

  state.dominoHandPreviewKey = key;
  syncHandSelectedIndexFromPreview();

  const values = parseDominoKey(key);
  spawnPreviewTrayPair(values);
  setHandPreviewOfferedKeys(key);

  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.dominoPairRerollAvailable = true;
  state.phase = 'rolled';
  return true;
}

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
  if (settings.dominoSpots) {
    return nRoll === 3 ? TRIPLE_POOL_SIZE : PAIR_POOL_SIZE;
  }
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

/** Deck badge — active draw pool only (Domino Roll nRoll 2/3/4). */
export function syncDominoDeckCount(nRoll = settings.nRoll) {
  if (!isDominoDeckCountdown()) return;
  state.deckRemaining = activeDominoPool(nRoll).length;
}

/** Track combo keys offered in the tray this roll; refreshes deck counter. */
export function setCurrentRollOfferedKeys(keys) {
  state.dominoOfferedKeys = [...keys];
  syncDominoDeckCount();
}

export function syncDominoDeckRemaining(nRoll = settings.nRoll) {
  syncDominoDeckCount(nRoll);
}

/** @param {number} nRoll */
function dominoDrawNeeded(nRoll) {
  return nRoll === 4 ? 2 : 1;
}

/** Reshuffle-dot UI — Domino Roll ON, nRoll 1/2/3/4 (both Spots modes). */
export function showDominoReshuffleDots() {
  return settings.dominoRoll && isDominoDeckCountdown();
}

/** @param {number} nRoll @param {number} needed */
function tryChargedDominoReshuffle(nRoll, needed) {
  if (state.dominoReshufflesRemaining <= 0) return false;
  state.dominoReshufflesRemaining -= 1;
  const pool = activeDominoPool(nRoll);
  const discard = activeDominoDiscard(nRoll);
  if (discard.length) {
    pool.push(...discard.splice(0));
    shuffle(pool);
  }
  if (!settings.dominoSpots && pool.length < needed) {
    if (nRoll === 3) rebuildTriplePool();
    else rebuildPairPool();
  }
  syncDominoDeckCount(nRoll);
  return true;
}

/** Active pool can satisfy the next tray draw. */
export function canDrawDominoRoll(nRoll = settings.nRoll) {
  if (!settings.dominoRoll || (nRoll !== 2 && nRoll !== 3 && nRoll !== 4)) return true;
  const needed = dominoDrawNeeded(nRoll);
  if (activeDominoPool(nRoll).length >= needed) return true;
  if (state.dominoReshufflesRemaining <= 0) return false;
  if (!settings.dominoSpots) return true;
  return activeDominoDiscard(nRoll).length > 0;
}

/** Single pool draw (e.g. nRoll=2 second column spot). */
export function canDrawDominoKeyFromPool(nRoll = settings.nRoll) {
  if (!settings.dominoRoll) return false;
  if (activeDominoPool(nRoll).length > 0) return true;
  if (state.dominoReshufflesRemaining <= 0) return false;
  if (!settings.dominoSpots) return true;
  return activeDominoDiscard(nRoll).length > 0;
}

/** Pool too short → charged reshuffle (merge discard; Spots OFF may full-rebuild). */
function ensureDominoPoolForDraw(nRoll, needed) {
  if (activeDominoPool(nRoll).length >= needed) return;
  tryChargedDominoReshuffle(nRoll, needed);
}

/** @deprecated Sweep returns keys via returnKeyToPool — no discard merge at sweep. */
export function reshuffleDominoPoolAtSweep(nRoll = settings.nRoll) {
  if (!isDominoDeckCountdown()) return;
  syncDominoDeckCount(nRoll);
}

/** @param {string[]} pool */
function drawRandomFromPool(pool) {
  if (!pool.length) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool.splice(idx, 1)[0];
}

/** Draw one combo key from the active pool (removes it; refreshes deck counter). */
export function drawDominoKeyFromPool(nRoll = settings.nRoll) {
  if (!settings.dominoRoll) return null;
  if (activeDominoPool(nRoll).length === 0 && canDrawDominoKeyFromPool(nRoll)) {
    ensureDominoPoolForDraw(nRoll, 1);
  }
  const key = drawRandomFromPool(activeDominoPool(nRoll));
  syncDominoDeckCount(nRoll);
  return key;
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
    state.dominoReshufflesRemaining = 0;
    clearDominoHandState();
    return;
  }
  rebuildPairPool();
  rebuildTriplePool();
  state.dominoReshufflesRemaining = isDominoDeckCountdown() ? DOMINO_RESHUFFLE_MAX : 0;
  syncDominoDeckCount();
  if (isDominoHandMode()) initDominoHand();
  else clearDominoHandState();
}

/** Deal initial hand from pair pool (nRoll=1). */
export function initDominoHand() {
  if (!isDominoHandMode()) {
    clearDominoHandState();
    return;
  }
  state.dominoHandKeys = [];
  state.dominoHandSelectedIndex = null;
  state.dominoHandCommittedKey = null;
  state.dominoHandPreviewKey = null;
  state.dominoHandLocked = false;
  state.dominoHandPreviewDieIds = [];
  state.newDominoHandKeys = new Set();
  for (let i = 0; i < DOMINO_HAND_SIZE; i++) {
    const key = drawDominoKeyFromPool(1);
    if (!key) break;
    state.dominoHandKeys.push(key);
  }
}

/** @deprecated — use previewHandDomino */
export function selectDominoHandIndex(i) {
  return previewHandDomino(i);
}

export function hasDominoHandSelection() {
  if (!isDominoHandMode()) return true;
  return state.dominoHandPreviewKey != null || isDominoHandPreviewActive();
}

export function refillDominoHandOne() {
  if (!isDominoHandMode()) return;
  const key = drawDominoKeyFromPool(1);
  if (key) {
    state.dominoHandKeys.push(key);
    state.newDominoHandKeys.add(key);
  }
}

export function clearDominoTrayState() {
  state.dominoPairGroups = null;
  state.dominoChosenPairIndex = null;
  state.dominoPairComboKeys = null;
  state.dominoPairRerollAvailable = false;
  state.dominoHandCommittedKey = null;
  if (isDominoHandMode()) clearHandPreviewState();
}

/** nRoll=2 or nRoll=1 hand + dominoRoll: tray shows a seamless pair while both dice are idle. */
export function isDominoPairRollTray() {
  if (!settings.dominoRoll || state.phase !== 'rolled') return false;
  if (settings.nRoll === 2) return true;
  return isDominoHandMode();
}

/** Seamless domino pair only on the initial roll offer (before ↺ reroll). */
export function isDominoPairTraySeamless() {
  return isDominoPairRollTray()
    && state.dominoPairRerollAvailable
    && state.placedThisTurn === 0
    && state.actionBar.length === 2;
}

/** Substantive gate for star-pay pair redraw (ignores phase — safe during anim callback). */
export function canApplyDominoPairReroll() {
  if (!settings.dominoRoll) return false;
  if (settings.nRoll !== 2 && !isDominoHandMode()) return false;
  if (!state.dominoPairRerollAvailable) return false;
  if (state.placedThisTurn > 0) return false;
  if (state.actionBar.length !== 2) return false;
  if (isDominoHandMode() && state.dominoHandLocked) return false;
  return state.dominoOfferedKeys.length > 0;
}

/** ↺ active only while both tray dice are idle and reroll not yet spent. */
export function canShowDominoPairReroll() {
  return isDominoPairRollTray() && canApplyDominoPairReroll();
}

/** Discard current tray domino offer (star-pay redraw — does not draw from pool). */
export function discardOfferedDominoKeys() {
  if (isDominoHandMode() && isDominoHandPreviewActive()) {
    removeOfferedKeysFromHand(state.dominoOfferedKeys);
    state.dominoHandPreviewKey = null;
    state.dominoHandSelectedIndex = null;
  }
  for (const key of state.dominoOfferedKeys) discardDominoKey(key);
  state.dominoOfferedKeys = [];
  state.dominoHandCommittedKey = null;
  syncDominoDeckCount();
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

/** nRoll 1/2/3 confirm (Domino Spots OFF): move offered combo keys to discard. */
export function settleDominoRollOnConfirm() {
  if (!settings.dominoRoll || settings.dominoSpots) return;
  if (settings.nRoll === 4) return;
  for (const key of state.dominoOfferedKeys) discardDominoKey(key);
  state.dominoOfferedKeys = [];
  state.dominoHandCommittedKey = null;
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
    const needed = dominoDrawNeeded(nRoll);
    ensureDominoPoolForDraw(nRoll, needed);
    const pool = state.dominoPairPool;
    if (pool.length < needed) return null;
    const key = drawRandomFromPool(pool);
    if (!key) return null;
    return { values: parseDominoKey(key), comboKeys: [key] };
  }
  if (nRoll === 3) {
    const needed = dominoDrawNeeded(nRoll);
    ensureDominoPoolForDraw(nRoll, needed);
    const pool = state.dominoTriplePool;
    if (pool.length < needed) return null;
    const key = drawRandomFromPool(pool);
    if (!key) return null;
    return { values: parseDominoKey(key), comboKeys: [key] };
  }
  if (nRoll === 4) {
    const needed = dominoDrawNeeded(nRoll);
    ensureDominoPoolForDraw(nRoll, needed);
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
