import { state } from './state.js';
import { settings } from './settings.js';

/* ── Color & pip data ── */
export const PIP_COLOR = {
  0: '#CCB400', // blank → V suit color
  1: '#FFFFFF', 2: '#7161FF', 3: '#CC5529',
  4: '#5DB22D', 5: '#25A5CC', 6: '#FFFFFF', 7: '#CCB400',
};

export const DIE_PIP_COLOR = {
  0: '#CCB400',
  1: '#070D1A', 2: '#7161FF', 3: '#CC5529',
  4: '#5DB22D', 5: '#25A5CC', 6: '#070D1A', 7: '#CCB400',
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
export const SUIT_COLOR    = { V:'#CCB400', Z:'#7161FF', X:'#CC5529', Y:'#5DB22D', W:'#25A5CC' };
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
  if (!card || (card.slotCount ?? 3) !== 3) return null;
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
  if (slotCount === 2) {
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

/** Active slot holds a die (inactive slots are `undefined`, empty are `null`). */
function slotHasDie(card, si) {
  const s = card.slots[si];
  return s !== undefined && s !== null;
}

/** Count of dice placed on a square card. */
export function squareFilledCount(cardId) {
  const card = state.cards[cardId];
  if (!card) return 0;
  return [0, 1, 2].filter(si => slotHasDie(card, si)).length;
}

/**
 * Determine suit slot index (0, 1, or 2) from three die values.
 * Priority: (1) duplicate value (not 1/6) → corner 0 preferred over 2;
 *           (2) has 6 (no 1) → suit = lowest ≠ 1,6;
 *           (3) has 1 (no 6) → suit = highest ≠ 1,6;
 *           (4) no extreme   → highest ≠ 1,6;
 *           (5) both 1 and 6 → middle fallback (slot 1);
 *           (6) final fallback → slot 0.
 * Suit can land in slot 1 whenever the chosen value lives there.
 */
function squareSuitSlotFromValues(v0, v1, v2) {
  const vals = [v0, v1, v2];

  // 1. Duplicate (not 1/6) wins; prefer corner slot 0, then 2
  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const dupVal = vals.find(v => counts[v] > 1 && v !== 1 && v !== 6);
  if (dupVal !== undefined) {
    if (v0 === dupVal) return 0;
    if (v2 === dupVal) return 2;
    return 1;
  }

  const has6 = vals.includes(6);
  const has1 = vals.includes(1);

  // 2. Has 6 (no 1): suit = lowest ≠ 1,6
  if (has6 && !has1) {
    const valid = vals.filter(v => v !== 1 && v !== 6);
    if (valid.length > 0) {
      const sv = Math.min(...valid);
      if (v0 === sv) return 0;
      if (v2 === sv) return 2;
      return 1;
    }
  }

  // 3. Has 1 (no 6): suit = highest ≠ 1,6
  if (has1 && !has6) {
    const valid = vals.filter(v => v !== 1 && v !== 6);
    if (valid.length > 0) {
      const sv = Math.max(...valid);
      if (v0 === sv) return 0;
      if (v2 === sv) return 2;
      return 1;
    }
  }

  // 4. No extremes: highest valid, else lowest valid
  if (!has1 && !has6) {
    const valid = vals.filter(v => v !== 1 && v !== 6);
    if (valid.length > 0) {
      const sv = Math.max(...valid);
      if (v0 === sv) return 0;
      if (v2 === sv) return 2;
      return 1;
    }
  }

  // 5. Both 1 and 6 present: three distinct → suit is the lone non-extreme value
  if (has1 && has6) {
    const distinct = new Set(vals).size === 3;
    const mid = vals.find(v => v !== 1 && v !== 6);
    if (distinct && mid !== undefined) {
      if (v0 === mid) return 0;
      if (v2 === mid) return 2;
      return 1;
    }
    return 1; // middle fallback when 1 and 6 repeat
  }

  // 6. Final fallback
  return 0;
}

/** Suit slot index (0, 1, or 2) when three dice are placed; null otherwise. */
export function squareSuitSlot(cardId) {
  if (squareFilledCount(cardId) !== 3) return null;
  const v0 = cardSlotValue(cardId, 0);
  const v1 = cardSlotValue(cardId, 1);
  const v2 = cardSlotValue(cardId, 2);
  return squareSuitSlotFromValues(v0, v1, v2);
}

/**
 * Returns true when slot si is the correct next slot to fill on a square card.
 * Enforces CW (0→1→2) / CCW (2→1→0) fill order; slot 1 is never first.
 */
function squareSlotAllowed(cardId, si) {
  const card = state.cards[cardId];
  if (!card || card.slots[si] === undefined) return false;
  if (slotHasDie(card, si)) return false;

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

  if (filled === 0) return si === 0 || si === 2; // first die: corners only
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
 * When all three slots are filled, slot 1 is locked until a corner is emptied.
 * When slot 1 and exactly one corner are filled, corners are locked until slot 1 is moved.
 */
export function squareDieLocked(cardId, si) {
  if (!settings.square) return false;
  const card = state.cards[cardId];
  if (!card || (card.slotCount ?? 3) !== 3) return false;
  const s0 = slotHasDie(card, 0);
  const s1 = slotHasDie(card, 1);
  const s2 = slotHasDie(card, 2);
  if (s0 && s1 && s2) return si === 1;
  if (s1 && s0 !== s2) return si === 0 || si === 2;
  return false;
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
  if (!card || (card.slotCount ?? 3) !== 3) return true;
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

function squareRankPipPair(cardId) {
  const suitSlot = squareSuitSlot(cardId);
  if (suitSlot === null) return null;
  const rankSlots = suitSlot === 0 ? [1, 2] : suitSlot === 2 ? [0, 1] : [0, 2];
  const idA = state.cards[cardId]?.slots[rankSlots[0]];
  const idB = state.cards[cardId]?.slots[rankSlots[1]];
  if (idA == null || idB == null) return null;
  return [state.dice[idA].value, state.dice[idB].value].sort((a, b) => a - b).join(',');
}

function squareCardRank(cardId) {
  if (isTricolorCard(cardId)) return 'gg';
  const count = squareFilledCount(cardId);
  if (count === 0) return ' ';
  if (count === 1) return '';
  if (count === 2) {
    const filledSlots = [0, 1, 2].filter(si => slotHasDie(state.cards[cardId], si));
    const va = cardSlotValue(cardId, filledSlots[0]);
    const vb = cardSlotValue(cardId, filledSlots[1]);
    const adjacentRank =
      (filledSlots[0] === 0 && filledSlots[1] === 1) ||
      (filledSlots[0] === 1 && filledSlots[1] === 2);
    if (adjacentRank && ((va === 1 && vb === 6) || (va === 6 && vb === 1))) return 'A';
    return ndTranscribe(va + vb);
  }
  if (isJokerCard(cardId)) return 'A';
  const suitSlot = squareSuitSlot(cardId);
  let sum;
  if (suitSlot === 0)      sum = cardSlotValue(cardId, 1) + cardSlotValue(cardId, 2);
  else if (suitSlot === 2) sum = cardSlotValue(cardId, 0) + cardSlotValue(cardId, 1);
  else                     sum = cardSlotValue(cardId, 0) + cardSlotValue(cardId, 2); // suit at slot 1
  return ndTranscribe(sum);
}

function squareCardSuit(cardId) {
  const count = squareFilledCount(cardId);
  if (count === 0 || count === 2) return '';
  if (count === 1) {
    const si = [0, 1, 2].find(i => slotHasDie(state.cards[cardId], i));
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
    for (let si = 0; si < 3; si++) {
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
    const suitSlot = squareSuitSlot(cardId);
    const rankSlots = suitSlot === 0 ? [1, 2] : suitSlot === 2 ? [0, 1] : [0, 2];
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

/** Returns true when placing dieId in slot si of cardId is forbidden by game rules. */
export function isSlotForbidden(cardId, si, dieId) {
  const card = state.cards[cardId];
  // Inactive (undefined) slots are always forbidden
  if (card?.slots[si] === undefined) return true;

  if (settings.square && (card.slotCount ?? 3) === 3) {
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


/** Normalise a die value for duplicate comparison.
 *  When colorRestriction + square are both ON, 1 and 6 share the same V-suit colour,
 *  so they are treated as equivalent (both mapped to 1). */
function normaliseDieValue(v) {
  return settings.colorRestriction && settings.square && v === 6 ? 1 : v;
}

/** Sorted multiset of normalised placed die values on active slots; null when empty. */
function cardDiceValuesKey(cardId) {
  const card = state.cards[cardId];
  if (!card) return null;
  const vals = [];
  for (let si = 0; si < 3; si++) {
    if (!slotHasDie(card, si)) continue;
    vals.push(normaliseDieValue(state.dice[card.slots[si]].value));
  }
  return vals.length ? vals.sort((a, b) => a - b).join(',') : null;
}

/** Unique-index rule: no two grid cards may hold the same multiset of placed dice. */
function wouldViolateUniqueIndex(cardId, si, dieId) {
  const card = state.cards[cardId];
  if (!card) return false;

  const sim = [...card.slots];
  sim[si] = dieId;

  return withSimulatedSlots(cardId, sim, () => {
    const myDice = cardDiceValuesKey(cardId);
    if (!myDice) return false;

    for (const gid of state.grid) {
      if (gid === null || gid === cardId) continue;
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

  const sim = [...card.slots];
  sim[si] = dieId;

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
    const rankSlots = suitSlot === 0 ? [1, 2] : suitSlot === 2 ? [0, 1] : [0, 2];
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
}

/** SQUARE mode: rebuild gridCoins from adjacent matching dice pairs. */
export function refreshGridCoins() {
  const coins = new Set();
  if (!settings.square || !settings.scoring) { state.gridCoins = coins; return; }
  const size = settings.extendedGrid ? 4 : 3;
  // Horizontal: left card slots[1] ↔ right card slots[0]
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const a = r * size + c, b = a + 1;
      const idA = state.grid[a], idB = state.grid[b];
      if (!idA || !idB) continue;
      const dA = state.cards[idA]?.slots[1];
      const dB = state.cards[idB]?.slots[0];
      if (dA != null && dB != null && dA !== undefined && dB !== undefined
          && state.dice[dA]?.value === state.dice[dB]?.value) coins.add(`${a}:${b}`);
    }
  }
  // Vertical: top card slots[2] ↔ bottom card slots[1]
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      const a = r * size + c, b = a + size;
      const idA = state.grid[a], idB = state.grid[b];
      if (!idA || !idB) continue;
      const dA = state.cards[idA]?.slots[2];
      const dB = state.cards[idB]?.slots[1];
      if (dA != null && dB != null && dA !== undefined && dB !== undefined
          && state.dice[dA]?.value === state.dice[dB]?.value) coins.add(`${a}:${b}`);
    }
  }
  state.gridCoins = coins;
}
