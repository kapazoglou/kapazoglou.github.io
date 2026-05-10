/* ── Helpers ── */

/** Return ms scaled by the current animation-speed setting (0.5× when fast). */
function spd(ms) {
  return settings && settings.fastAnimations ? ms * 0.5 : ms;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Color & pip data ── */
const PIP_COLOR = {
  0: '#CCB400', // blank → V suit color
  1: '#FFFFFF', 2: '#7161FF', 3: '#CC5529',
  4: '#5DB22D', 5: '#25A5CC', 6: '#FFFFFF', 7: '#CCB400',
};

/* Pip fill colors for the die SVG (white die face; 1&6 get dark pips) */
const DIE_PIP_COLOR = {
  0: '#CCB400', // blank — unused (no pips rendered), kept for safety
  1: '#070D1A', 2: '#7161FF', 3: '#CC5529',
  4: '#5DB22D', 5: '#25A5CC', 6: '#070D1A', 7: '#CCB400',
};

const PIP_POS = {
  tl:[31,9], tr:[31,31], ml:[20,9], c:[20,20], mr:[20,31], bl:[9,9], br:[9,31],
};
const JOKER_PIP_POS = {
  tl:[31,14], tr:[31,26], ml:[20,8], c:[20,20], mr:[20,32], bl:[9,14], br:[9,26],
};
const PIP_PATTERN = {
  0:[], // blank — no pips
  1:['c'], 2:['tl','br'], 3:['tr','c','bl'],
  4:['tl','tr','bl','br'], 5:['tl','tr','c','bl','br'],
  6:['tl','tr','ml','mr','bl','br'],
  7:['tl','tr','ml','c','mr','bl','br'],
};
const ALL_PIPS = ['tl','tr','ml','c','mr','bl','br'];

function dieSVG(value, size = 40) {
  const s    = size / 40;
  const rx   = Math.round((value === 7 ? 9 : 8) * s);
  const pr   = 5 * s;
  const face = value === 0 ? '#CCB400' : '#FFFFFF';
  const color  = DIE_PIP_COLOR[value];
  const active = new Set(PIP_PATTERN[value]);
  const pos    = value === 7 ? JOKER_PIP_POS : PIP_POS;
  const circles = ALL_PIPS.filter(k => active.has(k)).map(k => {
    const [cx, cy] = pos[k];
    const pipColor = value === 7 && k === 'c' ? DIE_PIP_COLOR[1] : color;
    return `<circle cx="${(cx*s).toFixed(1)}" cy="${(cy*s).toFixed(1)}" r="${pr.toFixed(1)}" fill="${pipColor}"/>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" data-name="dice_master"><rect width="${size}" height="${size}" rx="${rx}" fill="${face}"/>${circles}</svg>`;
}

function ndTranscribe(str) {
  return String(str).replace(/[0-9]/g, d => 'jabcdefghi'[+d]);
}

/* ── Suit / rank constants ── */
const SUIT_LETTER   = { 0:'V', 1:'V', 2:'Z', 3:'X', 4:'Y', 5:'W', 6:'V' };
const DISCARD_RANKS = ['★','A','b','c','d','e','f','g','h','i','aj','aa','ab','ac'];
const SUIT_COLOR    = { V:'#CCB400', Z:'#7161FF', X:'#CC5529', Y:'#5DB22D', W:'#25A5CC' };
const DISPLAY_SUITS = ['Z','X','Y','W'];

/* ── State ── */
// Each card: { id, slots: [dieId|null, dieId|null, dieId|null] }
// slots[0] = outer-left (rank), slots[1] = middle (suit), slots[2] = outer-right (rank)
const state = {
  grid:           Array(9).fill(null), // grid[i] = cardId | null
  cards:          [],
  actionBarCards: [],                  // card ids awaiting placement
  dice:           [],
  currentRoll:    [],                  // die ids belonging to the current roll
  trayOrder:      [],
  phase:          'place-card',        // 'place-card' | 'place-dice'
  discards:       {},
  discoveredCards: [], // card IDs in fill order, used for game-over summary
  tickerTags:     [],
  stars:          0,
  /** @type {{ ruleId: string, label: string, cardIds: number[], slotIndices: number[] }[]} Scored sets (UI removed for now; data kept for a future display). */
  scoredSets:     [],
  /** After a dice round, filled conversion waits until this hand card is placed on the grid. */
  awaitingPostDiceGridPlace: false,
  /** When set, grid slots still hold cards while a sweep-out animation runs. */
  scoringExit:      null,
  /** Queue of additional line sweeps detected simultaneously. Cards stay in grid (or overlay) until all drain. */
  pendingLineSweeps: [],
  /** Ghost copies of cards already cleared from the grid but still needed for a pending cross-line sweep.
   *  Keys are grid slot indices; values are card IDs. */
  sweepOverlay: {},
  /** 6-dice endgame: cards to offer sequentially after the sweep resolves (0 = replay, 1 = one card, 2 = two cards). */
  pendingPostSweepCards: 0,
  /** When non-null, offer this card id as a second sequential card after the first is placed. */
  pendingSecondNewCard: null,
  /** Remaining shuffled 3-dice combinations; refilled from getAllDiceCombos() when empty. */
  diceDeck: [],
  /** Display order (values) for the upcoming preview combo, frozen at spawn time. */
  previewOrder: [],
  /** Running score from card-level scoring rules. */
  score: 0,
  /** Total cards placed from the action bar onto the grid (drives the deck-size countdown). */
  cardsPlaced: 0,
  /** Whether placed dice in the current roll show their accent border. Cleared when the next card is placed. */
  diceAccentActive: true,
};

let scoreExitBeatTimer = null;
let scoreExitDoneTimer = null;

function clearScoreExitTimers() {
  if (scoreExitBeatTimer) clearTimeout(scoreExitBeatTimer);
  if (scoreExitDoneTimer) clearTimeout(scoreExitDoneTimer);
  scoreExitBeatTimer = null;
  scoreExitDoneTimer = null;
}

/* ── Settings ──────────────────────────────────────────────────────────── */
// Edit SETTINGS_CONFIG to add/reorder/group toggles.
// Each group has a label and an items array; each item needs key, label, default.
const SETTINGS_CONFIG = [
  {
    group: 'grid',
    label: 'Grid',
    items: [
      { key: 'extendedGrid',    label: 'Extended grid (4 × 4)',              default: false },
      { key: 'fastAnimations',  label: 'Fast animations (2×)',               default: true },
    ],
  },
  {
    group: 'deck',
    label: 'Deck',
    items: [
      { key: 'blankDie',       label: 'Blank die (no pips → V suit)',                    default: false },
      { key: 'blanksInRank',   label: 'Allow blank in rank (both slots must match)',      default: true },
      { key: 'filterExtremes', label: 'Remove all-1s/6s dice combos',        default: true  },
      { key: 'sortDice',       label: 'Sort dice in action bar',               default: true  },
    ],
  },
  {
    group: 'constraints',
    label: 'Constraints',
    items: [
      { key: 'forbiddenSlots', label: 'Forbidden slots — completely block placement', default: true },
      { key: 'paidSlots',      label: 'Paid slots — forbidden costs a coin',         default: false  },
      { key: 'refundOnMove',   label: 'Refund coin when moving from paid slot',       default: false },
      { key: 'swapDice',       label: 'Swap placed dice by tapping one then the other', default: false },
    ],
  },
  {
    group: 'scoring',
    label: 'Scoring',
    items: [
      { key: 'scoreSuitRepeat',  label: 'Suit die scores when it matches an outer die',             default: true },
      { key: 'scoreSuitExtreme', label: 'Suit die scores when extreme and card has 1 or 6',         default: true },
      { key: 'scoreRankSum7',    label: 'Score when the two rank dice sum to 7',            default: true },
    ],
  },
  {
    group: 'sweeps',
    label: 'Sweeps',
    items: [
      { key: 'set',        label: 'Set — same number',                              default: true  },
      { key: 'runFlush',   label: 'Run flush — consecutive numbers, same suit',      default: true  },
      { key: 'runDiff',    label: 'Run diff — consecutive numbers, all diff suits',  default: true  },
      { key: 'runAny',     label: 'Run any — consecutive numbers, any suits',        default: false },
      { key: 'wildTarok',  label: 'Wild tarok — V counts as any suit in runs',       default: true },
      { key: 'flush',      label: 'Flush — same suit',                               default: false },
      { key: 'tarokFlush', label: 'Tarok flush — V suit sweep',                      default: false },
      { key: 'domino',     label: 'Domino — V suit horizontal chain (outer dice match)', default: true },
    ],
  },
];

const settings = Object.fromEntries(
  SETTINGS_CONFIG.flatMap(g => g.items.map(i => [i.key, i.default]))
);

/** Tracks which die IDs were placed into a forbidden slot (costing a coin). */
const forbiddenDieSlots = new Set();

/* ── Dice combination deck ───────────────────────────────────────────────
 * filterExtremes OFF + blankDie OFF : 56 combos (values 1–6, all kept)
 * filterExtremes ON  + blankDie OFF : 52 combos (all-1s/6s removed)
 * filterExtremes OFF + blankDie ON  : 84 combos (values 0–6, all kept)
 * filterExtremes ON  + blankDie ON  : 80 combos (all-1s/6s removed) */
/** Total number of unique 3-dice combos under the current toggle settings. */
function getDeckSize() { return getAllDiceCombos().length; }

function getAllDiceCombos() {
  const start  = settings.blankDie ? 0 : 1;
  const combos = [];
  for (let a = start; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      for (let c = b; c <= 6; c++)
        combos.push([a, b, c]);
  if (!settings.filterExtremes) return combos;
  // Remove combinations where every die is a 1 or a 6 (blank counts as neither).
  return combos.filter(([a, b, c]) => ![a, b, c].every(v => v === 1 || v === 6));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawDiceCombination() {
  if (state.diceDeck.length === 0) {
    state.diceDeck = shuffleArray(getAllDiceCombos());
  }
  return state.diceDeck.pop();
}

/** Peek at the next combination without consuming it. Refills deck if empty. */
function peekNextDiceCombination() {
  if (state.diceDeck.length === 0) {
    state.diceDeck = shuffleArray(getAllDiceCombos());
  }
  return state.diceDeck[state.diceDeck.length - 1];
}

/* ── Card & die spawning ── */
function spawnCard() {
  const id = state.cards.length;
  state.cards.push({ id, slots: [null, null, null], filled: false });
  return id;
}

function spawnDice(count) {
  const nextId = state.dice.length;
  const ids = [];
  // Each draw produces 3 values; count is always 3 or 6
  const values = [];
  for (let ci = 0; ci < count / 3; ci++) {
    values.push(...drawDiceCombination());
  }
  for (let i = 0; i < count; i++) {
    const id = nextId + i;
    state.dice.push({ id, value: values[i] });
    ids.push(id);
  }
  state.newDice = new Set(ids); // consumed by renderActionBar on the next render
  return ids;
}

/** Auto-select the leftmost unplaced tray die (respects existing user selection). */
/** Return the next preview combo in display order (sorted or random per setting). */
function nextComboForDisplay() {
  const combo = peekNextDiceCombination();
  return settings.sortDice ? sortDiceValuesForDisplay(combo) : shuffleArray([...combo]);
}

/**
 * Sort an array of die values for action-bar display:
 *  - 1s and 6s are always rightmost (all of them, preserving count).
 *  - Both present  → [others asc …, all 6s, all 1s]
 *  - Only 6s       → [others asc …, all 6s]
 *  - Only 1s       → [others desc …, all 1s]
 *  - Neither       → duplicates leftmost, rest ascending
 */
function sortDiceValuesForDisplay(values) {
  // Blank dice (0) are always leftmost, regardless of other rules.
  const blanks = values.filter(v => v === 0);
  const rest   = values.filter(v => v !== 0);

  const ones   = rest.filter(v => v === 1);
  const sixes  = rest.filter(v => v === 6);
  const others = rest.filter(v => v !== 1 && v !== 6);

  if (ones.length === 0 && sixes.length === 0) {
    // All-different values: find the pair summing to 7, place non-pair leftmost,
    // pair-member closest to non-pair in the middle, farthest on the right.
    if (new Set(others).size === others.length) {
      for (let i = 0; i < others.length; i++) {
        for (let j = i + 1; j < others.length; j++) {
          if (others[i] + others[j] === 7) {
            const [pA, pB] = [others[i], others[j]];
            const nonPair = others.filter((_, k) => k !== i && k !== j);
            const np = nonPair[0]; // single non-pair value (may be absent if N>3)
            if (np !== undefined) {
              const [closer, farther] = Math.abs(np - pA) <= Math.abs(np - pB)
                ? [pA, pB] : [pB, pA];
              return [...blanks, ...nonPair, closer, farther];
            }
          }
        }
      }
    }
    // Duplicates (or no 7-pair): duplicates leftmost, then ascending.
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

/** Sort an array of die IDs by their values using sortDiceValuesForDisplay.
 *  When the sortDice setting is off, returns the IDs in a random order instead. */
function sortDiceIdsForDisplay(ids) {
  if (!settings.sortDice) return shuffleArray([...ids]);
  const sorted = sortDiceValuesForDisplay(ids.map(id => state.dice[id].value));
  const pool = [...ids];
  return sorted.map(v => {
    const i = pool.findIndex(id => state.dice[id].value === v);
    return pool.splice(i, 1)[0];
  });
}

/** Order die IDs to match a pre-determined value sequence (e.g. from a saved preview order). */
function orderDiceIdsByValues(ids, valueOrder) {
  const pool = [...ids];
  return valueOrder.map(v => {
    const i = pool.findIndex(id => state.dice[id].value === v);
    return pool.splice(i, 1)[0];
  });
}

function selectLeftmostTrayDie() {
  const first = state.trayOrder.find(id => dieInCard(id) === null);
  state.selectedDieId = first ?? null;
}

/* ── Card helpers ── */
function dieInCard(dieId) {
  for (const card of state.cards) {
    for (let si = 0; si < 3; si++) {
      if (card.slots[si] === dieId) return `${card.id}-${si}`;
    }
  }
  return null;
}

function cardSlotValue(cardId, si) {
  const id = state.cards[cardId]?.slots[si];
  return (id !== null && id !== undefined) ? state.dice[id].value : 0;
}

function isJokerCard(cardId) {
  const c = state.cards[cardId];
  if (!c || c.slots[0] === null || c.slots[2] === null) return false;
  const v0 = cardSlotValue(cardId, 0), v2 = cardSlotValue(cardId, 2);
  return (v0 === 1 && v2 === 6) || (v0 === 6 && v2 === 1);
}

function allThreeColoredCard(cardId) {
  const c = state.cards[cardId];
  if (!c) return false;
  const vals = c.slots.map(id => id !== null ? state.dice[id].value : null);
  if (vals.some(v => v === null || v < 2 || v > 5)) return false;
  return new Set(vals).size === 3;
}

function cardRank(cardId) {
  if (isJokerCard(cardId)) return 'A';
  const c = state.cards[cardId];
  if (c) {
    const id0 = c.slots[0], id2 = c.slots[2];
    // Double-blank rank dice → wildcard rank '*'
    if (id0 !== null && id2 !== null &&
        state.dice[id0]?.value === 0 && state.dice[id2]?.value === 0) return '*';
  }
  const sum = cardSlotValue(cardId, 0) + cardSlotValue(cardId, 2);
  return sum === 0 ? ' ' : ndTranscribe(sum);
}

function cardMiddleValue(cardId) {
  const id = state.cards[cardId]?.slots[1];
  return (id !== null && id !== undefined) ? state.dice[id].value : null;
}

function cardSuit(cardId) {
  const v = cardMiddleValue(cardId);
  return v !== null ? SUIT_LETTER[v] : '';
}

function cardColor(cardId) {
  const v = cardMiddleValue(cardId);
  return v !== null ? PIP_COLOR[v] : null;
}

/**
 * Returns true if placing dieId into slot si of cardId would complete the card
 * with a rank+suit that already exists on another grid card.
 */
function wouldCreateDuplicate(cardId, si, dieId) {
  const card = state.cards[cardId];
  if (!card) return false;

  // Simulate the placement
  const sim = [...card.slots];
  sim[si] = dieId;

  // Rank+suit only determinable when all 3 slots are filled
  if (sim.some(s => s === null)) return false;

  const v0 = state.dice[sim[0]].value;
  const v1 = state.dice[sim[1]].value;
  const v2 = state.dice[sim[2]].value;

  const isJoker = (v0 === 1 && v2 === 6) || (v0 === 6 && v2 === 1);
  const rank = isJoker ? 'A' : ndTranscribe(v0 + v2);
  const suit = SUIT_LETTER[v1];

  for (const gid of state.grid) {
    if (gid === null || gid === cardId) continue;
    const gc = state.cards[gid];
    if (!gc) continue;
    if (!gc.filled && gc.slots.some(s => s === null)) continue; // identity not yet determined
    if (cardSuit(gid) !== suit) continue;
    if (suit === 'V') {
      // V-suit cards: duplicates only when the outer dice pair is identical (order-independent).
      // Two V-suit cards with the same rank but different outer dice are allowed.
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

/* ── Grid geometry helpers (3×3 or 4×4) ─────────────────────────────── */
function getGridSize()  { return settings.extendedGrid ? 4 : 3; }
function getGridTotal() { return getGridSize() ** 2; }

/** All lines of length N on an N×N grid: rows, cols, both diagonals. */
function getGridLines() {
  const N = getGridSize();
  const lines = [];
  for (let r = 0; r < N; r++) lines.push(Array.from({ length: N }, (_, c) => r * N + c));
  for (let c = 0; c < N; c++) lines.push(Array.from({ length: N }, (_, r) => r * N + c));
  lines.push(Array.from({ length: N }, (_, i) => i * N + i));           // top-left → bottom-right
  lines.push(Array.from({ length: N }, (_, i) => i * N + (N - 1 - i))); // top-right → bottom-left
  return lines;
}

/** Grid card may be moved to another slot until any die is placed on it. */
function cardIsGridRepositionable(cardId) {
  const c = state.cards[cardId];
  if (!c || c.filled) return false;
  return c.slots.every(s => s === null);
}

/* ── Scoring sets (3 filled cards in a line on the grid) ──
 * Presets bundle which rules are active and in what order (first match wins per line).
 * Switch at runtime for testing: __setScoringPreset('default' | 'triple_same_rank_only' | 'consecutive_suit_only')
 */
/** Sweep axis for CSS derived from the line's pattern on the current grid. */
function lineExitKey(line) {
  const N = getGridSize();
  const [a, b] = line;
  if (Math.floor(a / N) === Math.floor(b / N)) return 'h';  // same row
  if (a % N === b % N) return 'v';                           // same col
  if (b - a === N + 1) return 'd1';                          // top-left → bottom-right
  return 'd2';                                               // top-right → bottom-left
}

/* ── Sweep rules ──────────────────────────────────────────────────────── */

/** Ordered list of rule keys. wildTarok is a modifier, not a standalone rule. */
const SWEEP_RULE_ORDER = ['set', 'runFlush', 'runDiff', 'runAny', 'flush', 'tarokFlush', 'domino'];

const SCORING_RULE_LABELS = {
  set:        'Set',
  runFlush:   'Run flush',
  runDiff:    'Run diff',
  runAny:     'Run any',
  flush:      'Flush',
  tarokFlush: 'Tarok flush',
  domino:     'Domino',
};

/** Returns true when all N rank-positions form a consecutive circular run (wraps at A/12).
 *  Works for any line length (3 in 3×3, 4 in 4×4).
 *  Cards with rank '*' (double-blank) act as wildcards and fill any gap. */
function isConsecutiveRanks(cardIds) {
  const WRAP = 12;
  const N    = cardIds.length;
  const wildcards = cardIds.filter(id => cardRank(id) === '*').length;
  if (wildcards === N) return true; // all wildcards → any run works

  const nonWild = cardIds.filter(id => cardRank(id) !== '*');
  const rawIdx  = nonWild.map(id => DISCARD_RANKS.indexOf(cardRank(id)));
  if (rawIdx.some(i => i <= 0)) return false; // ★ or invalid rank
  const sorted = rawIdx.map(i => i - 1).sort((a, b) => a - b); // 0-based circular
  if (new Set(sorted).size !== sorted.length) return false; // duplicate non-wild ranks

  // Try every start position: check if all non-wild indices fit inside a window of size N
  // leaving enough room for the wildcards to fill the remaining positions.
  for (let start = 0; start < WRAP; start++) {
    const fits = sorted.every(idx => ((idx - start + WRAP) % WRAP) < N);
    if (fits) return true;
  }
  return false;
}

/**
 * Resolve suits with wildTarok for "flush" mode (all same):
 * V cards become the suit of the non-V cards when wildTarok is on.
 */
function effectiveSuitsFlush(cardIds) {
  const raw = cardIds.map(id => cardSuit(id));
  if (!settings.wildTarok) return raw;
  const nonV = raw.filter(s => s && s !== 'V');
  if (nonV.length === 0) return raw.map(() => 'Z'); // all V → any suit works
  if (!nonV.every(s => s === nonV[0])) return raw;  // non-V conflict → can't unify
  return raw.map(s => (s === 'V' ? nonV[0] : s));
}

/**
 * Resolve suits with wildTarok for "diff" mode (all different):
 * V cards fill in a missing suit when wildTarok is on.
 */
function effectiveSuitsDiff(cardIds) {
  const raw = cardIds.map(id => cardSuit(id));
  if (!settings.wildTarok) return raw;
  const nonV = raw.filter(s => s && s !== 'V');
  if (new Set(nonV).size !== nonV.length) return raw; // non-V cards conflict
  const used = new Set(nonV);
  const SUITS = ['Z', 'X', 'Y', 'W'];
  return raw.map(s => {
    if (s !== 'V') return s;
    const fill = SUITS.find(x => !used.has(x)) ?? 'Z';
    used.add(fill);
    return fill;
  });
}

/** @type {Record<string, (cardIds: number[]) => boolean>} */
const SCORING_RULES = {
  set(cardIds) {
    // Both '*' (double-blank) and V-suit cards act as rank wildcards in sets.
    const isWild  = id => cardRank(id) === '*' || cardSuit(id) === 'V';
    const nonWild = cardIds.filter(id => !isWild(id));
    const wilds   = cardIds.filter(id =>  isWild(id));
    if (nonWild.length === 0) return true; // all wildcards
    const r0 = cardRank(nonWild[0]);
    if (r0 === '' || r0 === ' ' || !nonWild.every(id => cardRank(id) === r0)) return false;
    // Each wildcard must contribute a suit not already present among the other set members.
    for (const wild of wilds) {
      const ws = cardSuit(wild);
      if (cardIds.some(id => id !== wild && cardSuit(id) === ws)) return false;
    }
    return true;
  },
  runFlush(cardIds) {
    if (!isConsecutiveRanks(cardIds)) return false;
    const suits = effectiveSuitsFlush(cardIds);
    return suits.every(s => s) && suits.every(s => s === suits[0]);
  },
  runDiff(cardIds) {
    if (!isConsecutiveRanks(cardIds)) return false;
    const suits = effectiveSuitsDiff(cardIds);
    return suits.every(s => s) && new Set(suits).size === cardIds.length;
  },
  runAny(cardIds) {
    return isConsecutiveRanks(cardIds);
  },
  flush(cardIds) {
    const suits = effectiveSuitsFlush(cardIds);
    return suits.every(s => s) && suits.every(s => s === suits[0]);
  },
  tarokFlush(cardIds) {
    return cardIds.every(id => cardSuit(id) === 'V');
  },
  /** Horizontal lines of V-suit cards where adjacent outer dice match (domino chain). */
  domino(cardIds, lineSlots) {
    // Horizontal lines only.
    if (!lineSlots || lineExitKey(lineSlots) !== 'h') return false;
    // All cards must be V suit.
    if (!cardIds.every(id => cardSuit(id) === 'V')) return false;
    // Domino chain: right outer die of card[i] must equal left outer die of card[i+1].
    for (let i = 0; i < cardIds.length - 1; i++) {
      const right = cardSlotValue(cardIds[i],     2); // right outer of left card
      const left  = cardSlotValue(cardIds[i + 1], 0); // left outer of right card
      if (!right || !left || right !== left) return false;
    }
    return true;
  },
};

/** Returns all matching rule IDs (in display order) for a fully-filled line. */
function findAllMatchesOnLine(lineSlots) {
  const cardIds = lineSlots.map(i => state.grid[i]);
  if (cardIds.some(id => id === null || id === undefined)) return [];
  if (!cardIds.every(cid => state.cards[cid]?.filled)) return [];
  return SWEEP_RULE_ORDER
    .filter(ruleId => settings[ruleId] && SCORING_RULES[ruleId]?.(cardIds, lineSlots))
    .map(ruleId => ({ ruleId, cardIds: [...cardIds] }));
}

/** Returns the first match on any line (for quick peek). */
function findScoringMatchOnLine(lineSlots) {
  return findAllMatchesOnLine(lineSlots)[0] ?? null;
}

function peekAnyScoringMatch() {
  for (const line of getGridLines()) {
    if (findAllMatchesOnLine(line).length > 0) return true;
  }
  return false;
}

function startScoringExitAnimation(lineSlots, ruleId, cardIds) {
  clearScoreExitTimers();
  state.scoringExit = {
    lineSlots: [...lineSlots],
    cardIds: [...cardIds],
    ruleId,
    lineKey: lineExitKey(lineSlots),
    phase: 'wait',
  };
  document.getElementById('app')?.classList.add('is-scoring-exit');
  render();

  const BEAT_MS = 320;
  const SWEEP_MS = 780;
  scoreExitBeatTimer = setTimeout(() => {
    scoreExitBeatTimer = null;
    if (!state.scoringExit) return;
    state.scoringExit.phase = 'run';
    render();
    scoreExitDoneTimer = setTimeout(() => {
      scoreExitDoneTimer = null;
      commitScoringExit();
    }, spd(SWEEP_MS));
  }, spd(BEAT_MS));
}

/** After one line sweep: record it, manage overlay for cross-line shared cards, then drain the queue. */
function commitScoringExit() {
  clearScoreExitTimers();
  const se = state.scoringExit;
  if (!se) return;

  state.scoredSets.push({
    ruleId: se.ruleId,
    label: SCORING_RULE_LABELS[se.ruleId] || se.ruleId,
    cardIds: [...se.cardIds],
    slotIndices: [...se.lineSlots],
  });
  state.scoringExit = null;
  document.getElementById('app')?.classList.remove('is-scoring-exit');

  // Determine which of this line's slots are still needed by queued line sweeps.
  const stillNeeded = new Set(state.pendingLineSweeps.flatMap(p => p.lineSlots));

  for (let pos = 0; pos < se.lineSlots.length; pos++) {
    const slotIdx = se.lineSlots[pos];
    if (stillNeeded.has(slotIdx)) {
      // Keep a ghost copy so the pending sweep can render and animate this card.
      state.sweepOverlay[slotIdx] = se.cardIds[pos];
    } else {
      // No further line needs this slot — clear any lingering overlay.
      delete state.sweepOverlay[slotIdx];
    }
    state.grid[slotIdx] = null; // always clear the live grid slot
  }

  // Animate next queued line sweep if any.
  if (state.pendingLineSweeps.length > 0) {
    const next = state.pendingLineSweeps.shift();
    startScoringExitAnimation(next.lineSlots, next.ruleId, next.cardIds);
    return;
  }

  // All cross-line sweeps done — wipe any leftover overlay entries.
  state.sweepOverlay = {};

  resolveAllScoringSets();

  if (!state.scoringExit && !peekAnyScoringMatch()) {
    if (state.pendingPostSweepCards > 0) {
      // Post-sweep cards:
      //   1 card  (5b, 3 slots remain) — normal offer with preview dice visible.
      //   2 cards (5b, 0 slots remain) — card 1 alone (no preview), card 2 with preview.
      state.phase = 'place-card';
      const nc1 = spawnCard();
      state.actionBarCards = [nc1];
      state.newCards = new Set([nc1]);
      state.selectedCardId = nc1;
      state.selectedDieId  = null;
      if (state.pendingPostSweepCards > 1) {
        // Preview dice stay visible throughout. Card 2 is queued and offered after card 1 is placed.
        state.pendingSecondNewCard = spawnCard();
      }
      state.pendingPostSweepCards = 0;
    } else {
      // 3-dice path or resumed full-grid path: let checkPhaseTransition decide.
      // Return early — a second render() here would consume animation flags before the
      // 180 ms preview-fade delay fires, stripping is-new classes from the DOM.
      checkPhaseTransition();
      return;
    }
  }
  render();
}

/** Collect every qualifying line (first-match-wins per line), animate the first, queue the rest.
 *  Cards shared between lines are kept alive via sweepOverlay until all cross-line sweeps finish. */
function resolveOneScoringSet() {
  if (state.scoringExit) return false;

  // Gather ALL simultaneously qualifying lines (one rule per line).
  const allMatches = [];
  for (const line of getGridLines()) {
    const match = findScoringMatchOnLine(line); // first-match-wins
    if (match) allMatches.push({ lineSlots: [...line], lineKey: lineExitKey(line), ...match });
  }
  if (!allMatches.length) return false;

  const [first, ...rest] = allMatches;
  state.pendingLineSweeps = rest;

  // Pre-ghost every card that belongs to a pending (later) line so duplicates are
  // already visible in place before the first sweep animation fires.
  for (const pending of rest) {
    for (let i = 0; i < pending.lineSlots.length; i++) {
      const slotIdx = pending.lineSlots[i];
      if (state.grid[slotIdx] !== null) {
        state.sweepOverlay[slotIdx] = pending.cardIds[i];
      }
    }
  }

  startScoringExitAnimation(first.lineSlots, first.ruleId, first.cardIds);
  return true;
}

function resolveAllScoringSets() {
  if (state.scoringExit) return;
  resolveOneScoringSet();
}

/* ── Combo detection (2 tiles) ── */
function detectCombo(tiles) {
  if (tiles.length < 2) return { tag: '///', stars: 0 };
  const sorted = [...tiles].sort((a, b) => DISCARD_RANKS.indexOf(a.rank) - DISCARD_RANKS.indexOf(b.rank));
  const sNums  = sorted.map(t => DISCARD_RANKS.indexOf(t.rank));
  const sSuits = sorted.map(t => t.suit);
  const sRanks = sorted.map(t => t.rank);
  const consecutive = sNums[1] === sNums[0] + 1;
  const sameSuit    = sSuits[0] === sSuits[1];
  const sameNum     = sNums[0]  === sNums[1];
  if (consecutive && sameSuit) return { tag: `${sSuits[0]} ${sRanks.join(' ')}`, stars: 3 };
  if (sameNum)   return { tag: sRanks.join(' '), stars: 3 };
  if (consecutive) return { tag: sRanks.join(' '), stars: 2 };
  if (sameSuit)  return { tag: sSuits.join(' '), stars: 2 };
  return { tag: '///', stars: 0 };
}

/* ── Card scoring rules ─ comment individual rules out to disable them ── */
const CARD_SCORE_RULES = [
  // The suit (middle) die scores 1 point when enabled conditions apply.
  function ruleSuitDie(cardId) {
    const v0 = cardSlotValue(cardId, 0);
    const v1 = cardSlotValue(cardId, 1); // suit die
    const v2 = cardSlotValue(cardId, 2);
    if (!v0 || !v1 || !v2) return 0;
    if (v1 === 1 || v1 === 6) return 0;

    const repeats     = settings.scoreSuitRepeat  && (v1 === v0 || v1 === v2);
    const isExtreme   = v1 >= Math.max(v0, v2) || v1 <= Math.min(v0, v2);
    const hasOneOrSix = v0 === 1 || v0 === 6 || v2 === 1 || v2 === 6;
    const extreme     = settings.scoreSuitExtreme && isExtreme && hasOneOrSix;

    return (repeats || extreme) ? 1 : 0;
  },
  // The two outer (rank) dice sum to 7.
  function ruleRankSum7(cardId) {
    if (!settings.scoreRankSum7) return 0;
    const v0 = cardSlotValue(cardId, 0);
    const v2 = cardSlotValue(cardId, 2);
    if (!v0 || !v2) return 0;
    return v0 + v2 === 7 ? 1 : 0;
  },
];

function evaluateCardScore(cardId) {
  return CARD_SCORE_RULES.some(rule => rule(cardId) > 0) ? 1 : 0;
}

/** Show/hide the score preview badge on a card based on current dice state. */
function updateScorePreview(cardId) {
  const card = state.cards[cardId];
  if (!card || card.filled || card.scoreQueued) return;
  const qualifies = card.slots.every(s => s !== null) && evaluateCardScore(cardId) > 0;
  if (qualifies && !card.showScorePreview) {
    card.showScorePreview = true;
    card.scorePreviewNew  = true;
    // Keep the flag alive for the full animation duration so re-renders within
    // that window still include the is-new class and the pop-in always completes.
    const cid = cardId;
    setTimeout(() => { const c = state.cards[cid]; if (c) c.scorePreviewNew = false; }, spd(260));
  } else if (!qualifies) {
    card.showScorePreview = false;
    card.scorePreviewNew  = false;
  }
}

/** Launch one score pip from fromRect toward toRect.
 *  Sequence: spawn → pop to 133% → back to 100% → travel to counter → fade out.
 *  Calls onArrival when it reaches the counter, onDone when fully faded. */
function launchPip(fromRect, toRect, onArrival, onDone) {
  const POP_UP_MS    = spd(110);
  const POP_DOWN_MS  = spd(130);
  const POP_TOTAL_MS = POP_UP_MS + POP_DOWN_MS;
  const TRAVEL_MS    = spd(550);
  const FADE_DONE_MS = spd(750);

  const pip = document.createElement('div');
  pip.textContent = '🪙';
  Object.assign(pip.style, {
    position:      'fixed',
    left:          `${fromRect.left + fromRect.width  / 2}px`,
    top:           `${fromRect.top  + fromRect.height / 2}px`,
    transform:     'translate(-50%, -50%) scale(1)',
    fontSize:      '56px',
    lineHeight:    '1',
    pointerEvents: 'none',
    zIndex:        '9998',
    transition:    'none',
  });
  document.body.appendChild(pip);
  pip.getBoundingClientRect();

  // Phase 1: pop up to 133%
  pip.style.transition = `transform ${POP_UP_MS}ms cubic-bezier(0.2, 0, 0.4, 1)`;
  pip.style.transform  = 'translate(-50%, -50%) scale(1.33)';

  // Phase 2: pop back to 100%
  setTimeout(() => {
    pip.style.transition = `transform ${POP_DOWN_MS}ms ease`;
    pip.style.transform  = 'translate(-50%, -50%) scale(1)';
  }, POP_UP_MS);

  // Phase 3: travel to score counter + fade
  const tx = (toRect.left + toRect.width  / 2) - (fromRect.left + fromRect.width  / 2);
  const ty = (toRect.top  + toRect.height / 2) - (fromRect.top  + fromRect.height / 2);
  setTimeout(() => {
    pip.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.2,0.8,0.3,1), opacity ${spd(600)}ms ease ${spd(150)}ms`;
    pip.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    pip.style.opacity    = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  }, POP_TOTAL_MS);

  setTimeout(onArrival, POP_TOTAL_MS + TRAVEL_MS);
  setTimeout(onDone,    POP_TOTAL_MS + FADE_DONE_MS);
}

/** Reverse pip: coin flies FROM the score counter TO a target slot, then disappears.
 *  Used for forbidden-slot penalties. */
function launchPenaltyPip(toRect) {
  const scoreEl = document.getElementById('score-display');
  if (!scoreEl) return;
  const fromRect = scoreEl.getBoundingClientRect();
  const TRAVEL_MS = spd(480);
  const pip = document.createElement('div');
  pip.textContent = '🪙';
  Object.assign(pip.style, {
    position:      'fixed',
    left:          `${fromRect.left + fromRect.width  / 2}px`,
    top:           `${fromRect.top  + fromRect.height / 2}px`,
    transform:     'translate(-50%, -50%) scale(1)',
    fontSize:      '56px',
    lineHeight:    '1',
    pointerEvents: 'none',
    zIndex:        '9998',
    transition:    'none',
  });
  document.body.appendChild(pip);
  pip.getBoundingClientRect();
  const tx = (toRect.left + toRect.width  / 2) - (fromRect.left + fromRect.width  / 2);
  const ty = (toRect.top  + toRect.height / 2) - (fromRect.top  + fromRect.height / 2);
  requestAnimationFrame(() => {
    pip.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${spd(300)}ms ease ${(TRAVEL_MS * 0.7 / 1000).toFixed(2)}s`;
    pip.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.55)`;
    pip.style.opacity    = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  });
}

/** Fire pts pips one after the other (each waits for the previous to finish). */
function firePipsSequential(fromRect, toRect, pts, pipIndex, onAllDone) {
  if (pipIndex >= pts) { onAllDone(); return; }
  launchPip(fromRect, toRect,
    () => { state.score++; renderHUD(); },
    () => firePipsSequential(fromRect, toRect, pts, pipIndex + 1, onAllDone),
  );
}

/** Mutate one card to filled and record its discard tile. */
function fillOneCard(cardId) {
  const card = state.cards[cardId];
  if (!card) return;
  card.filled = true;
  card.scoreQueued = false;
  card.showScorePreview = false;
  const rank = cardRank(cardId);
  const suit = cardSuit(cardId);
  if (suit) {
    const col = DISCARD_RANKS.indexOf(rank);
    if (col >= 0) {
      if (!state.discards[col]) state.discards[col] = [];
      if (!state.discards[col].includes(suit)) state.discards[col].push(suit);
    }
  }
  state.discoveredCards.push(cardId);
}

/** Animate and fill cards in queue one by one; calls onDone when the whole queue is done. */
function processCardFills(queue, index, onDone) {
  if (index >= queue.length) { setTimeout(() => onDone?.(), spd(420)); return; }
  const { cardId, pts } = queue[index];

  const CONVERT_MS = spd(240);
  const next = () => {
    const cardEl = document.querySelector(`.converter-card[data-card-id="${cardId}"]`);
    if (cardEl) {
      cardEl.classList.add('is-converting');
      setTimeout(() => {
        fillOneCard(cardId);
        render();
        processCardFills(queue, index + 1, onDone);
      }, CONVERT_MS);
    } else {
      fillOneCard(cardId);
      render();
      processCardFills(queue, index + 1, onDone);
    }
  };

  if (pts === 0) { setTimeout(next, spd(320)); return; }

  // Preview badge is already visible on the card (shown at die-placement time).
  // Fly the pip from the badge's position directly.
  const previewEl = document.querySelector(`.converter-card[data-card-id="${cardId}"] .score-preview`);
  const scoreEl   = document.getElementById('score-display');

  if (!previewEl || !scoreEl) {
    state.score += pts;
    renderHUD();
    next();
    return;
  }

  // Capture positions before the re-render detaches the badge element
  const fromRect = previewEl.getBoundingClientRect();
  const toRect   = scoreEl.getBoundingClientRect();

  // Hide the badge the moment the pip starts moving
  state.cards[cardId].showScorePreview = false;
  render();

  firePipsSequential(fromRect, toRect, pts, 0, next);
}

/* ── Phase management ── */
// Mark any grid card that has all 3 dice as filled, recording its tile in discards.
// Pass force=true to skip the place-dice phase guard (used by the full-grid endgame
// handler so the phase stays 'place-dice' and the action bar keeps the ghost visible).
function convertFilledCards(onDone, force = false) {
  if (!force && state.phase === 'place-dice') { onDone?.(); return; }
  if (state.awaitingPostDiceGridPlace)        { onDone?.(); return; }

  const queue = [];
  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (card.filled || card.scoreQueued) continue; // scoreQueued prevents double-scoring during async pip animations
    if (card.slots.every(s => s !== null)) {
      card.scoreQueued = true;
      queue.push({ cardId, pts: evaluateCardScore(cardId) });
    }
  }

  if (queue.length === 0) { onDone?.(); return; }
  processCardFills(queue, 0, onDone);
}

function convertAllGridCards(onDone) {
  const scoreEl = document.getElementById('score-display');
  let pipDelay = 0; // cumulative stagger for pip launches
  const PIP_TAIL_MS = spd(990);
  const PIP_GAP_MS  = spd(830);

  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (!card) continue;

    if (!card.filled && !card.scoreQueued && card.slots.every(s => s !== null)) {
      card.scoreQueued = true;
      const pts = evaluateCardScore(cardId);
      if (pts > 0 && scoreEl) {
        const slotKey  = `${cardId}-1`;
        const holderEl = document.querySelector(`.holder-dice[data-slot="${slotKey}"]`);
        if (holderEl) {
          const fromRect = holderEl.getBoundingClientRect();
          const toRect   = scoreEl.getBoundingClientRect();
          for (let p = 0; p < pts; p++) {
            const d = pipDelay;
            setTimeout(() => launchPip(fromRect, toRect,
              () => { state.score++; renderHUD(); },
              () => {},
            ), d);
            pipDelay += PIP_GAP_MS;
          }
        } else {
          state.score += pts;
          renderHUD();
        }
      }
    }

    fillOneCard(cardId);
  }

  // Call onDone after the last pip animation finishes (or immediately if none)
  const totalMs = pipDelay > 0 ? (pipDelay - PIP_GAP_MS) + PIP_TAIL_MS + 80 : 0;
  if (onDone) setTimeout(onDone, totalMs);
}

function isAllDicePlaced() {
  return state.currentRoll.length > 0 &&
         state.currentRoll.every(id => dieInCard(id) !== null);
}

function isGridFullyFilled() {
  return state.grid.every(id => id !== null && state.cards[id]?.filled === true);
}

/** Returns true if at least one tray die can be placed in a non-forbidden grid slot. */
function hasLegalMove() {
  const trayDice = state.currentRoll.filter(id => dieInCard(id) === null);
  if (trayDice.length === 0) return true; // no dice left — not a stuck situation
  for (const dieId of trayDice) {
    for (const cardId of state.grid) {
      if (cardId === null) continue;
      const card = state.cards[cardId];
      if (!card || card.filled) continue;
      for (let si = 0; si < 3; si++) {
        if (card.slots[si] !== null) continue;
        if (!isSlotForbidden(cardId, si, dieId)) return true;
      }
    }
  }
  return false;
}

/** Check after any die placement whether the remaining tray dice are stuck. */
function checkStuck() {
  if (state.phase !== 'place-dice') return;
  if (isAllDicePlaced()) return; // normal end of round — handled elsewhere
  if (!hasLegalMove()) showReplay('no legal moves remaining');
}

function showReplay(reason = '') {
  state.phase = 'replay';
  // Freeze the action bar in place; disable pointer events so nothing is clickable.
  const bar = document.getElementById('action-bar');
  if (bar) bar.style.pointerEvents = 'none';
  render();

  document.getElementById('game-over-reason').textContent = reason;

  // ── Populate game-over overlay ──
  // Card count
  const total = state.discoveredCards.length;
  document.getElementById('go-cards-count').textContent = total;

  // Discovered-cards grid
  const cardsEl = document.getElementById('go-cards-grid');
  cardsEl.innerHTML = state.discoveredCards.map(id =>
    `<div class="go-card-wrap">${renderCardHTML(id)}</div>`
  ).join('');

  // Sweeps by type
  const sweepCounts = {};
  for (const s of state.scoredSets) {
    const label = SCORING_RULE_LABELS[s.ruleId] ?? s.ruleId;
    sweepCounts[label] = (sweepCounts[label] || 0) + 1;
  }
  const sweepsEl = document.getElementById('go-sweeps');
  sweepsEl.innerHTML = Object.keys(sweepCounts).length
    ? Object.entries(sweepCounts)
        .map(([label, n]) =>
          `<div class="go-sweep-row"><span class="go-sweep-label">${label}</span><span class="go-sweep-count">${n}</span></div>`)
        .join('')
    : '<div class="go-sweep-empty">no sweeps</div>';

  const overlay = document.getElementById('game-over-overlay');
  overlay.classList.remove('is-minimized');
  overlay.classList.add('is-visible');
}

function renderWithPreviewFade() {
  const previewEl = document.querySelector('.upcoming-preview');
  if (previewEl) {
    previewEl.classList.add('is-exiting');
    setTimeout(() => render(), spd(180));
  } else {
    render();
  }
}

/** Count unfilled dice slots across all cards currently on the grid. */
function countEmptyDiceSlots() {
  return state.grid.reduce((sum, id) => {
    if (id === null) return sum;
    const card = state.cards[id];
    return sum + (card ? card.slots.filter(s => s === null).length : 0);
  }, 0);
}

/**
 * Spawn a full-grid dice round: preview fades out, tray dice appear.
 * The ghost was already visible from the previous render, so we suppress
 * its slide-in animation — it just stays put.
 */
function spawnFullGridDiceRound() {
  state.phase = 'place-dice';
  state.fullGridDiceRound = true;
  state.suppressGhostAnimation = true; // ghost already visible — don't re-animate
  state.newPreview = true;
  const ids = spawnDice(3);
  state.currentRoll = ids;
  const prevPreview = state.previewOrder;
  state.trayOrder    = prevPreview.length ? orderDiceIdsByValues(ids, prevPreview) : sortDiceIdsForDisplay(ids);
  state.previewOrder = nextComboForDisplay();
  state.diceAccentActive = true;
  selectLeftmostTrayDie();
  renderWithPreviewFade();
  setTimeout(checkStuck, 0);
}

function checkPhaseTransition() {
  if (state.phase === 'place-card' && state.actionBarCards.length === 0) {
    // If a scoring animation is running, wait — commitScoringExit will call us again.
    if (state.scoringExit) return;

    // Post-sweep: second card offered sequentially after the first is placed.
    // Preview dice are already visible (not suppressed), so card 2 just slides in normally.
    if (state.pendingSecondNewCard != null) {
      const nc2 = state.pendingSecondNewCard;
      state.pendingSecondNewCard = null;
      state.actionBarCards = [nc2];
      state.newCards = new Set([nc2]);
      state.selectedCardId = nc2;
      state.selectedDieId  = null;
      render();
      return;
    }

    // Step 2 — first card just placed: preview dice animate in, then second card appears.
    // Only fires once (cardsPlaced === 1, no dice round yet).
    if (state.currentRoll.length === 0 && state.cardsPlaced === 1) {
      const cardId = spawnCard();
      state.actionBarCards = [cardId];
      state.newCards = new Set([cardId]);
      state.selectedCardId = cardId;
      state.selectedDieId  = null;
      state.newCardAfterPreview = true; // preview dice first, card after
      // Freeze preview order now so the tray will match it when dice are spawned.
      state.previewOrder = nextComboForDisplay();
      render();
      return;
    }

    // → place-dice phase (step 3).
    state.phase = 'place-dice';
    state.awaitingPostDiceGridPlace = false;
    const allSlotsFilled = state.grid.every(id => id !== null);
    // Full-grid round: tray + preview animate in; card ghost suppressed (no empty grid slots).
    state.fullGridDiceRound = allSlotsFilled;
    const ids = spawnDice(3);
    state.currentRoll = ids;
    // Tray order must match what was shown in the preview — preserves the displayed sequence.
    const prevPreview = state.previewOrder;
    state.trayOrder    = prevPreview.length ? orderDiceIdsByValues(ids, prevPreview) : sortDiceIdsForDisplay(ids);
    state.previewOrder = nextComboForDisplay();
    state.diceAccentActive = true;
    state.newPreview = true; // always animate tray + preview; ghost guard is fullGridDiceRound
    selectLeftmostTrayDie();
    renderWithPreviewFade();
    setTimeout(checkStuck, 0);
  } else if (state.phase === 'place-dice' && isAllDicePlaced()) {
    if (state.fullGridDiceRound) {
      // Full-grid endgame: convert naturally-filled cards, check scoring, then decide next step.
      // Stay in place-dice throughout so the action bar keeps the ghost visible during conversion.
      state.fullGridDiceRound = false;
      convertFilledCards(() => {
        const emptySlots = countEmptyDiceSlots();
        const willScore = peekAnyScoringMatch();
        if (willScore) {
          // Tell commitScoringExit how many cards to offer after the sweep resolves.
          // 0 empty slots → all remaining cards filled → offer 2 cards (5b).
          // Any other → some card still has open slots → offer 1 card (5b).
          state.pendingPostSweepCards = emptySlots === 0 ? 2 : 1;
        }
        resolveAllScoringSets();
        if (!state.scoringExit) {
          if (emptySlots === 0) {
            showReplay(); // 5a: all slots filled, no sweep → game over
          } else {
            spawnFullGridDiceRound(); // 5a: slots remain → another tray-only dice round
          }
          return;
        }
        render();
      }, true /* force: stay in place-dice, ghost stays visible */);
      return;
    }
    // Normal 3-dice path: offer a new hand card.
    state.phase = 'place-card';
    const cardId = spawnCard();
    state.actionBarCards = [cardId];
    state.newCards = new Set([cardId]);
    state.selectedCardId = cardId;
    state.selectedDieId  = null;
    /* Filled conversion + scoring run only after this new card is placed on the grid. */
    state.awaitingPostDiceGridPlace = true;
    render();
  }
}

/* ── Rendering ── */
function renderHolderDice(cardId, si) {
  const card   = state.cards[cardId];
  const dieId  = card.slots[si];
  const slotKey = `${cardId}-${si}`;

  if (dieId === null) {
    const isForbidden = state.selectedDieId !== null && state.grid.includes(cardId)
      && isSlotForbidden(cardId, si, state.selectedDieId);
    const forbiddenClass = isForbidden
      ? (settings.paidSlots ? ' is-forbidden' : ' is-forbidden is-hard-forbidden')
      : '';
    return `<div class="holder-dice${forbiddenClass}" data-slot="${slotKey}" data-card-id="${cardId}" data-slot-idx="${si}"></div>`;
  }

  // const joker = isJokerCard(cardId);
  let dv = state.dice[dieId].value;
  // if (joker && dv === 1) dv = 7;

  const locked      = !state.currentRoll.includes(dieId);
  const isNew       = state.currentRoll.includes(dieId) && state.diceAccentActive;
  const isSelected  = state.selectedDieId === dieId;
  const newBorderHex = (dv === 1 || dv === 6) ? '#5c5e66' : (PIP_COLOR[dv] ?? '#5c5e66');
  const newBorderStyle = isNew
    ? ` style="--new-border-color:${hexToRgba(newBorderHex, 0.5)}"`
    : '';

  return `<div class="holder-dice${isNew ? ' is-new' : ''}${isSelected ? ' is-selected' : ''}"${newBorderStyle} data-slot="${slotKey}" data-card-id="${cardId}" data-slot-idx="${si}">
    <div class="die-wrapper${locked ? ' is-locked' : ''}" data-name="dice_filled_pips" data-die-id="${dieId}" data-slot="${slotKey}"${locked ? ' data-locked="true"' : ''}>
      ${dieSVG(dv, 40)}
    </div>
  </div>`;
}

function renderCardHTML(cardId, inTray = false, gridDraggable = false) {
  const card      = state.cards[cardId];
  const rank      = cardRank(cardId);
  const suit      = cardSuit(cardId);
  const color     = cardColor(cardId);
  const textColor = suit ? SUIT_COLOR[suit] : (color && color.toUpperCase() !== '#FFFFFF' ? color : '#D3D6E5');

  if (card.filled) {
    if (suit === 'V') {
      // Domino layout: large rank + the two outer rank dice in a gold-bordered tile.
      // The middle slot (1 or 6) is intentionally hidden.
      return `<div class="converter-card converter-card--filled converter-card--domino" data-card-id="${cardId}" style="color:${textColor}">
        <div class="card-index card-index--filled">
          <span class="card-rank card-rank--filled">${rank}</span><span class="card-suit card-suit--filled">&nbsp;</span>
        </div>
        <div class="card-dice">
          <div class="dice-tile dice-tile--bottom dice-tile--v-suit">
            ${renderHolderDice(cardId, 0)}${renderHolderDice(cardId, 2)}
          </div>
        </div>
      </div>`;
    }
    // Normal filled state: large centred index, no dice tiles.
    return `<div class="converter-card converter-card--filled" data-card-id="${cardId}" style="color:${textColor}">
      <div class="card-index card-index--filled">
        <span class="card-rank card-rank--filled">${rank}</span>${suit ? `<span class="card-suit card-suit--filled">${suit}</span>` : ''}
      </div>
    </div>`;
  }

  const gridDragCls = gridDraggable ? ' converter-card--grid-draggable' : '';
  const selectedCls = state.selectedCardId === cardId ? ' is-selected' : '';
  const vSuitCls    = suit === 'V' ? ' converter-card--v-suit' : '';
  const suitDisplay = suit === 'V' ? '&nbsp;' : suit;

  const previewIsNew = !!card.scorePreviewNew;

  return `<div class="converter-card${inTray ? ' in-tray' : ''}${gridDragCls}${vSuitCls}${selectedCls}" data-card-id="${cardId}" style="color:${textColor}">
    ${card.showScorePreview ? `<div class="score-preview${previewIsNew ? ' is-new' : ''}">🪙</div>` : ''}
    <div class="card-index">
      <span class="card-rank">${rank}</span>${suit ? `<span class="card-suit">${suitDisplay}</span>` : ''}
    </div>
    <div class="card-dice">
      <div class="dice-tile dice-tile--top">${renderHolderDice(cardId, 1)}</div>
      <div class="dice-tile dice-tile--bottom">${renderHolderDice(cardId, 0)}${renderHolderDice(cardId, 2)}</div>
    </div>
  </div>`;
}

function renderGrid() {
  const el = document.getElementById('grid-container');
  const se = state.scoringExit;
  if (se?.phase === 'run') el.classList.add('is-scoring-sweep');
  else el.classList.remove('is-scoring-sweep');

  el.classList.toggle('grid-4x4', settings.extendedGrid);

  const tpl = document.querySelector('.template');
  if (se?.phase === 'run') tpl?.classList.add('template--score-sweep');
  else tpl?.classList.remove('template--score-sweep');

  el.innerHTML = Array(getGridTotal()).fill(0).map((_, i) => {
    // Use a ghost copy when the grid slot was already cleared for a prior cross-line sweep
    // but the card is still needed for the current sweep animation.
    const liveId    = state.grid[i];
    const cardId    = liveId ?? state.sweepOverlay[i] ?? null;
    const isOverlay = liveId === null && cardId !== null;
    // Overlay cards are not draggable — they are visual ghosts only.
    const gridDrag  = !isOverlay && cardId !== null && cardIsGridRepositionable(cardId);
    let slotExtra = '';
    let slotStyle = '';
    if (se && cardId !== null && se.lineSlots.includes(i)) {
      const order = se.lineSlots.indexOf(i);
      slotStyle = ` style="--exit-order:${order}"`;
      if (se.phase === 'wait') {
        slotExtra = ' grid-slot--score-pending';
      } else if (se.phase === 'run') {
        slotExtra = ` grid-slot--score-sweep grid-slot--score-sweep--${se.lineKey}`;
      }
    }
    return `<div class="grid-slot${cardId !== null ? ' is-filled' : ''}${slotExtra}" data-grid-slot="${i}"${slotStyle}>
      ${cardId !== null ? renderCardHTML(cardId, false, gridDrag) : ''}
    </div>`;
  }).join('');
}

function renderActionBar() {
  const bar = document.getElementById('action-bar');
  bar.innerHTML = '';

  // Capture and clear card/preview animation order flags before any rendering.
  const cardAfterPreview = !!state.newCardAfterPreview; // preview dice first, card after
  const previewAfterCard = !!state.newPreviewInCard;    // card first, preview dice after
  state.newCardAfterPreview = false;
  state.newPreviewInCard = false;


  if (state.phase === 'place-card') {
    bar.classList.remove('mode-dice');
    let newIdx = 0;
    state.actionBarCards.forEach(cardId => {
      const div = document.createElement('div');
      div.innerHTML = renderCardHTML(cardId, true);
      const el = div.firstElementChild;
      if (state.newCards?.has(cardId)) {
        el.classList.add('is-new');
        // cardAfterPreview: card appears after 3 preview dice (0 + 60 + 120 ms stagger + ~320 ms animation + gap).
        el.style.animationDelay = cardAfterPreview ? `${2 * 60 + 320 + 40}ms` : `${newIdx * 80}ms`;
        newIdx++;
      }
      bar.appendChild(el);
    });
    state.newCards?.clear();
  } else {
    bar.classList.add('mode-dice');
    const tray = document.createElement('div');
    tray.className = 'dice-tray';
    let newIdx = 0;
    state.trayOrder.forEach(dieId => {
      if (dieInCard(dieId) === null) {
        const w = document.createElement('div');
        w.className = 'die-wrapper';
        if (state.newDice?.has(dieId)) {
          w.classList.add('is-new');
          w.style.animationDelay = `${newIdx * 60}ms`;
          newIdx++;
        }
        w.dataset.name = 'dice_filled_pips';
        w.dataset.dieId = dieId;
        if (state.selectedDieId === dieId) w.classList.add('is-selected');
        w.innerHTML = dieSVG(state.dice[dieId].value, 40);
        tray.appendChild(w);
      }
    });
    bar.appendChild(tray);
    state.newDice?.clear(); // only animate on first render after spawn

    // Compute animation timing: tray dice → preview dice → card ghost.
    const isNewPreview = !!state.newPreview;
    state.newPreview = false;
    const playableCount = state.trayOrder.filter(id => dieInCard(id) === null).length;
    // Preview dice start after the last tray die finishes animating in.
    const basePreviewDelay = isNewPreview ? (Math.max(playableCount, 1) - 1) * 60 + 320 : 0;

    // Upcoming dice preview strip — always visible during dice phase.
    const combo = state.previewOrder.length ? state.previewOrder : nextComboForDisplay();
    const preview = document.createElement('div');
    preview.className = 'upcoming-preview';
    preview.innerHTML = combo.map((v, idx) => {
      const cls = `die-wrapper${isNewPreview ? ' preview-is-new' : ''}`;
      const style = `pointer-events:none${isNewPreview ? `;animation-delay:${basePreviewDelay + idx * 60}ms` : ''}`;
      return `<div class="${cls}" style="${style}">${dieSVG(v, 40)}</div>`;
    }).join('');
    bar.appendChild(preview);

    // Card ghost — always visible during dice phase.
    // Animates in after the preview in normal rounds. During a full-grid consecutive round
    // (preview→tray) the ghost was already visible, so we skip the animation to keep it still.
    const animateGhost = isNewPreview && !state.suppressGhostAnimation;
    state.suppressGhostAnimation = false; // consume flag
    const cardGhostDelay = animateGhost ? basePreviewDelay + 2 * 60 + 320 + 40 : 0;
    const cardGhostEl = document.createElement('div');
    cardGhostEl.className = `action-bar-card-ghost${animateGhost ? ' is-new' : ''}`;
    if (animateGhost) cardGhostEl.style.animationDelay = `${cardGhostDelay}ms`;
    cardGhostEl.innerHTML = `<div class="converter-card" style="color:#D3D6E5">
      <div class="card-index"><span class="card-rank"></span></div>
      <div class="card-dice">
        <div class="dice-tile dice-tile--top"><div class="holder-dice"></div></div>
        <div class="dice-tile dice-tile--bottom"><div class="holder-dice"></div><div class="holder-dice"></div></div>
      </div>
    </div>`;
    bar.appendChild(cardGhostEl);
    return; // place-card preview section below is not reached
  }

  // Upcoming dice preview — place-card phase.
  // Show when:  a card is in the bar (normal), OR a dice round is active (currentRoll),
  //             OR we have placed ≥2 cards (transition window: action bar just emptied but
  //             the dice round hasn't started yet — needed so renderWithPreviewFade can find
  //             the element and animate it out rather than hard-cutting).
  // Hidden during initial load (cardsPlaced ≤ 1, no roll), and when explicitly suppressed.
  if (state.phase !== 'replay' &&
      !state.suppressPreviewDice &&
      (state.actionBarCards.length > 0 && state.cardsPlaced > 0 ||
       state.currentRoll.length > 0 ||
       state.cardsPlaced > 1)) {
    const isAnimated = cardAfterPreview || previewAfterCard;
    // cardAfterPreview: preview dice start immediately (0 ms), card follows after them.
    // previewAfterCard: card starts immediately (0 ms), preview dice follow after it (320 ms).
    const previewBaseDelay = cardAfterPreview ? 0 : 320;
    const combo = state.previewOrder.length ? state.previewOrder : nextComboForDisplay();
    const preview = document.createElement('div');
    preview.className = 'upcoming-preview';
    preview.innerHTML = combo.map((v, idx) => {
      const cls = `die-wrapper${isAnimated ? ' preview-is-new' : ''}`;
      const style = `pointer-events:none${isAnimated ? `;animation-delay:${previewBaseDelay + idx * 60}ms` : ''}`;
      return `<div class="${cls}" style="${style}">${dieSVG(v, 40)}</div>`;
    }).join('');
    bar.appendChild(preview);
  }
}

function renderDiscards() {
  const stacks = document.getElementById('discard-stacks');
  if (!stacks) return;
  stacks.innerHTML = DISCARD_RANKS.map((rank, i) => {
    const used = new Set(state.discards[i] || []);
    const entriesHTML = i === 0
      ? Array(4).fill(0).map((_, j) => {
          const converted = j < Math.min(used.size, 4);
          return `<span class="discard-entry${converted ? '' : ' is-dim'}" style="color:${SUIT_COLOR['V']}">V</span>`;
        }).join('')
      : DISPLAY_SUITS.map(suit => {
          const converted = used.has(suit);
          return `<span class="discard-entry${converted ? '' : ' is-dim'}" style="color:${SUIT_COLOR[suit]}">${suit}</span>`;
        }).join('');
    return `<div class="discard-suit">${entriesHTML}</div>`;
  }).join('');
}

function initDiscards() {
  const labels = document.getElementById('discard-labels');
  if (!labels) return;
  labels.innerHTML = ['V','A','2','3','4','5','6','7','8','9','10','aa','ab','ac']
    .map(l => `<div class="discard-label">${ndTranscribe(l)}</div>`).join('');
  renderDiscards();
}

function renderHUD() {
  const countEl = document.getElementById('card-count');
  const scoreEl = document.getElementById('score-display');
  if (countEl) countEl.textContent = Math.max(0, getDeckSize() - state.cardsPlaced);
  if (scoreEl) scoreEl.textContent = `${state.score} 🪙`;
}

function render() {
  renderGrid();
  // During game over leave the action bar exactly as it was — the bottom sheet overlays it.
  if (state.phase !== 'replay') renderActionBar();
  renderDiscards();
  renderHUD();
}


/* ── Game reset (shared by game-over overlay and REPLAY button) ── */
function resetGame() {
  // Restore action-bar interactivity in case it was frozen by a previous game over.
  const bar = document.getElementById('action-bar');
  if (bar) bar.style.pointerEvents = '';
  state.grid           = Array(getGridTotal()).fill(null);
  state.cards          = [];
  state.actionBarCards = [];
  state.dice           = [];
  state.currentRoll    = [];
  state.trayOrder      = [];
  state.phase          = 'place-card';
  state.discards        = {};
  state.discoveredCards = [];
  state.tickerTags     = [];
  state.stars          = 0;
  state.scoredSets     = [];
  state.awaitingPostDiceGridPlace = false;
  state.scoringExit = null;
  state.pendingLineSweeps = [];
  state.sweepOverlay = {};
  state.pendingPostSweepCards = 0;
  state.pendingSecondNewCard = null;
  state.fullGridDiceRound = false;
  state.suppressPreviewDice = false;
  state.suppressGhostAnimation = false;
  state.diceDeck = [];
  state.previewOrder = [];
  state.score = 0;
  state.cardsPlaced = 0;
  state.diceAccentActive = true;
  state.newDice = null;
  state.newCards = null;
  state.newPreview = null;
  state.newPreviewInCard = null;
  state.newCardAfterPreview = null;
  state.selectedDieId = null;
  state.selectedCardId = null;
  forbiddenDieSlots.clear();
  clearScoreExitTimers();
  initDiscards();
  const c0 = spawnCard();
  state.actionBarCards = [c0];
  state.selectedCardId = c0;
  state.selectedDieId  = null;
  render();
}

/* ── Game over ── */
function showGameOver(reason) {
  showReplay(reason);
}

document.getElementById('go-handle').addEventListener('click', e => {
  // Don't minimize when the play-again button inside the handle is tapped.
  if (e.target.closest('#game-over-restart')) return;
  document.getElementById('game-over-overlay').classList.toggle('is-minimized');
});

document.getElementById('game-over-restart').addEventListener('click', () => {
  const overlay = document.getElementById('game-over-overlay');
  overlay.classList.remove('is-visible', 'is-minimized');
  resetGame();
});

/* ── Settings panel rendering ── */
function renderSettingsPanel() {
  const container = document.getElementById('settings-toggles');
  container.innerHTML = '';
  for (const group of SETTINGS_CONFIG) {
    const header = document.createElement('div');
    header.className = 'settings-group-label';
    header.textContent = group.label;
    container.appendChild(header);
    for (const item of group.items) {
      const row = document.createElement('label');
      row.className = 'settings-row';
      const span = document.createElement('span');
      span.className = 'settings-row-label';
      span.textContent = item.label;
      const track = document.createElement('span');
      track.className = 'settings-toggle';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.key = item.key;
      input.checked = settings[item.key];
      input.addEventListener('change', () => {
        settings[item.key] = input.checked;
        // Enforce dependency: paidSlots requires forbiddenSlots.
        if (item.key === 'paidSlots' && input.checked) {
          settings.forbiddenSlots = true;
          const forbiddenInput = document.querySelector('input[data-key="forbiddenSlots"]');
          if (forbiddenInput) forbiddenInput.checked = true;
        }
        if (item.key === 'forbiddenSlots' && !input.checked) {
          settings.paidSlots = false;
          const paidInput = document.querySelector('input[data-key="paidSlots"]');
          if (paidInput) paidInput.checked = false;
        }
        // Speed toggle: flip CSS variable immediately.
        if (item.key === 'fastAnimations') {
          document.documentElement.classList.toggle('fast-anims', input.checked);
        }
        // Grid-size and deck-composition changes require a full restart; other settings just re-render.
        if (item.key === 'extendedGrid' || item.key === 'blankDie' || item.key === 'filterExtremes') {
          document.getElementById('settings-panel').classList.remove('is-open');
          resetGame();
        } else {
          render();
        }
      });
      track.appendChild(input);
      track.insertAdjacentHTML('beforeend', '<span class="settings-toggle-thumb"></span>');
      row.appendChild(span);
      row.appendChild(track);
      container.appendChild(row);
    }
  }
}

/* ── Secret settings panel (tap card-count 4×) ── */
let _settingsTapCount = 0;
let _settingsTapTimer = null;
document.getElementById('card-count').addEventListener('click', () => {
  _settingsTapCount++;
  clearTimeout(_settingsTapTimer);
  _settingsTapTimer = setTimeout(() => { _settingsTapCount = 0; }, 2000);
  if (_settingsTapCount >= 4) {
    _settingsTapCount = 0;
    renderSettingsPanel();
    document.getElementById('settings-panel').classList.add('is-open');
  }
});
document.getElementById('settings-back').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.remove('is-open');
});

document.addEventListener('click', e => {

  // ── Tap-to-select / tap-to-place ──

  // Die: toggle selection — works for both tray dice and freshly placed (unlocked) slot dice.
  const dieWrapper = e.target.closest('.die-wrapper');
  if (dieWrapper && !dieWrapper.dataset.locked) {
    const dieId = parseInt(dieWrapper.dataset.dieId, 10);
    if (!isNaN(dieId)) {
      state.selectedCardId = null;
      if (state.selectedDieId === dieId) {
        // Tap same die → deselect.
        state.selectedDieId = null;
      } else if (state.selectedDieId !== null) {
        // Another die is selected — swap if both are in card slots and swapDice is on.
        const slotA = dieInCard(state.selectedDieId);
        const slotB = dieInCard(dieId);
        if (settings.swapDice && slotA && slotB) {
          const [acStr, asStr] = slotA.split('-');
          const [bcStr, bsStr] = slotB.split('-');
          const ac = parseInt(acStr, 10), as_ = parseInt(asStr, 10);
          const bc = parseInt(bcStr, 10), bs  = parseInt(bsStr, 10);
          state.cards[ac].slots[as_] = dieId;
          state.cards[bc].slots[bs]  = state.selectedDieId;
          state.selectedDieId = null;
          updateScorePreview(ac);
          if (bc !== ac) updateScorePreview(bc);
        } else {
          // Swap disabled, or one/both dice are in the tray — just re-select.
          state.selectedDieId = dieId;
        }
      } else {
        state.selectedDieId = dieId;
      }
      render();
      return;
    }
  }

  // Holder-dice slot: place selected die.
  // Only handle elements that belong to a real grid-card slot (have data-slot).
  // Decorative holder-dice inside the action-bar card have no data-slot and must
  // fall through so the converter-card.in-tray handler can process the click.
  const holderEl = e.target.closest('.holder-dice');
  if (holderEl && holderEl.dataset.slot) {
    if (state.selectedDieId !== null) {
      const slotKey = holderEl.dataset.slot;
      const [cidStr, siStr] = slotKey.split('-');
      const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
      const card = state.cards[cardId];
      const forbidden = card && card.slots[si] === null && isSlotForbidden(cardId, si, state.selectedDieId);
      const hardBlock = forbidden && !settings.paidSlots;
      const canPlace  = card && card.slots[si] === null && (!forbidden || (!hardBlock && state.score > 0));
      if (canPlace) {
        const inGrid = state.grid.includes(cardId);
        if (forbidden) {
          state.score--;
          renderHUD();
          if (inGrid) launchPenaltyPip(holderEl.getBoundingClientRect());
          forbiddenDieSlots.add(state.selectedDieId);
        }
        // If the die is currently sitting in another slot, vacate it first.
        const prevSlotKey = dieInCard(state.selectedDieId);
        const fromTray = !prevSlotKey; // die came from tray, not from another card slot
        if (prevSlotKey) {
          // Refund coin if this die was previously placed in a forbidden slot.
          if (settings.refundOnMove && forbiddenDieSlots.has(state.selectedDieId)) {
            forbiddenDieSlots.delete(state.selectedDieId);
            const prevCardId   = parseInt(prevSlotKey.split('-')[0], 10);
            const prevHolderEl = document.querySelector(`[data-slot="${prevSlotKey}"]`);
            const scoreEl      = document.getElementById('score-display');
            if (state.grid.includes(prevCardId) && prevHolderEl && scoreEl) {
              launchPip(prevHolderEl.getBoundingClientRect(), scoreEl.getBoundingClientRect(),
                () => { state.score++; renderHUD(); }, () => {});
            } else {
              state.score++; renderHUD();
            }
          }
          const [pcStr, psStr] = prevSlotKey.split('-');
          state.cards[parseInt(pcStr, 10)].slots[parseInt(psStr, 10)] = null;
        }
        card.slots[si] = state.selectedDieId;
        state.selectedDieId = null;
        updateScorePreview(cardId);
        selectLeftmostTrayDie(); // auto-select next leftmost unplaced die
        render();
        // Only check phase transition for first-time placements (from tray).
        // Rearranging between card slots must not re-trigger the "all placed" endgame.
        if (fromTray) { checkPhaseTransition(); checkStuck(); }
      }
      // Placement failed (occupied or restricted slot) — keep die selected so the
      // player can try a different slot without having to re-tap the die.
      return;
    }
    // No die selected, real card slot clicked — do nothing (no deselect on random taps).
    return;
  }

  // Tray card: toggle selection
  const cardEl = e.target.closest('.converter-card.in-tray');
  if (cardEl) {
    const cardId = parseInt(cardEl.dataset.cardId, 10);
    if (!isNaN(cardId)) {
      state.selectedDieId = null;
      state.selectedCardId = state.selectedCardId === cardId ? null : cardId;
      render();
      return;
    }
  }

  // Grid card (repositionable): toggle selection.
  // Clicks on .holder-dice slots are handled above (die placement).
  // Clicks in the dice area with a die selected (e.g. passing through a forbidden slot
  // whose pointer-events:none lets the event fall to .dice-tile) must not select the card.
  const gridCardEl = e.target.closest('.converter-card.converter-card--grid-draggable');
  if (gridCardEl) {
    const cardId = parseInt(gridCardEl.dataset.cardId, 10);
    if (!isNaN(cardId) && cardIsGridRepositionable(cardId)) {
      if (state.selectedDieId !== null && e.target.closest('.card-dice')) return;
      state.selectedDieId = null;
      state.selectedCardId = state.selectedCardId === cardId ? null : cardId;
      render();
      return;
    }
  }

  // Grid slot: place selected card
  const gridSlotEl = e.target.closest('.grid-slot');
  if (gridSlotEl && state.selectedCardId !== null) {
    const i = parseInt(gridSlotEl.dataset.gridSlot, 10);
    if (!isNaN(i)) {
      const placedCardId = state.selectedCardId;
      const fromGridIndex = state.grid.indexOf(placedCardId);
      const fromGrid = fromGridIndex !== -1;

      if (fromGrid && fromGridIndex === i) {
        // Tapped the same slot — deselect
        state.selectedCardId = null;
        render();
        return;
      }

      if (state.grid[i] === null) {
        if (fromGrid) {
          // Grid-to-grid reposition
          state.grid[fromGridIndex] = null;
          state.grid[i] = placedCardId;
          state.selectedCardId = null;
          render();
        } else {
          // Action-bar card placed onto grid
          state.actionBarCards = state.actionBarCards.filter(id => id !== placedCardId);
          if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
          state.cardsPlaced++;
          state.grid[i] = placedCardId;
          state.diceAccentActive = false;
          state.selectedCardId = null;
          render();
          setTimeout(() => {
            convertFilledCards(() => {
              resolveAllScoringSets();
              render();
              checkPhaseTransition();
            });
          }, spd(220));
        }
        return;
      }
    }
    // Clicked an occupied or out-of-bounds slot with a card selected — do nothing.
    return;
  }
  // Tapped somewhere with no matching handler — do nothing.
  // Selection is only cleared by tapping the active die/card again (toggle off)
  // or by switching to a different die/card.
});

/* ── Forbidden-slot helpers (used by both drag and selection rendering) ── */
function isSlotForbidden(cardId, si, dieId) {
  if (!settings.forbiddenSlots && !settings.paidSlots) return false;
  const dieVal = state.dice[dieId]?.value;
  const isBlank = dieVal === 0;

  if (si === 0 || si === 2) {
    // Rank slot rules for blank dice.
    if (isBlank) {
      // Blank forbidden in rank unless the toggle is on.
      if (!settings.blanksInRank) return true;
      // blanksInRank on: forbidden if the OTHER rank slot has a non-blank die.
      const otherSi = si === 0 ? 2 : 0;
      const otherId = state.cards[cardId]?.slots[otherSi];
      if (otherId !== null && otherId !== undefined && state.dice[otherId]?.value !== 0) return true;
    } else if (settings.blanksInRank) {
      // Non-blank forbidden in rank if the OTHER rank slot already has a blank die.
      const otherSi = si === 0 ? 2 : 0;
      const otherId = state.cards[cardId]?.slots[otherSi];
      if (otherId !== null && otherId !== undefined && state.dice[otherId]?.value === 0) return true;
    }
  }

  return (si === 1 && (dieVal === 1 || dieVal === 6))
      || wouldCreateDuplicate(cardId, si, dieId);
}

/** Mark / unmark every empty holder-dice slot as forbidden for dieId.
 *  Only grid cards show forbidden indicators — tray/action-bar cards are skipped. */
function markForbiddenHolders(dieId) {
  document.querySelectorAll('.holder-dice[data-slot]').forEach(el => {
    const slotKey = el.dataset.slot;
    if (!slotKey) return;
    const [cidStr, siStr] = slotKey.split('-');
    const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
    if (!state.grid.includes(cardId)) return; // skip tray / action-bar cards
    const card = state.cards[cardId];
    if (!card || card.slots[si] !== null) return; // occupied — leave as-is
    const forbidden = isSlotForbidden(cardId, si, dieId);
    el.classList.toggle('is-forbidden',      forbidden);
    el.classList.toggle('is-hard-forbidden', forbidden && !settings.paidSlots);
  });
}

function clearForbiddenHolders() {
  document.querySelectorAll('.holder-dice.is-forbidden').forEach(el => {
    el.classList.remove('is-forbidden', 'is-hard-forbidden');
  });
}

/* ── Drag & Drop ── */
const ghost = document.getElementById('drag-ghost');
let drag = null;
let dragStartX = 0, dragStartY = 0, dragCommitted = false;
const DRAG_THRESHOLD = 6;

document.addEventListener('pointerdown', e => {
  // ── Card drag (from action bar or repositionable grid card) ──
  const cardEl = e.target.closest('.converter-card.in-tray')
    || e.target.closest('.converter-card.converter-card--grid-draggable');
  if (cardEl) {
    // Skip drag setup when the tap is on an unlocked die in a slot (either selecting it
    // or placing the currently-selected die there). Without this the pointer-capture
    // redirects the click event to the card element, bypassing the die/holder handlers.
    const tapDieEl = e.target.closest('.die-wrapper');
    if (tapDieEl && !tapDieEl.dataset.locked) return;
    if (state.selectedDieId !== null
        && cardEl.classList.contains('converter-card--grid-draggable')
        && e.target.closest('.holder-dice')?.dataset.slot) {
      return;
    }
    e.preventDefault();
    const cardId = parseInt(cardEl.dataset.cardId, 10);
    const fromGrid = cardEl.classList.contains('converter-card--grid-draggable');
    const slotEl = fromGrid ? cardEl.closest('.grid-slot') : null;
    const fromGridIndex = slotEl ? parseInt(slotEl.dataset.gridSlot, 10) : null;
    if (fromGrid) {
      if (fromGridIndex === null || Number.isNaN(fromGridIndex)
          || state.grid[fromGridIndex] !== cardId || !cardIsGridRepositionable(cardId)) {
        return;
      }
    }
    drag = { type: 'card', cardId, originEl: cardEl, fromGrid, fromGridIndex };
    dragStartX = e.clientX; dragStartY = e.clientY; dragCommitted = false;
    cardEl.setPointerCapture(e.pointerId);
    return;
  }

  // ── Die drag ──
  const wrapper = e.target.closest('.die-wrapper');
  if (!wrapper || wrapper.dataset.locked) return;
  e.preventDefault();

  const dieId      = parseInt(wrapper.dataset.dieId, 10);
  const originSlot = wrapper.dataset.slot || null;

  drag = { type: 'die', dieId, originSlot, originEl: wrapper };
  dragStartX = e.clientX; dragStartY = e.clientY; dragCommitted = false;
  wrapper.setPointerCapture(e.pointerId);
}, { passive: false });

document.addEventListener('pointermove', e => {
  if (!drag) return;

  if (!dragCommitted) {
    const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
    if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
    // Threshold crossed — commit to drag, clear any selection
    dragCommitted = true;
    state.selectedDieId = null;
    state.selectedCardId = null;
    if (drag.type === 'card') {
      ghost.classList.remove('die-drag');
      ghost.innerHTML = renderCardHTML(drag.cardId);
      drag.originEl.classList.add('is-dragging');
    } else {
      ghost.classList.add('die-drag');
      ghost.innerHTML = dieSVG(state.dice[drag.dieId].value, 40);
      drag.originEl.classList.add('is-dragging');
      markForbiddenHolders(drag.dieId);
    }
    ghost.style.left = e.clientX + 'px';
    ghost.style.top  = e.clientY + 'px';
    ghost.classList.add('is-visible');
  }

  ghost.style.left = e.clientX + 'px';
  ghost.style.top  = e.clientY + 'px';

  ghost.classList.remove('is-visible');
  if (drag.type === 'card') ghost.classList.remove('die-drag');
  const under = document.elementFromPoint(e.clientX, e.clientY);
  ghost.classList.add('is-visible');
  if (drag.type === 'die') ghost.classList.add('die-drag');

  if (drag.type === 'card') {
    document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
    const slot = under?.closest('.grid-slot');
    if (slot) {
      const gi = parseInt(slot.dataset.gridSlot, 10);
      const empty = state.grid[gi] === null;
      const origin = drag.fromGrid && drag.fromGridIndex === gi;
      if (empty || origin) slot.classList.add('drag-over');
    }
    return;
  }

  // die drag
  document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
  document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));

  const holderEl = under?.closest('.holder-dice');
  if (holderEl) {
    const slotKey = holderEl.dataset.slot;
    const [cidStr, siStr] = slotKey.split('-');
    const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
    const card = state.cards[cardId];
    const isLocked = card && card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
    const isForbidden = holderEl.classList.contains('is-forbidden');
    const hardBlock   = isForbidden && !settings.paidSlots;
    if (!isLocked && (!isForbidden || (!hardBlock && state.score > 0))) holderEl.classList.add('drag-over');
  } else {
    const trayDie = under?.closest('.die-wrapper');
    if (trayDie && !trayDie.dataset.slot && parseInt(trayDie.dataset.dieId, 10) !== drag.dieId) {
      trayDie.classList.add('tray-swap-target');
    }
  }
}, { passive: true });

document.addEventListener('pointerup', e => {
  if (!drag) return;

  if (!dragCommitted) {
    // Tap — let the click event handle selection/placement
    drag = null;
    return;
  }

  clearForbiddenHolders();
  ghost.classList.remove('is-visible');
  const under = document.elementFromPoint(e.clientX, e.clientY);
  ghost.classList.remove('is-visible');

  // ── Card drop ──
  if (drag.type === 'card') {
    document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
    const slot = under?.closest('.grid-slot');
    if (slot) {
      const i = parseInt(slot.dataset.gridSlot, 10);
      if (drag.fromGrid && drag.fromGridIndex === i) {
        if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
        drag = null;
        return;
      }
      if (state.grid[i] === null) {
        const fromGrid = drag.fromGrid;
        if (fromGrid) state.grid[drag.fromGridIndex] = null;
        else {
          state.actionBarCards = state.actionBarCards.filter(id => id !== drag.cardId);
          if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
          state.cardsPlaced++;
        }
        state.grid[i] = drag.cardId;
        drag = null;
        if (!fromGrid) state.diceAccentActive = false; // only drop accent on fresh placement, not grid repositions
        render(); // accent borders drop here; CSS transition plays
        setTimeout(() => {
          convertFilledCards(() => {
            resolveAllScoringSets();
            render();
            checkPhaseTransition();
          });
        }, spd(220)); // wait for box-shadow transition to finish
        return;
      }
    }
    if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
    drag = null;
    return;
  }

  // ── Die drop ──
  document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
  document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));

  const holderEl   = under?.closest('.holder-dice');
  const trayDieEl  = !holderEl ? under?.closest('.die-wrapper') : null;
  const targetTrayId = trayDieEl && !trayDieEl.dataset.slot
    ? parseInt(trayDieEl.dataset.dieId, 10) : null;

  if (holderEl) {
    const slotKey = holderEl.dataset.slot;
    const [cidStr, siStr] = slotKey.split('-');
    const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
    const card = state.cards[cardId];
    if (!card) { drag = null; return; }

    // Illegal placement: never allow dropping onto an occupied holder.
    // Keep state unchanged so the die returns to where it came from.
    if (card.slots[si] !== null) {
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
      drag = null;
      return;
    }

    const isLocked = card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
    if (isLocked) {
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
      drag = null;
      return;
    }

    const inGrid    = state.grid.includes(cardId);
    const forbidden = isSlotForbidden(cardId, si, drag.dieId);
    if (forbidden) {
      const hardBlock = !settings.paidSlots;
      const canPay    = !hardBlock && state.score > 0;
      if (hardBlock || !canPay) {
        if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
        drag = null;
        return;
      }
      state.score--;
      renderHUD();
      if (inGrid) launchPenaltyPip(holderEl.getBoundingClientRect());
      forbiddenDieSlots.add(drag.dieId);
    }

    // Remove die from its origin slot (if it came from a card slot)
    if (drag.originSlot) {
      // Refund coin if this die was previously placed in a forbidden slot.
      if (settings.refundOnMove && forbiddenDieSlots.has(drag.dieId)) {
        forbiddenDieSlots.delete(drag.dieId);
        const prevCardId   = parseInt(drag.originSlot.split('-')[0], 10);
        const prevHolderEl = document.querySelector(`[data-slot="${drag.originSlot}"]`);
        const scoreEl      = document.getElementById('score-display');
        if (state.grid.includes(prevCardId) && prevHolderEl && scoreEl) {
          launchPip(prevHolderEl.getBoundingClientRect(), scoreEl.getBoundingClientRect(),
            () => { state.score++; renderHUD(); }, () => {});
        } else {
          state.score++; renderHUD();
        }
      }
      const [ocStr, osiStr] = drag.originSlot.split('-');
      state.cards[parseInt(ocStr, 10)].slots[parseInt(osiStr, 10)] = null;
    }

    // Track origin card before clearing drag
    const originCardId = drag.originSlot
      ? parseInt(drag.originSlot.split('-')[0], 10) : null;

    const fromTray = !drag.originSlot; // die came from tray, not from a card slot
    card.slots[si] = drag.dieId;
    drag = null;

    // Show preview immediately on any affected card
    updateScorePreview(cardId);
    if (originCardId !== null && originCardId !== cardId) updateScorePreview(originCardId);
    selectLeftmostTrayDie(); // auto-select next leftmost unplaced die
    render();
    // Only check phase transition for first-time placements (from tray).
    if (fromTray) { checkPhaseTransition(); checkStuck(); }

  } else if (targetTrayId !== null && targetTrayId !== drag.dieId) {
    // Swap tray order
    const ia = state.trayOrder.indexOf(drag.dieId);
    const ib = state.trayOrder.indexOf(targetTrayId);
    if (ia !== -1 && ib !== -1) {
      [state.trayOrder[ia], state.trayOrder[ib]] = [state.trayOrder[ib], state.trayOrder[ia]];
    }
    if (drag.originSlot) {
      const [ocStr, osiStr] = drag.originSlot.split('-');
      state.cards[parseInt(ocStr, 10)].slots[parseInt(osiStr, 10)] = null;
    }
    render();

  } else {
    // Drop onto nothing — return die to origin slot
    if (drag.originSlot) {
      // Origin state was never removed unless a legal target accepted the die,
      // so keep card slots unchanged and just re-render to restore visuals.
      render();
    } else {
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
    }
  }

  drag = null;
});

document.addEventListener('pointercancel', () => {
  if (!drag) return;
  if (dragCommitted && drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
  clearForbiddenHolders();
  ghost.classList.remove('is-visible');
  ghost.classList.remove('die-drag');
  drag = null;
  document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
  document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));
  document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
});

/* ── Init ── */
initDiscards();
renderHUD();
const _c0 = spawnCard();
state.actionBarCards = [_c0];
state.selectedCardId = _c0;
render();
