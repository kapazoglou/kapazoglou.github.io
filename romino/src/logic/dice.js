import { state } from './state.js';
import { settings } from './settings.js';
import { dieInCard } from './cards.js';

/* ── 3-die combination deck ────────────────────────────────────────────
 * filterExtremes OFF + blankDie OFF : 56 combos (values 1–6, all kept)
 * filterExtremes ON  + blankDie OFF : 52 combos (all-1s/6s removed)
 * filterExtremes OFF + blankDie ON  : 84 combos (values 0–6, all kept)
 * filterExtremes ON  + blankDie ON  : 80 combos (all-1s/6s removed)  */

export function getDeckSize() { return getAllDiceCombos().length; }

export function getAllDiceCombos() {
  const start  = settings.blankDie ? 0 : 1;
  const combos = [];
  for (let a = start; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      for (let c = b; c <= 6; c++)
        combos.push([a, b, c]);
  if (!settings.filterExtremes) return combos;
  return combos.filter(([a, b, c]) => ![a, b, c].every(v => v === 1 || v === 6));
}

/* ── 2-die pair deck ────────────────────────────────────────────────────
 * filterExtremes OFF + blankDie OFF : 21 combos (values 1–6)
 * filterExtremes ON  + blankDie OFF : 18 combos ([1,1],[1,6],[6,6] removed)
 * filterExtremes OFF + blankDie ON  : 28 combos (values 0–6)
 * filterExtremes ON  + blankDie ON  : 25 combos                           */

export function getAllTwoDiceCombos() {
  const start  = settings.blankDie ? 0 : 1;
  const combos = [];
  for (let a = start; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      combos.push([a, b]);
  if (!settings.filterExtremes) return combos;
  return combos.filter(([a, b]) => ![a, b].every(v => v === 1 || v === 6));
}

/* ── 1-die options deck ─────────────────────────────────────────────────
 * 5 options: 2, 3, 4, 5, and a randomly chosen extreme (1 or 6).
 * The deck is regenerated (reshuffled with a fresh extreme) each cycle. */

function buildOneDieDeck() {
  const extreme = Math.random() < 0.5 ? 1 : 6;
  return shuffleArray([2, 3, 4, 5, extreme]);
}

/* ── Card deck ──────────────────────────────────────────────────────────
 * extendedCardDeck OFF: 15 cards  (10×3-slot, 4×2-slot,  1×1-slot)
 * extendedCardDeck ON:  78 cards  (52×3-slot, 21×2-slot, 5×1-slot) */

export function getCardDeckSize() {
  return settings.extendedCardDeck ? 78 : 15;
}

function buildCardDeckBase() {
  if (settings.extendedCardDeck) {
    return [
      ...Array(52).fill(3),
      ...Array(21).fill(2),
      ...Array(5).fill(1),
    ];
  }
  return [
    ...Array(10).fill(3),
    ...Array(4).fill(2),
    1,
  ];
}

export function getCardDeck() {
  return shuffleArray(buildCardDeckBase());
}

export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── Draw / peek helpers ─────────────────────────────────────────────── */

export function drawDiceCombination() {
  if (state.diceDeck.length === 0) {
    state.diceDeck = shuffleArray(getAllDiceCombos());
  }
  return state.diceDeck.pop();
}

/** Peek at the next 3-die combination without consuming it. Refills if empty. */
export function peekNextDiceCombination() {
  if (state.diceDeck.length === 0) {
    state.diceDeck = shuffleArray(getAllDiceCombos());
  }
  return state.diceDeck[state.diceDeck.length - 1];
}

export function drawTwoDiceCombination() {
  if (state.diceDeck2.length === 0) {
    state.diceDeck2 = shuffleArray(getAllTwoDiceCombos());
  }
  return state.diceDeck2.pop();
}

export function peekNextTwoDiceCombination() {
  if (state.diceDeck2.length === 0) {
    state.diceDeck2 = shuffleArray(getAllTwoDiceCombos());
  }
  return state.diceDeck2[state.diceDeck2.length - 1];
}

export function drawOneDie() {
  if (state.diceDeck1.length === 0) {
    state.diceDeck1 = buildOneDieDeck();
  }
  return state.diceDeck1.pop();
}

export function peekOneDie() {
  if (state.diceDeck1.length === 0) {
    state.diceDeck1 = buildOneDieDeck();
  }
  return state.diceDeck1[state.diceDeck1.length - 1];
}

export function drawFromCardDeck() {
  if (state.cardDeck.length === 0) {
    state.cardDeck = getCardDeck();
  }
  return state.cardDeck.pop();
}

/* ── Spawn dice ──────────────────────────────────────────────────────── */

export function spawnDice(count) {
  const nextId = state.dice.length;
  const ids = [];
  const values = [];

  if (count === 3) {
    values.push(...drawDiceCombination());
  } else if (count === 2) {
    if (settings.diceDecks && settings.deckDice) {
      values.push(...drawTwoDiceCombination());
    } else if (settings.diceDecks) {
      // random mode: two independent random dice (1–6, or 0 if blankDie)
      const start = settings.blankDie ? 0 : 1;
      for (let i = 0; i < 2; i++) values.push(start + Math.floor(Math.random() * (7 - start)));
    } else {
      values.push(...drawDiceCombination().slice(0, 2));
    }
  } else if (count === 1) {
    if (settings.diceDecks && settings.deckDice) {
      values.push(drawOneDie());
    } else if (settings.diceDecks) {
      const pool = [2, 3, 4, 5, Math.random() < 0.5 ? 1 : 6];
      values.push(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      values.push(drawDiceCombination()[0]);
    }
  }

  for (let i = 0; i < count; i++) {
    const id = nextId + i;
    state.dice.push({ id, value: values[i] });
    ids.push(id);
  }
  state.newDice = new Set(ids);
  return ids;
}

/* ── Preview combo helpers ───────────────────────────────────────────── */

/** Return the next preview combo of length n, in display order. */
export function nextComboForSlotCount(n) {
  if (!settings.diceDecks) {
    // diceDecks OFF: always 3-die combo deck
    const combo = peekNextDiceCombination();
    return settings.sortDice ? sortDiceValuesForDisplay(combo) : shuffleArray([...combo]);
  }

  if (!settings.deckDice) {
    // random mode: generate n random values
    const start = settings.blankDie ? 0 : 1;
    const vals = Array.from({ length: n }, () => start + Math.floor(Math.random() * (7 - start)));
    return n === 3 && settings.sortDice ? sortDiceValuesForDisplay(vals) : vals;
  }

  if (n === 1) {
    return [peekOneDie()];
  } else if (n === 2) {
    const combo = peekNextTwoDiceCombination();
    return settings.sortDice ? sortDiceValuesForDisplay(combo) : shuffleArray([...combo]);
  } else {
    const combo = peekNextDiceCombination();
    return settings.sortDice ? sortDiceValuesForDisplay(combo) : shuffleArray([...combo]);
  }
}

/** Return the next preview combo in display order (sorted or random per setting). */
export function nextComboForDisplay() {
  // During place-dice, use the current roll length (= last placed card's slot count).
  // During place-card, use pendingCardSlotCount (= current card's slot count).
  const n = settings.diceDecks
    ? (state.phase === 'place-dice' ? state.currentRoll.length : state.pendingCardSlotCount) || 3
    : 3;
  return nextComboForSlotCount(n);
}

/**
 * Sort an array of die values for action-bar display:
 *  - Blanks (0) always leftmost.
 *  - 1s and 6s always rightmost.
 *  - Both 1s & 6s present → [others asc, all 6s, all 1s]
 *  - Only 6s → [others asc, all 6s]
 *  - Only 1s → [others desc, all 1s]
 *  - Neither → duplicates leftmost, rest ascending
 */
export function sortDiceValuesForDisplay(values) {
  const blanks = values.filter(v => v === 0);
  const rest   = values.filter(v => v !== 0);

  const ones   = rest.filter(v => v === 1);
  const sixes  = rest.filter(v => v === 6);
  const others = rest.filter(v => v !== 1 && v !== 6);

  if (ones.length === 0 && sixes.length === 0) {
    if (new Set(others).size === others.length) {
      for (let i = 0; i < others.length; i++) {
        for (let j = i + 1; j < others.length; j++) {
          if (others[i] + others[j] === 7) {
            const [pA, pB] = [others[i], others[j]];
            const nonPair = others.filter((_, k) => k !== i && k !== j);
            const np = nonPair[0];
            if (np !== undefined) {
              const [closer, farther] = Math.abs(np - pA) <= Math.abs(np - pB)
                ? [pA, pB] : [pB, pA];
              return [...blanks, ...nonPair, closer, farther];
            }
          }
        }
      }
    }
    const freq = {};
    for (const v of others) freq[v] = (freq[v] || 0) + 1;
    return [...blanks, ...[...others].sort((a, b) => freq[b] - freq[a] || a - b)];
  }
  if (ones.length > 0 && sixes.length > 0) {
    return [...blanks, ...others.sort((a, b) => a - b), ...sixes, ...ones];
  }
  if (sixes.length > 0) {
    return [...blanks, ...others.sort((a, b) => a - b), ...sixes];
  }
  return [...blanks, ...others.sort((a, b) => b - a), ...ones];
}

/** Sort an array of die IDs by their values using sortDiceValuesForDisplay. */
export function sortDiceIdsForDisplay(ids) {
  if (!settings.sortDice) return shuffleArray([...ids]);
  const sorted = sortDiceValuesForDisplay(ids.map(id => state.dice[id].value));
  const pool = [...ids];
  return sorted.map(v => {
    const i = pool.findIndex(id => state.dice[id].value === v);
    return pool.splice(i, 1)[0];
  });
}

/** Order die IDs to match a pre-determined value sequence (e.g. from a saved preview order). */
export function orderDiceIdsByValues(ids, valueOrder) {
  const pool = [...ids];
  return valueOrder.map(v => {
    const i = pool.findIndex(id => state.dice[id].value === v);
    return pool.splice(i, 1)[0];
  });
}

export function selectLeftmostTrayDie() {
  const first = state.trayOrder.find(id => dieInCard(id) === null);
  state.selectedDieId = first ?? null;
}
