import { state } from './state.js';
import { settings } from './settings.js';
import { isCoolOffActive, isRankCoolOffBlocked } from './cool-off.js';

/* ── Color & pip data ── */
// PIP_COLOR prev: 1:'#FFFFFF', 2:'#7161FF', 3:'#CC5529', 4:'#5DB22D', 5:'#25A5CC', 6:'#FFFFFF'
export const PIP_COLOR = {
  0: '#CCB400', // blank → V suit color
  1: '#3D4B66', 2: '#7A6BFF', 3: '#CC6525',
  4: '#6FBA06', 5: '#25B5BA', 6: '#3D4B66', 7: '#CCB400',
};

// DIE_PIP_COLOR prev: 1:'#070D1A', 2:'#7161FF', 3:'#CC5529', 4:'#5DB22D', 5:'#25A5CC', 6:'#070D1A'
export const DIE_PIP_COLOR = {
  0: '#CCB400',
  1: '#070D1A', 2: '#7A6BFF', 3: '#CC6525',
  4: '#6FBA06', 5: '#25B5BA', 6: '#070D1A', 7: '#CCB400',
};

export const PIP_POS = {
  tl:[31,9], tr:[31,31], ml:[20,9], c:[20,20], mr:[20,31], bl:[9,9], br:[9,31],
};
export const JOKER_PIP_POS = {
  tl:[31,14], tr:[31,26], ml:[20,8], c:[20,20], mr:[20,32], bl:[9,14], br:[9,26],
};
export const PIP_PATTERN = {
  0:[], 1:['c'], 2:['tl','br'], 3:['tr','c','bl'],
  4:['tl','tr','bl','br'], 5:['tl','tr','c','bl','br'],
  6:['tl','tr','ml','mr','bl','br'],
  7:['tl','tr','ml','c','mr','bl','br'],
};
export const ALL_PIPS = ['tl','tr','ml','c','mr','bl','br'];

/* ── Suit / rank constants ── */
export const SUIT_LETTER   = { 0:'V', 1:'V', 2:'Z', 3:'X', 4:'Y', 5:'W', 6:'V' };
export const DISCARD_RANKS = ['★','A','b','c','d','e','f','g','h','i','aj','aa','ab','ac'];
// SUIT_COLOR prev: Z:'#7161FF', X:'#CC5529', Y:'#5DB22D', W:'#25A5CC'
export const SUIT_COLOR    = { V:'#CCB400', Z:'#7A6BFF', X:'#CC6525', Y:'#6FBA06', W:'#25B5BA' };
export const DISPLAY_SUITS = ['Z','X','Y','W'];

/** Sorted multiset keys for Tricolor sevens (3-color combo + rank dice sum to 7). */
export const TRICOLOR_COMBOS = ['2,3,4', '2,3,5', '2,4,5', '3,4,5'];
const TRICOLOR_COMBO_SET = new Set(TRICOLOR_COMBOS);

function sortedComboKey(values) {
  const key = [...values].sort((a, b) => a - b).join(',');
  return TRICOLOR_COMBO_SET.has(key) ? key : null;
}

/** Suit letter for a tricolor combo: the missing pip from {2,3,4,5} (234→W, 235→Y, 245→X, 345→Z). */
function tricolorSuitFromCombo(comboKey) {
  if (!comboKey) return '';
  const present = new Set(comboKey.split(',').map(Number));
  for (const v of [2, 3, 4, 5]) {
    if (!present.has(v)) return SUIT_LETTER[v];
  }
  return '';
}

/** Combo key when all three dice match a Tricolor multiset; null otherwise. */
export function tricolorComboKey(cardId) {
  const card = state.cards[cardId];
  if (!card) return null;
  if (isFourSquareCard(card)) {
    if (squareFilledCount(cardId) !== 3) return null;
    const vals = squareActiveSlotIndices(card)
      .filter(si => slotHasDie(card, si))
      .map(si => state.dice[card.slots[si]].value);
    return vals.length === 3 ? sortedComboKey(vals) : null;
  }
  if ((card.slotCount ?? 3) !== 3) return null;
  if (!card.slots.every(s => s != null && s !== undefined)) return null;
  return sortedComboKey(card.slots.map(id => state.dice[id].value));
}

/** Combo key when card is a Tricolor seven (multiset match; portrait also requires rank sum 7). */
export function tricolorSevenKey(cardId) {
  const key = tricolorComboKey(cardId);
  if (!key) return null;
  if (settings.square && squareFilledCount(cardId) === 3) return key;
  const rankSum = cardSlotValue(cardId, 0) + cardSlotValue(cardId, 2);
  return rankSum === 7 ? key : null;
}

/** True when settings.tricolor is ON and card is a Tricolor seven. */
export function isTricolorCard(cardId) {
  return settings.tricolor && tricolorSevenKey(cardId) !== null;
}

/** Game-over grid sort: rank 2→12, A, tricolor, *; suit Z→X→Y→W→V→2-slot; pip pair tie-break. */
export const GAME_OVER_RANK_ORDER = ['b','c','d','e','f','g','h','i','aj','aa','ab','A'];
export const GAME_OVER_SUIT_ORDER = ['Z','X','Y','W','V'];

function gameOverRankIndex(rank) {
  const i = GAME_OVER_RANK_ORDER.indexOf(rank);
  if (i >= 0) return i;
  if (rank === ' ') return GAME_OVER_RANK_ORDER.length;
  if (rank === '*' || rank === '★') return GAME_OVER_RANK_ORDER.length + 1;
  return GAME_OVER_RANK_ORDER.length + 2;
}

function gameOverSuitIndex(suit, cardId) {
  if (cardId != null && (state.cards[cardId]?.slotCount ?? 3) === 2) {
    return GAME_OVER_SUIT_ORDER.length;
  }
  const i = GAME_OVER_SUIT_ORDER.indexOf(suit);
  return i >= 0 ? i : GAME_OVER_SUIT_ORDER.length;
}

/** Sorted pip pair from rank slots; null if either rank slot has no die. */
function strictRankPipPair(cardId) {
  const card = state.cards[cardId];
  if (!card) return null;
  const id0 = card.slots[0], id2 = card.slots[2];
  if (id0 == null || id2 == null) return null;
  const v0 = state.dice[id0]?.value;
  const v2 = state.dice[id2]?.value;
  if (v0 === undefined || v2 === undefined) return null;
  return [v0, v2].sort((a, b) => a - b).join(',');
}

function dominoIdentityKey(prefix, cardId) {
  const pair = strictRankPipPair(cardId);
  return pair ? `${prefix}:${pair}` : null;
}

function discoverySortPair(cardId) {
  const key = state.cards[cardId]?.discoveryKey;
  if (key) {
    if (key.startsWith('T:')) {
      const parts = key.split(':');
      return parts[1] ?? '';
    }
    const colon = key.lastIndexOf(':');
    if (colon >= 0) return key.slice(colon + 1);
  }
  return strictRankPipPair(cardId) ?? '';
}

/** Comparator for game-over discovered-card display order. */
export function compareDiscoveredCards(aId, bId) {
  const rankDiff = gameOverRankIndex(cardRank(aId)) - gameOverRankIndex(cardRank(bId));
  if (rankDiff !== 0) return rankDiff;
  const suitDiff = gameOverSuitIndex(cardSuit(aId), aId) - gameOverSuitIndex(cardSuit(bId), bId);
  if (suitDiff !== 0) return suitDiff;
  return discoverySortPair(aId).localeCompare(discoverySortPair(bId));
}

/** 4-square game-over grid: rows Z→X→Y→W, cols suit-only→2–12→A. */
export const GAME_OVER_FOUR_SQUARE_SUITS = ['Z', 'X', 'Y', 'W'];
const GAME_OVER_FOUR_SQUARE_RANK_COLS = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'aj', 'aa', 'ab'];

export function gameOverFourSquareColumn(rank) {
  if (rank === '' || rank === 'gg') return 0;
  if (rank === 'A') return 12;
  const i = GAME_OVER_FOUR_SQUARE_RANK_COLS.indexOf(rank);
  return i >= 0 ? i + 1 : -1;
}

export function gameOverFourSquareRow(suit) {
  const i = GAME_OVER_FOUR_SQUARE_SUITS.indexOf(suit);
  return i >= 0 ? i : -1;
}

export function gameOverFourSquareCell(cardId) {
  const row = gameOverFourSquareRow(cardSuit(cardId));
  const col = gameOverFourSquareColumn(cardRank(cardId));
  if (row < 0 || col < 0) return null;
  return { row, col };
}

/** 4×13 grid of card IDs (null = undiscovered cell). Later discoveries overwrite same cell. */
export function buildGameOverFourSquareGrid(cardIds) {
  const grid = Array.from({ length: 4 }, () => Array(13).fill(null));
  for (const id of cardIds) {
    const cell = gameOverFourSquareCell(id);
    if (!cell) continue;
    grid[cell.row][cell.col] = id;
  }
  return grid;
}

export function ndTranscribe(str) {
  return String(str).replace(/[0-9]/g, d => 'jabcdefghi'[+d]);
}

/** True when a value-6 in slot 1 should use 180° (slot 0 filled; if corners 0+2 both filled, only when slot 1 pairs with slot 0 for rank). */
function slot1SixExtraRotation(cardId) {
  const card = state.cards[cardId];
  if (!card || card.slots[0] == null) return false;
  if (card.slots[2] == null) return true;
  if (settings.square && squareFilledCount(cardId) === 3) {
    return squareSuitSlot(cardId) === 2; // rank slots [0, 1]: slot-1 six forms rank with slot 0
  }
  return false; // portrait / suit at slot 1: rank slots [0, 2], slot 1 is suit
}

/** Clockwise pip rotation (deg). slotIdx null/undefined = tray/preview; cardId required for slot-aware rules. */
export function diePipRotationDeg(slotIdx, value, cardId = null) {
  if (value !== 6) return 90;
  if (slotIdx === 0) return 180;
  if (slotIdx === 1 && cardId != null && slot1SixExtraRotation(cardId)) return 180;
  return 90;
}

export function dieSVG(value, size = 40, pipRotationDeg = 90) {
  const s    = size / 40;
  const rx   = Math.round((value === 7 ? 9 : 8) * s);
  const pr   = 5 * s;
  const face = value === 0 ? '#CCB400' : '#FFFFFF';
  const color  = DIE_PIP_COLOR[value];
  const active = new Set(PIP_PATTERN[value]);
  const pos    = value === 7 ? JOKER_PIP_POS : PIP_POS;
  const center = size / 2;
  const circles = ALL_PIPS.filter(k => active.has(k)).map(k => {
    const [cx, cy] = pos[k];
    const pipColor = value === 7 && k === 'c' ? DIE_PIP_COLOR[1] : color;
    return `<circle cx="${(cx*s).toFixed(1)}" cy="${(cy*s).toFixed(1)}" r="${pr.toFixed(1)}" fill="${pipColor}"/>`;
  }).join('');
  const pips = circles
    ? `<g transform="rotate(${pipRotationDeg} ${center} ${center})">${circles}</g>`
    : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" data-name="dice_master"><rect width="${size}" height="${size}" rx="${rx}" fill="${face}"/>${pips}</svg>`;
}

/* ── Card spawning ── */
export function spawnCard(slotCount = 3) {
  const id = state.cards.length;
  let slots;
  if (settings.fourSquare && settings.square) {
    slots = [null, null, null, null];
    slotCount = 4;
  } else if (slotCount === 2) {
    // rank-only card: slots[1] (suit) is inactive
    slots = [null, undefined, null];
  } else if (slotCount === 1) {
    // suit-only card: slots[0] and slots[2] (rank) are inactive
    slots = [undefined, null, undefined];
  } else {
    slots = [null, null, null];
  }
  state.cards.push({ id, slotCount, slots, filled: false });
  return id;
}

export function spawnEmptyCard() {
  const id = state.cards.length;
  state.cards.push({ id, slotCount: 3, slots: [null, null, null], filled: false, empty: true });
  return id;
}

/* ── SQUARE card helpers (settings.square) ── */

const SQUARE_CW  = { 0: 1, 1: 2, 2: 3, 3: 0 };
const SQUARE_CCW = { 0: 3, 3: 2, 2: 1, 1: 0 };
const SQUARE_NEIGHBORS = { 0: [1, 3], 1: [0, 2], 2: [1, 3], 3: [0, 2] };
const SQUARE_CORNER_SLOTS = [0, 2, 3];

/** True when si shares an edge with a filled slot (vacatedSi treated as empty). */
function squareFourSquareHasEdgeNeighborFilled(card, si, vacatedSi = null) {
  for (const nj of SQUARE_NEIGHBORS[si]) {
    if (nj === vacatedSi) continue;
    if (slotHasDie(card, nj)) return true;
  }
  return false;
}

/** True when card uses the 4-slot 2×2 grid (settings.fourSquare). */
function isFourSquareCard(card) {
  return settings.fourSquare && settings.square && (card?.slotCount ?? 3) === 4;
}

/** Slot indices active on a square card (3 L-slots or 4 full grid). */
function squareActiveSlotIndices(card) {
  return isFourSquareCard(card) ? [0, 1, 2, 3] : [0, 1, 2];
}

/** Active slot holds a die (inactive slots are `undefined`, empty are `null`). */
function slotHasDie(card, si) {
  const s = card.slots[si];
  return s !== undefined && s !== null;
}

/** Count of dice placed on a square card. */
export function squareFilledCount(cardId) {
  const card = state.cards[cardId];
  if (!card) return 0;
  return squareActiveSlotIndices(card).filter(si => slotHasDie(card, si)).length;
}

/** True when all playable dice slots on a card are filled (3 of 4 for fourSquare). */
export function isCardPlayableFull(cardId) {
  const card = state.cards[cardId];
  if (!card) return false;
  if (isFourSquareCard(card)) return squareFilledCount(cardId) === 3;
  return card.slots.every(s => s != null && s !== undefined);
}

function squareSlotValueMap(cardId) {
  const card = state.cards[cardId];
  const m = {};
  if (!card) return m;
  for (const si of squareActiveSlotIndices(card)) {
    if (slotHasDie(card, si)) m[si] = cardSlotValue(cardId, si);
  }
  return m;
}

function squareRankSlotsForSuit(suitSlot) {
  if (suitSlot === 0 || suitSlot === 3) return [1, 2];
  if (suitSlot === 2) return [0, 1];
  return [0, 2]; // suit at slot 1
}

/** All pip values on filled slots (order follows slot index). */
function squareFilledValues(cardId) {
  const card = state.cards[cardId];
  if (!card) return [];
  return squareActiveSlotIndices(card)
    .filter(si => slotHasDie(card, si))
    .map(si => cardSlotValue(cardId, si));
}

/**
 * Suit pip value from a multiset (any slot count).
 * Priority: duplicate (not 1/6) → has 6 alone → lowest valid;
 *           has 1 alone → highest valid; neither → highest valid;
 *           both 1 and 6 with 3 distinct → middle; else 0.
 */
function squareSuitValueFromValues(vals) {
  if (!vals.length) return 0;
  if (vals.length === 1) return vals[0];

  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const dupVal = vals.find(v => counts[v] > 1 && v !== 1 && v !== 6);
  if (dupVal !== undefined) return dupVal;

  const has6 = vals.includes(6);
  const has1 = vals.includes(1);
  const valid = vals.filter(v => v !== 1 && v !== 6);

  if (has6 && !has1 && valid.length > 0) return Math.min(...valid);
  if (has1 && !has6 && valid.length > 0) return Math.max(...valid);
  if (!has1 && !has6 && valid.length > 0) return Math.max(...valid);

  if (has1 && has6 && vals.length === 3 && new Set(vals).size === 3) {
    const mid = vals.find(v => v !== 1 && v !== 6);
    if (mid !== undefined) return mid;
  }

  return 0;
}

/** 4-square: slot holding the suit die; null unless 3 dice. Tie: lowest slot index. */
function squareFourSquareSuitSlot(cardId) {
  const card = state.cards[cardId];
  const filled = squareActiveSlotIndices(card).filter(si => slotHasDie(card, si));
  if (filled.length !== 3) return null;
  const suitVal = squareSuitValueFromValues(filled.map(si => cardSlotValue(cardId, si)));
  if (!suitVal) return null;
  return filled.find(si => cardSlotValue(cardId, si) === suitVal) ?? null;
}

/** Rank slot pair for scoring/rank sum; null when unavailable. */
export function squareRankSlots(cardId) {
  const card = state.cards[cardId];
  if (!card) return null;
  if (isFourSquareCard(card)) {
    const filled = squareActiveSlotIndices(card).filter(si => slotHasDie(card, si));
    if (filled.length !== 3) return null;
    const suitSlot = squareFourSquareSuitSlot(cardId);
    if (suitSlot === null) return null;
    return filled.filter(si => si !== suitSlot);
  }
  const suitSlot = squareSuitSlot(cardId);
  if (suitSlot === null) return null;
  return squareRankSlotsForSuit(suitSlot);
}

/**
 * Determine suit slot from up to four slot-indexed values (sparse map).
 * Corners 0, 2, 3 share preference tier; slot 1 is the edge/middle slot.
 */
function squareSuitSlotFromSlotMap(m) {
  const vals = SQUARE_CORNER_SLOTS.concat([1])
    .filter(si => m[si] !== undefined)
    .map(si => m[si]);

  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const dupVal = vals.find(v => counts[v] > 1 && v !== 1 && v !== 6);
  if (dupVal !== undefined) {
    for (const si of SQUARE_CORNER_SLOTS) {
      if (m[si] === dupVal) return si;
    }
    return 1;
  }

  const has6 = vals.includes(6);
  const has1 = vals.includes(1);

  if (has6 && !has1) {
    const valid = vals.filter(v => v !== 1 && v !== 6);
    if (valid.length > 0) {
      const sv = Math.min(...valid);
      for (const si of SQUARE_CORNER_SLOTS) {
        if (m[si] === sv) return si;
      }
      return 1;
    }
  }

  if (has1 && !has6) {
    const valid = vals.filter(v => v !== 1 && v !== 6);
    if (valid.length > 0) {
      const sv = Math.max(...valid);
      for (const si of SQUARE_CORNER_SLOTS) {
        if (m[si] === sv) return si;
      }
      return 1;
    }
  }

  if (!has1 && !has6) {
    const valid = vals.filter(v => v !== 1 && v !== 6);
    if (valid.length > 0) {
      const sv = Math.max(...valid);
      for (const si of SQUARE_CORNER_SLOTS) {
        if (m[si] === sv) return si;
      }
      return 1;
    }
  }

  if (has1 && has6) {
    const distinct = new Set(vals).size === 3;
    const mid = vals.find(v => v !== 1 && v !== 6);
    if (distinct && mid !== undefined) {
      for (const si of SQUARE_CORNER_SLOTS) {
        if (m[si] === mid) return si;
      }
      return 1;
    }
    return 1;
  }

  return 0;
}

/**
 * Determine suit slot index (0, 1, or 2) from three die values at slots 0–2.
 * Priority: (1) duplicate value (not 1/6) → corner 0 preferred over 2;
 *           (2) has 6 (no 1) → suit = lowest ≠ 1,6;
 *           (3) has 1 (no 6) → suit = highest ≠ 1,6;
 *           (4) no extreme   → highest ≠ 1,6;
 *           (5) both 1 and 6 → middle fallback (slot 1);
 *           (6) final fallback → slot 0.
 * Suit can land in slot 1 whenever the chosen value lives there.
 */
function squareSuitSlotFromValues(v0, v1, v2) {
  return squareSuitSlotFromSlotMap({ 0: v0, 1: v1, 2: v2 });
}

/** Suit slot index when three dice are placed; null otherwise. */
export function squareSuitSlot(cardId) {
  if (squareFilledCount(cardId) !== 3) return null;
  const card = state.cards[cardId];
  if (isFourSquareCard(card)) return squareFourSquareSuitSlot(cardId);
  const v0 = cardSlotValue(cardId, 0);
  const v1 = cardSlotValue(cardId, 1);
  const v2 = cardSlotValue(cardId, 2);
  return squareSuitSlotFromValues(v0, v1, v2);
}

function squareThirdSlotsFromPair(a, b) {
  const thirds = [];
  if (SQUARE_CW[a] === b) thirds.push(SQUARE_CW[b]);
  if (SQUARE_CCW[a] === b) thirds.push(SQUARE_CCW[b]);
  if (SQUARE_CW[b] === a) thirds.push(SQUARE_CW[a]);
  if (SQUARE_CCW[b] === a) thirds.push(SQUARE_CCW[a]);
  return thirds;
}

/** 4-square: edge-adjacent placement only (no diagonals); first die any slot. */
function squareFourSquareEdgeAdjacentAllowed(cardId, si, dieId = null) {
  const card = state.cards[cardId];
  if (!card || card.slots[si] === undefined) return false;
  if (slotHasDie(card, si)) return false;

  let vacatedSi = null;
  if (dieId != null) {
    const prevSlot = dieInCard(dieId);
    if (prevSlot) {
      const [pc, fs] = prevSlot.split('-').map(Number);
      if (pc === cardId) vacatedSi = fs;
    }
  }

  const filledSlots = squareActiveSlotIndices(card).filter(s =>
    slotHasDie(card, s) && s !== vacatedSi
  );

  if (filledSlots.length === 0) return true;
  if (filledSlots.length >= 3) return false;

  return squareFourSquareHasEdgeNeighborFilled(card, si, vacatedSi);
}

/** 4-square: any slot first; further dice edge-adjacent only (no diagonals); third via CW/CCW. */
function squareSlotAllowedFourSquare(cardId, si, dieId = null) {
  if (!squareFourSquareEdgeAdjacentAllowed(cardId, si, dieId)) return false;

  const card = state.cards[cardId];
  let vacatedSi = null;
  if (dieId != null) {
    const prevSlot = dieInCard(dieId);
    if (prevSlot) {
      const [pc, fs] = prevSlot.split('-').map(Number);
      if (pc === cardId) vacatedSi = fs;
    }
  }

  const filledSlots = squareActiveSlotIndices(card).filter(s =>
    slotHasDie(card, s) && s !== vacatedSi
  );

  const isRearrangeToEmpty = vacatedSi != null && squareFilledCount(cardId) === 3;
  if (filledSlots.length === 1 || isRearrangeToEmpty) return true;

  const thirds = new Set();
  for (const [a, b] of [[filledSlots[0], filledSlots[1]], [filledSlots[1], filledSlots[0]]]) {
    for (const t of squareThirdSlotsFromPair(a, b)) thirds.add(t);
  }
  return thirds.has(si);
}

/**
 * Returns true when slot si is the correct next slot to fill on a square card.
 * Enforces CW (0→1→2) / CCW (2→1→0) fill order; slot 1 is never first.
 */
function squareSlotAllowed(cardId, si, dieId = null) {
  const card = state.cards[cardId];
  if (!card || card.slots[si] === undefined) return false;
  if (slotHasDie(card, si)) return false;

  if (isFourSquareCard(card)) return squareSlotAllowedFourSquare(cardId, si, dieId);

  const slotCount = card.slotCount ?? 3;
  if (slotCount === 2) {
    const filled = squareFilledCount(cardId);
    if (filled === 0) return si === 0 || si === 2;
    if (filled === 1) return si === 0 || si === 2;
    return false;
  }
  if (slotCount === 1) return si === 1;

  const s0 = slotHasDie(card, 0);
  const s1 = slotHasDie(card, 1);
  const s2 = slotHasDie(card, 2);
  const filled = squareFilledCount(cardId);

  if (filled === 0) return true; // first die: any active slot
  if (filled === 1) {
    if (s0 && !s1 && !s2) return si === 1; // CW started: next must be slot 1
    if (!s0 && !s1 && s2) return si === 1; // CCW started: next must be slot 1
    if (s1 && !s0 && !s2) return si === 0 || si === 2; // paid-path: slot 1 placed first
    return false;
  }
  if (filled === 2) {
    if (s0 && s1 && !s2) return si === 2; // CW: complete with slot 2
    if (!s0 && s1 && s2) return si === 0; // CCW: complete with slot 0
    if (s0 && !s1 && s2) return si === 1; // defensive: both corners filled first
    return false;
  }
  return false; // card full
}

/**
 * True when a placed die on a square card cannot be selected or dragged.
 * Classic 3-slot: when all three slots are filled, slot 1 is locked until a corner is emptied;
 * when slot 1 and exactly one corner are filled, corners are locked until slot 1 is moved.
 * 4-square at 3 dice: only current-roll dice in slots edge-adjacent to the index tile may move.
 */
export function squareDieLocked(cardId, si) {
  if (!settings.square) return false;
  const card = state.cards[cardId];
  if (!card) return false;

  if (isFourSquareCard(card)) {
    if (squareFilledCount(cardId) !== 3) return false;
    const indexSlot = squareIndexSlot(cardId);
    if (indexSlot === null) return true;
    const dieId = card.slots[si];
    if (dieId == null || !state.currentRoll.includes(dieId)) return true;
    return !SQUARE_NEIGHBORS[indexSlot].includes(si);
  }

  if (!settings.placementRestrictions) return false;

  if ((card.slotCount ?? 3) !== 3) return false;
  const s0 = slotHasDie(card, 0);
  const s1 = slotHasDie(card, 1);
  const s2 = slotHasDie(card, 2);
  if (s0 && s1 && s2) return si === 1;
  if (s1 && s0 !== s2) return si === 0 || si === 2;
  return false;
}


/** Valid 3-step fill orders for a fourSquare card after simulating a full placement. */
function squareFillOrdersFourSquare(sim, activeIndices) {
  const filled = activeIndices.filter(si => sim[si] != null);
  if (filled.length !== 3) return [];
  const orders = [];
  const seen = new Set();
  for (const start of filled) {
    for (const nextFn of [SQUARE_CW, SQUARE_CCW]) {
      const order = [start];
      let cur = start;
      for (let i = 0; i < 2; i++) {
        cur = nextFn[cur];
        if (!filled.includes(cur)) { order.length = 0; break; }
        order.push(cur);
      }
      if (order.length === 3) {
        const sig = order.join(',');
        if (!seen.has(sig)) { seen.add(sig); orders.push(order); }
      }
    }
  }
  return orders;
}

/** Returns the slot-index orders that are still valid for the given slot occupancy. */
function squareFillOrders(s0, s1, s2) {
  // Both orders possible when card is empty or corners-only
  if (!s0 && !s1 && !s2) return [[0, 1, 2], [2, 1, 0]];
  if (s0 && !s1 && s2)   return [[0, 1, 2], [2, 1, 0]]; // both corners placed (paid path or skipped mid)
  if (s0)  return [[0, 1, 2]]; // CW started
  if (s2)  return [[2, 1, 0]]; // CCW started
  return [[0, 1, 2], [2, 1, 0]]; // only slot 1 filled (paid): either direction still possible
}

/** True when all three values differ and both 1 and 6 are present (wrap-around triple). */
function squareIsWrapTriple(v0, v1, v2) {
  return v0 !== v1 && v1 !== v2 && v0 !== v2 &&
         [v0, v1, v2].includes(1) && [v0, v1, v2].includes(6);
}

/** One step non-decreasing with 6→1 wrap allowed. */
function squareStepIncreasing(a, b) {
  if (a === b) return true;
  if (b > a) return true;
  return a === 6 && b === 1;
}

/** One step non-increasing with 1→6 wrap allowed. */
function squareStepDecreasing(a, b) {
  if (a === b) return true;
  if (b < a) return true;
  return a === 1 && b === 6;
}

/** True if values along a fill order are monotonic (repeats/skips OK; 6↔1 wrap OK). */
function squareIsMonotonic(vals) {
  return (squareStepIncreasing(vals[0], vals[1]) && squareStepIncreasing(vals[1], vals[2])) ||
         (squareStepDecreasing(vals[0], vals[1]) && squareStepDecreasing(vals[1], vals[2]));
}

/**
 * Returns false only when placing dieId at si would make the three values
 * non-monotonic along every valid fill-order path.
 * Clears the die's current slot first so a move within the same card is simulated correctly.
 */
function squareValuesMonotonicAfterPlace(cardId, si, dieId) {
  const card = state.cards[cardId];
  if (!card) return true;
  if (isFourSquareCard(card)) {
    if (squareFilledCount(cardId) < 2) return true;
    const sim = [...card.slots];
    const prevSlot = dieInCard(dieId);
    if (prevSlot) {
      const [pc, ps] = prevSlot.split('-').map(Number);
      if (pc === cardId) sim[ps] = null;
    }
    sim[si] = dieId;
    const filled = squareActiveSlotIndices(card).filter(s => sim[s] != null);
    if (filled.length !== 3) return true;
    const valAt = (slot) => state.dice[sim[slot]]?.value;
    const orders = squareFillOrdersFourSquare(sim, squareActiveSlotIndices(card));
    return orders.some(order => squareIsMonotonic(order.map(valAt)));
  }

  if ((card.slotCount ?? 3) !== 3) return true;
  if (squareFilledCount(cardId) < 2) return true; // only check the 3rd placement

  const sim = [...card.slots];
  // If this die already lives on this card, clear its old slot so the simulation is clean
  const prevSlot = dieInCard(dieId);
  if (prevSlot) {
    const [pc, ps] = prevSlot.split('-').map(Number);
    if (pc === cardId) sim[ps] = null;
  }
  sim[si] = dieId;
  if (sim.some(s => s == null)) return true;

  const v0 = state.dice[sim[0]]?.value;
  const v1 = state.dice[sim[1]]?.value;
  const v2 = state.dice[sim[2]]?.value;
  if (v0 === undefined || v1 === undefined || v2 === undefined) return true;

  const s0 = slotHasDie(card, 0);
  const s2 = slotHasDie(card, 2);
  // Compute orders from the pre-placement state (not the sim) so winding reflects history
  const orders = squareFillOrders(s0, false, s2);
  const vals = [v0, v1, v2];
  return orders.some(order => squareIsMonotonic([vals[order[0]], vals[order[1]], vals[order[2]]]));
}

/** Layout alignment derived from filled slots and suit position. */
export function squareAlignment(cardId) {
  const card = state.cards[cardId];
  if (!card) return 'center';
  if (isFourSquareCard(card)) return 'center';

  const s0 = slotHasDie(card, 0);
  const s1 = slotHasDie(card, 1);
  const s2 = slotHasDie(card, 2);
  if (s0 && s1 && !s2) return 'horizontal';
  if (!s0 && s1 && s2) return 'vertical';
  if (s0 && s1 && s2) {
    const v0 = cardSlotValue(cardId, 0);
    const v1 = cardSlotValue(cardId, 1);
    const v2 = cardSlotValue(cardId, 2);
    if (isTricolorCard(cardId) || squareIsWrapTriple(v0, v1, v2)) return 'center';
    // Derive from suit slot: suit at 0 → rank in 1+2 (vertical bar); suit at 2 → rank in 0+1 (horizontal); suit at 1 → center
    const ss = squareSuitSlot(cardId);
    if (ss === 1) return 'center';
    if (ss === 0) return 'vertical';
    return 'horizontal';
  }
  return 'center';
}

/** Persist layout on the card so re-renders stay stable across state reads. */
export function updateSquareLayout(cardId) {
  const card = state.cards[cardId];
  if (!card) return;
  if (isFourSquareCard(card)) {
    card.squareLayout = 'center';
    return;
  }
  const s0 = slotHasDie(card, 0);
  const s1 = slotHasDie(card, 1);
  const s2 = slotHasDie(card, 2);
  if (s0 && s1 && !s2) card.squareLayout = 'horizontal';
  else if (!s0 && s1 && s2) card.squareLayout = 'vertical';
  else if (s0 && s1 && s2) {
    const v0 = cardSlotValue(cardId, 0);
    const v1 = cardSlotValue(cardId, 1);
    const v2 = cardSlotValue(cardId, 2);
    if (isTricolorCard(cardId) || squareIsWrapTriple(v0, v1, v2)) card.squareLayout = 'center';
    else {
      const ss = squareSuitSlot(cardId);
      card.squareLayout = ss === 1 ? 'center' : ss === 0 ? 'vertical' : 'horizontal';
    }
  } else if (s0 && !s1 && s2) card.squareLayout = 'center';
  else if (squareFilledCount(cardId) <= 1) card.squareLayout = 'center';
}

/** Stub for future partial sweeps (< 3 cards on line). */
export function squarePartialConverted(cardId) {
  void cardId;
  return false;
}

/** Combined index string for square card display. */
export function squareDisplayIndex(cardId) {
  const count = squareFilledCount(cardId);
  if (count === 0) return ' ';
  if (count === 1) {
    const suit = cardSuit(cardId);
    return suit || '*';
  }
  if (count === 2) return cardRank(cardId);
  const rank = cardRank(cardId);
  const suit = cardSuit(cardId);
  if (rank === 'gg') {
    if (suit === 'V') return 'V';
    if (isFourSquareCard(state.cards[cardId])) return suit || '*';
    return suit ? `*${suit}` : '*';
  }
  return `${rank}${suit}`;
}

/** Index text color for square unfilled cards. */
export function squareIndexColor(cardId) {
  const count = squareFilledCount(cardId);
  if (count === 1 || count === 3) {
    const suit = cardSuit(cardId);
    return suit ? SUIT_COLOR[suit] : '#9A9FB6';
  }
  return '#9A9FB6';
}

/** 4-square: grid slot that shows the index tile (0–3), or null when empty card. */
export function squareIndexSlot(cardId) {
  const card = state.cards[cardId];
  if (!isFourSquareCard(card)) return null;
  const filled = squareFilledCount(cardId);
  if (filled === 0) return null;
  if (!settings.partialUniqueIndex && filled === 1) return null;
  const empty = [0, 1, 2, 3].filter(si => !slotHasDie(card, si));
  if (empty.length === 1) return empty[0];
  const slotAllowed = (slotIdx) => settings.placementRestrictions
    ? squareSlotAllowedFourSquare(cardId, slotIdx)
    : squareFourSquareEdgeAdjacentAllowed(cardId, slotIdx);
  return empty.find(si => !slotAllowed(si)) ?? null;
}

/** 4-square index tile colours (Figma 5496:8876). */
export function squareIndexTileColor(cardId) {
  const count = squareFilledCount(cardId);
  const grey = '#9A9FB6';
  if (count === 2) return { bg: grey, border: null };
  const suit = cardSuit(cardId);
  const bg = suit ? SUIT_COLOR[suit] : grey;
  const border = count === 3 && suit ? bg : null;
  return { bg, border };
}

function squareRankPipPair(cardId) {
  const rankSlots = squareRankSlots(cardId);
  if (!rankSlots || rankSlots.length !== 2) return null;
  const idA = state.cards[cardId]?.slots[rankSlots[0]];
  const idB = state.cards[cardId]?.slots[rankSlots[1]];
  if (idA == null || idB == null) return null;
  return [state.dice[idA].value, state.dice[idB].value].sort((a, b) => a - b).join(',');
}

function squareCardRank(cardId) {
  if (isTricolorCard(cardId)) return 'gg';
  const card = state.cards[cardId];
  const count = squareFilledCount(cardId);
  if (count === 0) return ' ';
  if (count === 1) return '';
  if (count === 2) {
    const indices = squareActiveSlotIndices(card);
    const filledSlots = indices.filter(si => slotHasDie(card, si));
    const va = cardSlotValue(cardId, filledSlots[0]);
    const vb = cardSlotValue(cardId, filledSlots[1]);
    if (isFourSquareCard(card)) {
      if ((va === 1 && vb === 6) || (va === 6 && vb === 1)) return 'A';
      return ndTranscribe(va + vb);
    }
    const adjacentRank = (filledSlots[0] === 0 && filledSlots[1] === 1) ||
      (filledSlots[0] === 1 && filledSlots[1] === 2);
    if (adjacentRank && ((va === 1 && vb === 6) || (va === 6 && vb === 1))) return 'A';
    return ndTranscribe(va + vb);
  }
  if (isJokerCard(cardId)) return 'A';
  const rankSlots = squareRankSlots(cardId);
  if (!rankSlots) return ' ';
  const sum = cardSlotValue(cardId, rankSlots[0]) + cardSlotValue(cardId, rankSlots[1]);
  return ndTranscribe(sum);
}

function squareCardSuit(cardId) {
  const card = state.cards[cardId];
  const count = squareFilledCount(cardId);
  if (count === 0) return '';
  if (isFourSquareCard(card)) {
    if (isTricolorCard(cardId)) return tricolorSuitFromCombo(tricolorComboKey(cardId));
    const suitVal = squareSuitValueFromValues(squareFilledValues(cardId));
    return suitVal ? SUIT_LETTER[suitVal] : '';
  }
  if (count === 2) return '';
  if (count === 1) {
    const indices = squareActiveSlotIndices(card);
    const si = indices.find(i => slotHasDie(card, i));
    return SUIT_LETTER[cardSlotValue(cardId, si)];
  }
  if (isTricolorCard(cardId)) return tricolorSuitFromCombo(tricolorComboKey(cardId));
  return SUIT_LETTER[cardSlotValue(cardId, squareSuitSlot(cardId))];
}

function squareCardColor(cardId) {
  const count = squareFilledCount(cardId);
  if (count === 1 || count === 3) {
    const suit = squareCardSuit(cardId);
    return suit ? SUIT_COLOR[suit] : '#9A9FB6';
  }
  return '#9A9FB6';
}

/* ── Card helpers ── */
export function dieInCard(dieId) {
  for (const card of state.cards) {
    for (let si = 0; si < card.slots.length; si++) {
      if (card.slots[si] === dieId) return `${card.id}-${si}`;
    }
  }
  return null;
}

export function cardSlotValue(cardId, si) {
  const id = state.cards[cardId]?.slots[si];
  return (id !== null && id !== undefined) ? state.dice[id].value : 0;
}

export function isJokerCard(cardId) {
  const c = state.cards[cardId];
  if (!c) return false;
  if (settings.square) {
    if (squareFilledCount(cardId) !== 3) return false;
    const rankSlots = squareRankSlots(cardId);
    if (!rankSlots) return false;
    const vA = cardSlotValue(cardId, rankSlots[0]);
    const vB = cardSlotValue(cardId, rankSlots[1]);
    return (vA === 1 && vB === 6) || (vA === 6 && vB === 1);
  }
  if (c.slots[0] === null || c.slots[2] === null) return false;
  const v0 = cardSlotValue(cardId, 0), v2 = cardSlotValue(cardId, 2);
  return (v0 === 1 && v2 === 6) || (v0 === 6 && v2 === 1);
}

export function allThreeColoredCard(cardId) {
  const c = state.cards[cardId];
  if (!c || (c.slotCount ?? 3) < 3) return false;
  // Use loose != to safely handle undefined (inactive) slots
  const vals = c.slots.map(id => id != null ? state.dice[id].value : null);
  if (vals.some(v => v === null || v < 2 || v > 5)) return false;
  return new Set(vals).size === 3;
}

export function cardRank(cardId) {
  if (settings.square) return squareCardRank(cardId);
  if (isTricolorCard(cardId)) return 'gg';
  if (isJokerCard(cardId)) return 'A';
  const c = state.cards[cardId];
  if (c) {
    if ((c.slotCount ?? 3) === 1) return '*';
    const id0 = c.slots[0], id2 = c.slots[2];
    if (id0 !== null && id2 !== null &&
        state.dice[id0]?.value === 0 && state.dice[id2]?.value === 0) return '*';
  }
  const sum = cardSlotValue(cardId, 0) + cardSlotValue(cardId, 2);
  return sum === 0 ? ' ' : ndTranscribe(sum);
}

export function cardMiddleValue(cardId) {
  const id = state.cards[cardId]?.slots[1];
  return (id !== null && id !== undefined) ? state.dice[id].value : null;
}

export function cardSuit(cardId) {
  if (settings.square) return squareCardSuit(cardId);
  const v = cardMiddleValue(cardId);
  return v !== null ? SUIT_LETTER[v] : '';
}

export function cardColor(cardId) {
  if (settings.square) return squareCardColor(cardId);
  const v = cardMiddleValue(cardId);
  return v !== null ? PIP_COLOR[v] : null;
}

/** Identity key snapshotted at fill time (requires active slots to hold dice). */
export function snapshotCardIdentity(cardId) {
  const card = state.cards[cardId];
  if (!card) return null;
  if (settings.square) {
    if (squareFilledCount(cardId) !== 3) return null;
    if (isTricolorCard(cardId)) {
      return `T:${tricolorSevenKey(cardId)}:${cardSuit(cardId)}`;
    }
    if (isJokerCard(cardId)) return '3:A:V';
    const suit = cardSuit(cardId);
    const pair = squareRankPipPair(cardId);
    return pair ? `3:${suit}:${pair}` : null;
  }
  const slotCount = card.slotCount ?? 3;
  if (slotCount === 1) {
    if (card.slots[1] == null) return null;
    return `1:${cardSuit(cardId)}`;
  }
  if (slotCount === 2) return dominoIdentityKey('2:V', cardId);
  if (card.slots[1] == null) return null;
  if (isTricolorCard(cardId)) {
    return `T:${tricolorSevenKey(cardId)}:${cardSuit(cardId)}`;
  }
  if (isJokerCard(cardId)) return '3:A:V';
  const suit = cardSuit(cardId);
  return dominoIdentityKey(`3:${suit}`, cardId);
}

/** Stable identity key for deduplicating discovered cards (game-over summary). */
export function cardIdentityKey(cardId) {
  const card = state.cards[cardId];
  if (!card) return `?:${cardId}`;
  if (card.discoveryKey) return card.discoveryKey;
  return snapshotCardIdentity(cardId) ?? `?:${cardId}`;
}

/* ── Slot constraints ── */

/** True when every placed die on active slots is 1 and/or 6. */
function cardAllPlacedValuesAreExtremes(cardId) {
  const card = state.cards[cardId];
  if (!card) return false;
  const vals = [];
  for (let i = 0; i < card.slots.length; i++) {
    if (slotHasDie(card, i)) vals.push(state.dice[card.slots[i]].value);
  }
  return vals.length > 0 && vals.every(v => v === 1 || v === 6);
}

/** True when placing dieId would complete the card with only 1s and/or 6s (111, 116, 661, 666, …). */
function wouldCompleteAllExtremes(cardId, si, dieId) {
  const card = state.cards[cardId];
  if ((card?.slotCount ?? 3) === 1) return false;
  return withSimulatedGridSlots(buildSimulatedSlotsForMove(dieId, cardId, si), () => {
    if (!isCardPlayableFull(cardId)) return false;
    return cardAllPlacedValuesAreExtremes(cardId);
  });
}

/** True when placing dieId in slot si would give cardId a rank that appears in the cool-off row. */
function wouldCreateCoolOffRank(cardId, si, dieId) {
  if (!isCoolOffActive()) return false;
  const card = state.cards[cardId];
  if (!card || !isFourSquareCard(card)) return false;
  return withSimulatedGridSlots(buildSimulatedSlotsForMove(dieId, cardId, si), () => {
    const rank = cardRank(cardId);
    if (!rank || rank === ' ') return false;
    return isRankCoolOffBlocked(cardId);
  });
}

/** Returns true when placing dieId in slot si of cardId is forbidden by game rules. */
export function isSlotForbidden(cardId, si, dieId) {
  const card = state.cards[cardId];
  // Inactive (undefined) slots are always forbidden
  if (card?.slots[si] === undefined) return true;

  if (wouldCompleteAllExtremes(cardId, si, dieId)) return true;
  if (wouldCreateCoolOffRank(cardId, si, dieId)) return true;

  const isFirstDie = cardPlacedDiceCount(cardId) === 0;

  if (!isFirstDie) {
    if (settings.placementRestrictions) {
    if (settings.square && isFourSquareCard(card)) {
      if (!squareSlotAllowed(cardId, si, dieId)) return true;
      if (!squareValuesMonotonicAfterPlace(cardId, si, dieId)) return true;
    } else if (settings.square && (card.slotCount ?? 3) === 3) {
      const prevSlot = dieInCard(dieId);
      const isSameCardCornerMove = prevSlot && (() => {
        const [pc, fromSi] = prevSlot.split('-').map(Number);
        return pc === cardId && ((fromSi === 0 && si === 2) || (fromSi === 2 && si === 0));
      })();

      if (!isSameCardCornerMove && !squareSlotAllowed(cardId, si)) return true;
      if (!squareValuesMonotonicAfterPlace(cardId, si, dieId)) return true;
      if (prevSlot) {
        const [pc, fromSi] = prevSlot.split('-').map(Number);
        if (pc === cardId && fromSi === 1 && (si === 0 || si === 2)) return true;
        if (pc === cardId && (fromSi === 0 || fromSi === 2) && si === 1) return true;
      }
    } else if (settings.square && !squareSlotAllowed(cardId, si)) {
      return true;
    }

    if (!settings.forbiddenSlots && !settings.paidSlots) {
      return settings.uniqueIndex || settings.square
        ? wouldCreateDuplicate(cardId, si, dieId) : false;
    }
    const dieVal = state.dice[dieId]?.value;
    const isBlank = dieVal === 0;

    if (si === 0 || si === 2) {
      if (isBlank) {
        if (!settings.blanksInRank) return true;
        const otherSi = si === 0 ? 2 : 0;
        const otherId = state.cards[cardId]?.slots[otherSi];
        if (otherId !== null && otherId !== undefined && state.dice[otherId]?.value !== 0) return true;
      } else if (settings.blanksInRank) {
        const otherSi = si === 0 ? 2 : 0;
        const otherId = state.cards[cardId]?.slots[otherSi];
        if (otherId !== null && otherId !== undefined && state.dice[otherId]?.value === 0) return true;
      }
    }

    // For 1-slot cards (suit-only), allow any value in slot[1] — no extreme restriction
    const slotCount = card?.slotCount ?? 3;
    if (si === 1 && slotCount === 1) return wouldCreateDuplicate(cardId, si, dieId);

    if (settings.square) {
      return wouldCreateDuplicate(cardId, si, dieId);
    }

    return (si === 1 && (dieVal === 1 || dieVal === 6))
        || wouldCreateDuplicate(cardId, si, dieId);
    }

    if (settings.square && isFourSquareCard(card)) {
      if (!squareFourSquareEdgeAdjacentAllowed(cardId, si, dieId)) return true;
    }
  }

  if (!settings.forbiddenSlots && !settings.paidSlots) {
    return settings.uniqueIndex || settings.square
      ? wouldCreateDuplicate(cardId, si, dieId) : false;
  }
  return wouldCreateDuplicate(cardId, si, dieId);
}

function withSimulatedSlots(cardId, slots, fn) {
  const card = state.cards[cardId];
  const saved = card.slots;
  card.slots = slots;
  try {
    return fn();
  } finally {
    card.slots = saved;
  }
}

/** Slot snapshots for a move: clears source (if any) and places dieId at toCardId-toSi. */
function buildSimulatedSlotsForMove(dieId, toCardId, toSi) {
  const slotMap = {};
  const prevSlot = dieInCard(dieId);
  if (prevSlot) {
    const [pc, ps] = prevSlot.split('-').map(Number);
    const srcSim = [...state.cards[pc].slots];
    srcSim[ps] = null;
    slotMap[pc] = srcSim;
  }
  const base = slotMap[toCardId] ?? [...state.cards[toCardId].slots];
  const destSim = [...base];
  if (prevSlot) {
    const [pc, ps] = prevSlot.split('-').map(Number);
    if (pc === toCardId) destSim[ps] = null;
  }
  destSim[toSi] = dieId;
  slotMap[toCardId] = destSim;
  return slotMap;
}

/** Slot snapshot for removing dieId from its current card (tray return). */
function buildSimulatedSlotsForRemove(dieId) {
  const prevSlot = dieInCard(dieId);
  if (!prevSlot) return {};
  const [pc, ps] = prevSlot.split('-').map(Number);
  const srcSim = [...state.cards[pc].slots];
  srcSim[ps] = null;
  return { [pc]: srcSim };
}

function withSimulatedGridSlots(slotMap, fn) {
  const saved = new Map();
  for (const [cidStr, slots] of Object.entries(slotMap)) {
    const cardId = Number(cidStr);
    saved.set(cardId, state.cards[cardId].slots);
    state.cards[cardId].slots = slots;
  }
  try {
    return fn();
  } finally {
    for (const [cardId, slots] of saved) {
      state.cards[cardId].slots = slots;
    }
  }
}

/** True when two grid cards share the same placed-dice multiset (uniqueIndex rule). */
function gridHasDuplicateDiceKeys() {
  const seen = new Set();
  for (const gid of state.grid) {
    if (gid === null) continue;
    if (!settings.partialUniqueIndex && cardPlacedDiceCount(gid) <= 2) continue;
    const k = cardDiceValuesKey(gid);
    if (!k) continue;
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}


/** Normalise a die value for duplicate comparison.
 *  When colorRestriction + square are both ON, 1 and 6 share the same V-suit colour,
 *  so they are treated as equivalent (both mapped to 1). */
function normaliseDieValue(v) {
  return settings.colorRestriction && settings.square && v === 6 ? 1 : v;
}

/** Count of dice currently placed on a card (square fill count or active slots). */
function cardPlacedDiceCount(cardId) {
  const card = state.cards[cardId];
  if (!card) return 0;
  if (settings.square) return squareFilledCount(cardId);
  let n = 0;
  for (let si = 0; si < card.slots.length; si++) {
    if (slotHasDie(card, si)) n++;
  }
  return n;
}

/** Sorted multiset of normalised placed die values on active slots; null when empty. */
function cardDiceValuesKey(cardId) {
  const card = state.cards[cardId];
  if (!card) return null;
  const vals = [];
  for (let si = 0; si < card.slots.length; si++) {
    if (!slotHasDie(card, si)) continue;
    vals.push(normaliseDieValue(state.dice[card.slots[si]].value));
  }
  return vals.length ? vals.sort((a, b) => a - b).join(',') : null;
}

/** Unique-index rule: no two grid cards may hold the same multiset of placed dice. */
function wouldViolateUniqueIndex(cardId, si, dieId) {
  return withSimulatedGridSlots(buildSimulatedSlotsForMove(dieId, cardId, si), () => {
    const myDice = cardDiceValuesKey(cardId);
    if (!myDice) return false;

    const myCount = cardPlacedDiceCount(cardId);
    if (!settings.partialUniqueIndex && myCount <= 2) return false;

    for (const gid of state.grid) {
      if (gid === null || gid === cardId) continue;
      if (!settings.partialUniqueIndex && cardPlacedDiceCount(gid) <= 2) continue;
      const theirDice = cardDiceValuesKey(gid);
      if (theirDice && theirDice === myDice) return true;
    }
    return false;
  });
}

export function wouldCreateDuplicate(cardId, si, dieId) {
  if (settings.uniqueIndex) return wouldViolateUniqueIndex(cardId, si, dieId);

  const card = state.cards[cardId];
  if (!card) return false;

  // No duplicate enforcement for reduced-slot cards
  if ((card.slotCount ?? 3) < 3) return false;

  return withSimulatedGridSlots(buildSimulatedSlotsForMove(dieId, cardId, si), () => {
    const sim = state.cards[cardId].slots;

    if (isFourSquareCard(card)) {
      if (squareFilledCount(cardId) !== 3) return false;
      const m = squareSlotValueMap(cardId);
      const suitSlot = squareFourSquareSuitSlot(cardId);
      const rankSlots = squareRankSlots(cardId);
      if (suitSlot === null || !rankSlots) return false;
      const suit = SUIT_LETTER[m[suitSlot]];
      const va = m[rankSlots[0]];
      const vb = m[rankSlots[1]];
      const rankSum = va + vb;
      const tricolorKey = settings.tricolor ? sortedComboKey(Object.values(m)) : null;
      if (tricolorKey) {
        const triSuit = tricolorSuitFromCombo(tricolorKey);
        for (const gid of state.grid) {
          if (gid === null || gid === cardId) continue;
          const gc = state.cards[gid];
          if (!gc) continue;
          if (!gc.filled && !isCardPlayableFull(gid)) continue;
          if (cardSuit(gid) !== triSuit) continue;
          if (tricolorSevenKey(gid) === tricolorKey) return true;
        }
        return false;
      }
      const isJoker = rankSum === 7 && ((va === 1 && vb === 6) || (va === 6 && vb === 1));
      const rank = isJoker ? 'A' : ndTranscribe(rankSum);
      const rankPair = [va, vb].sort((a, b) => a - b).join(',');
      for (const gid of state.grid) {
        if (gid === null || gid === cardId) continue;
        const gc = state.cards[gid];
        if (!gc) continue;
        if (!gc.filled && !isCardPlayableFull(gid)) continue;
        if (cardSuit(gid) !== suit) continue;
        if (suit === 'V') {
          const theirPair = squareRankPipPair(gid) ?? strictRankPipPair(gid);
          if (theirPair === rankPair) return true;
        } else if (cardRank(gid) === rank) {
          return true;
        }
      }
      return false;
    }

    if (sim.some(s => s === null)) return false;

    const v0 = state.dice[sim[0]].value;
    const v1 = state.dice[sim[1]].value;
    const v2 = state.dice[sim[2]].value;

    if (settings.square) {
    const suitSlot = squareSuitSlotFromValues(v0, v1, v2);
    const suit = SUIT_LETTER[[v0, v1, v2][suitSlot]];
    let rankSum;
    if (suitSlot === 0)      rankSum = v1 + v2;
    else if (suitSlot === 2) rankSum = v0 + v1;
    else                     rankSum = v0 + v2; // suit at slot 1
    const tricolorKey = settings.tricolor ? sortedComboKey([v0, v1, v2]) : null;
    if (tricolorKey) {
      const triSuit = tricolorSuitFromCombo(tricolorKey);
      for (const gid of state.grid) {
        if (gid === null || gid === cardId) continue;
        const gc = state.cards[gid];
        if (!gc) continue;
        if (!gc.filled && gc.slots.some(s => s === null)) continue;
        if (cardSuit(gid) !== triSuit) continue;
        if (tricolorSevenKey(gid) === tricolorKey) return true;
      }
      return false;
    }
    const rankSlots = squareRankSlotsForSuit(suitSlot);
    const [va, vb] = rankSlots.map(i => [v0, v1, v2][i]);
    const isJoker = rankSum === 7 && ((va === 1 && vb === 6) || (va === 6 && vb === 1));
    const rank = isJoker ? 'A' : ndTranscribe(rankSum);
    const rankPair = [va, vb].sort((a, b) => a - b).join(',');
    for (const gid of state.grid) {
      if (gid === null || gid === cardId) continue;
      const gc = state.cards[gid];
      if (!gc) continue;
      if (!gc.filled && gc.slots.some(s => s === null)) continue;
      if (cardSuit(gid) !== suit) continue;
      if (suit === 'V') {
        const theirPair = squareRankPipPair(gid) ?? strictRankPipPair(gid);
        if (theirPair === rankPair) return true;
      } else if (cardRank(gid) === rank) {
        return true;
      }
    }
    return false;
  }

  const suit = SUIT_LETTER[v1];

  const tricolorKey = settings.tricolor && v0 + v2 === 7 ? sortedComboKey([v0, v1, v2]) : null;
  if (tricolorKey) {
    for (const gid of state.grid) {
      if (gid === null || gid === cardId) continue;
      const gc = state.cards[gid];
      if (!gc) continue;
      if (!gc.filled && gc.slots.some(s => s === null)) continue;
      if (cardSuit(gid) !== suit) continue;
      if (tricolorSevenKey(gid) === tricolorKey) return true;
    }
    return false;
  }

  const isJoker = (v0 === 1 && v2 === 6) || (v0 === 6 && v2 === 1);
  const rank = isJoker ? 'A' : ndTranscribe(v0 + v2);

  for (const gid of state.grid) {
    if (gid === null || gid === cardId) continue;
    const gc = state.cards[gid];
    if (!gc) continue;
    if (!gc.filled && gc.slots.some(s => s === null)) continue;
    if (cardSuit(gid) !== suit) continue;
    if (suit === 'V') {
      const gv0 = state.dice[gc.slots[0]]?.value;
      const gv2 = state.dice[gc.slots[2]]?.value;
      if (gv0 === undefined || gv2 === undefined) continue;
      const me   = [v0, v2].sort((a, b) => a - b).join(',');
      const them = [gv0, gv2].sort((a, b) => a - b).join(',');
      if (me === them) return true;
    } else {
      if (cardRank(gid) === rank) return true;
    }
  }
  return false;
  });
}

/** True when dieId can be selected: at least one legal move (incl. tray return) avoids duplicates. */
export function isDieSelectable(dieId) {
  if (!state.currentRoll.includes(dieId)) return false;

  const prevSlot = dieInCard(dieId);

  if (prevSlot) {
    const removeMap = buildSimulatedSlotsForRemove(dieId);
    const removeOk = !withSimulatedGridSlots(removeMap, () =>
      settings.uniqueIndex ? gridHasDuplicateDiceKeys() : false);
    if (removeOk) return true;
  }

  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (!card || card.filled || card.empty) continue;
    for (let si = 0; si < card.slots.length; si++) {
      if (card.slots[si] !== null || card.slots[si] === undefined) continue;
      if (!isSlotForbidden(cardId, si, dieId)) return true;
    }
  }

  return false;
}

/** SQUARE: directly opposite slot pairs that may spawn grid coins (no diagonals). */
const GRID_COIN_H_CLASSIC = [[1, 0]]; // left TR ↔ right TL
const GRID_COIN_V_CLASSIC = [[2, 1]]; // top BR ↔ bottom TR
const GRID_COIN_H_FOUR    = [[1, 0], [2, 3]]; // top row + bottom row
const GRID_COIN_V_FOUR    = [[2, 1], [3, 0]]; // right column + left column

function gridCoinEdgePairs() {
  if (settings.fourSquare && settings.square) {
    return { horizontal: GRID_COIN_H_FOUR, vertical: GRID_COIN_V_FOUR };
  }
  return { horizontal: GRID_COIN_H_CLASSIC, vertical: GRID_COIN_V_CLASSIC };
}

function gridCoinKey(gridA, gridB, slotA, slotB) {
  return `${gridA}:${gridB}:${slotA}:${slotB}`;
}

function tryAddAlignedGridCoin(matches, gridA, gridB, slotA, slotB) {
  const idA = state.grid[gridA];
  const idB = state.grid[gridB];
  if (idA == null || idB == null) return;
  const cardA = state.cards[idA];
  const cardB = state.cards[idB];
  if (!cardA || !cardB) return;
  if (settings.gridCoinsExcludeConverted && (cardA.filled || cardB.filled)) return;
  if (!slotHasDie(cardA, slotA) || !slotHasDie(cardB, slotB)) return;
  const dA = cardA.slots[slotA];
  const dB = cardB.slots[slotB];
  const vA = normaliseDieValue(state.dice[dA]?.value);
  const vB = normaliseDieValue(state.dice[dB]?.value);
  const extreme = vA === 1 || vA === 6 || vB === 1 || vB === 6;
  const qualifies = !extreme && (settings.gridCoinsSum7 ? vA !== vB : vA === vB);
  if (qualifies) matches.add(gridCoinKey(gridA, gridB, slotA, slotB));
}

/** SQUARE mode: rebuild active gridCoins from adjacent matching dice pairs. */
export function refreshGridCoins() {
  const matches = new Set();
  if (!settings.square || !settings.scoring) {
    state.gridCoins = matches;
    return;
  }
  const size = settings.extendedGrid ? 4 : 3;
  const { horizontal, vertical } = gridCoinEdgePairs();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const a = r * size + c;
      const b = a + 1;
      for (const [slotA, slotB] of horizontal) {
        tryAddAlignedGridCoin(matches, a, b, slotA, slotB);
      }
    }
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      const a = r * size + c;
      const b = a + size;
      for (const [slotA, slotB] of vertical) {
        tryAddAlignedGridCoin(matches, a, b, slotA, slotB);
      }
    }
  }
  for (const key of state.collectedGridCoins) {
    if (!matches.has(key)) state.collectedGridCoins.delete(key);
  }
  state.gridCoins = new Set([...matches].filter(k => !state.collectedGridCoins.has(k)));
}
