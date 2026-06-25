import { state } from './state.js';
import { settings } from './settings.js';
import { cardRank, cardSuit, cardSlotValue, DISCARD_RANKS, isTricolorCard } from './cards.js';

/* ── Grid geometry helpers (3×3 or 4×4) ── */
export function getGridSize()  { return settings.extendedGrid ? 4 : 3; }
export function getGridTotal() { return getGridSize() ** 2; }

/** All lines of length N on an N×N grid: rows, cols, both diagonals. */
export function getGridLines() {
  const N = getGridSize();
  const lines = [];
  for (let r = 0; r < N; r++) lines.push(Array.from({ length: N }, (_, c) => r * N + c));
  for (let c = 0; c < N; c++) lines.push(Array.from({ length: N }, (_, r) => r * N + c));
  lines.push(Array.from({ length: N }, (_, i) => i * N + i));
  lines.push(Array.from({ length: N }, (_, i) => i * N + (N - 1 - i)));
  return lines;
}

/** Grid card may be moved to another slot until any die is placed on it. */
export function cardIsGridRepositionable(cardId) {
  const c = state.cards[cardId];
  if (!c || c.filled || c.empty) return false;
  return c.slots.every(s => s === null || s === undefined);
}

/** Sweep axis for CSS derived from the line's pattern on the current grid. */
export function lineExitKey(line) {
  const N = getGridSize();
  const [a, b] = line;
  if (Math.floor(a / N) === Math.floor(b / N)) return 'h';
  if (a % N === b % N) return 'v';
  if (b - a === N + 1) return 'd1';
  return 'd2';
}

/* ── Sweep rules ── */
export const SWEEP_RULE_ORDER = ['set', 'runFlush', 'runDiff', 'runAny', 'flush', 'tarokFlush', 'domino'];

export const SCORING_RULE_LABELS = {
  set:        'Set',
  runFlush:   'Run flush',
  runDiff:    'Run diff',
  runAny:     'Run any',
  flush:      'Flush',
  tarokFlush: 'Tarok flush',
  domino:     'Domino',
};

/** Returns true when all N rank-positions form a consecutive circular run (wraps at A/12).
 *  Cards with rank '*' (double-blank) act as wildcards and fill any gap. */
export function isConsecutiveRanks(cardIds) {
  if (cardIds.some(id => isTricolorCard(id))) return false;
  const WRAP = 12;
  const N    = cardIds.length;
  const wildcards = cardIds.filter(id => cardRank(id) === '*').length;
  if (wildcards === N) return true;

  const nonWild = cardIds.filter(id => cardRank(id) !== '*');
  const rawIdx  = nonWild.map(id => DISCARD_RANKS.indexOf(cardRank(id)));
  if (rawIdx.some(i => i <= 0)) return false;
  const sorted = rawIdx.map(i => i - 1).sort((a, b) => a - b);
  if (new Set(sorted).size !== sorted.length) return false;

  for (let start = 0; start < WRAP; start++) {
    const fits = sorted.every(idx => ((idx - start + WRAP) % WRAP) < N);
    if (fits) return true;
  }
  return false;
}

/** Resolve suits with wildTarok for "flush" mode (all same). */
export function effectiveSuitsFlush(cardIds) {
  const raw = cardIds.map(id => cardSuit(id));
  if (!settings.wildTarok) return raw;
  const nonV = raw.filter(s => s && s !== 'V');
  if (nonV.length === 0) return raw.map(() => 'Z');
  if (!nonV.every(s => s === nonV[0])) return raw;
  return raw.map(s => (s === 'V' ? nonV[0] : s));
}

/** Resolve suits with wildTarok for "diff" mode (all different). */
export function effectiveSuitsDiff(cardIds) {
  const raw = cardIds.map(id => cardSuit(id));
  if (!settings.wildTarok) return raw;
  const nonV = raw.filter(s => s && s !== 'V');
  if (new Set(nonV).size !== nonV.length) return raw;
  const used = new Set(nonV);
  const SUITS = ['Z', 'X', 'Y', 'W'];
  return raw.map(s => {
    if (s !== 'V') return s;
    const fill = SUITS.find(x => !used.has(x)) ?? 'Z';
    used.add(fill);
    return fill;
  });
}

export const SCORING_RULES = {
  set(cardIds) {
    if (cardIds.every(id => isTricolorCard(id))) return true;
    if (cardIds.some(id => isTricolorCard(id))) return false;
    const isWild  = id => !isTricolorCard(id) && (cardRank(id) === '*' || cardSuit(id) === 'V');
    const nonWild = cardIds.filter(id => !isWild(id));
    const wilds   = cardIds.filter(id =>  isWild(id));
    if (nonWild.length === 0) return true;
    const r0 = cardRank(nonWild[0]);
    if (r0 === '' || r0 === ' ' || !nonWild.every(id => cardRank(id) === r0)) return false;
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
  domino(cardIds, lineSlots) {
    if (cardIds.some(id => isTricolorCard(id))) return false;
    if (!lineSlots || lineExitKey(lineSlots) !== 'h') return false;
    if (!cardIds.every(id => cardSuit(id) === 'V')) return false;
    for (let i = 0; i < cardIds.length - 1; i++) {
      if (cardRank(cardIds[i]) === '*' || cardRank(cardIds[i + 1]) === '*') continue;
      const right = cardSlotValue(cardIds[i],     2);
      const left  = cardSlotValue(cardIds[i + 1], 0);
      if (!right || !left || right !== left) return false;
    }
    return true;
  },
};

/** Returns all matching rule IDs (in display order) for a slot segment.
 *  A null grid slot in the segment means incomplete — returns [] immediately.
 *  Blocker cards (card.empty) are skipped: they don't block completion and
 *  don't participate in pattern matching or sweep animation. */
export function findAllMatchesOnLine(lineSlots) {
  const filteredSlots = [];
  const cardIds       = [];

  for (const i of lineSlots) {
    const cid = state.grid[i];
    if (cid === null || cid === undefined) return [];
    const card = state.cards[cid];
    if (card?.empty) continue;
    if (!card?.filled) return [];
    filteredSlots.push(i);
    cardIds.push(cid);
  }

  if (cardIds.length === 0) return [];
  return SWEEP_RULE_ORDER
    .filter(ruleId => settings[ruleId] && SCORING_RULES[ruleId]?.(cardIds, filteredSlots))
    .map(ruleId => ({ ruleId, cardIds: [...cardIds], filteredLineSlots: [...filteredSlots] }));
}

/** Returns the first match on a segment (for quick peek). */
export function findScoringMatchOnLine(lineSlots) {
  return findAllMatchesOnLine(lineSlots)[0] ?? null;
}

/** All 3-slot sweep candidates on 4×4 when sweepThreeInRow is on; otherwise []. */
export function getThreeSweepSegments() {
  const N = getGridSize();
  if (N !== 4 || !settings.sweepThreeInRow) return [];

  const seen = new Set();
  const segments = [];

  function add(seg) {
    const key = seg.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    segments.push(seg);
  }

  for (const line of getGridLines()) {
    add(line.slice(0, 3));
    add(line.slice(1, 4));
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const d1 = [];
      for (let i = 0; i < 3; i++) {
        const nr = r + i;
        const nc = c + i;
        if (nr >= N || nc >= N) break;
        d1.push(nr * N + nc);
      }
      if (d1.length === 3) add(d1);

      const d2 = [];
      for (let i = 0; i < 3; i++) {
        const nr = r + i;
        const nc = c - i;
        if (nr >= N || nc < 0) break;
        d2.push(nr * N + nc);
      }
      if (d2.length === 3) add(d2);
    }
  }

  return segments;
}

function segmentIsSubsetOf(sub, sup) {
  const supSet = new Set(sup);
  return sub.every(i => supSet.has(i));
}

/** Ordered sweep matches: full lines first, then 3-segments (4×4 + sweepThreeInRow). */
export function collectScoringMatches() {
  const matches = [];

  for (const line of getGridLines()) {
    const match = findScoringMatchOnLine(line);
    if (match) {
      matches.push({
        ruleId:            match.ruleId,
        cardIds:           match.cardIds,
        filteredLineSlots: match.filteredLineSlots,
        lineKey:           lineExitKey(match.filteredLineSlots),
      });
    }
  }

  if (getThreeSweepSegments().length === 0) return matches;

  const suppressed = matches.map(m => m.filteredLineSlots);
  const threeSegments = getThreeSweepSegments();

  for (const seg of threeSegments) {
    if (suppressed.some(full => segmentIsSubsetOf(seg, full))) continue;
    const match = findScoringMatchOnLine(seg);
    if (match) {
      matches.push({
        ruleId:            match.ruleId,
        cardIds:           match.cardIds,
        filteredLineSlots: match.filteredLineSlots,
        lineKey:           lineExitKey(match.filteredLineSlots),
      });
    }
  }

  return matches;
}

export function peekAnyScoringMatch() {
  return collectScoringMatches().length > 0;
}
