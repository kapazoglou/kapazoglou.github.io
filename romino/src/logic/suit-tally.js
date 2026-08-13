import { state } from './state.js';
import { settings } from './settings.js';
import { tileCountKey } from './game-log.js';
import { DISCARD_RANKS, JOKER_RANK, SWEPT_SUIT_ORDER, missingInnerDieFromTricolor, suitFromValue } from './dice-visual.js';

/** 13 rank rows: A + 2–12 + joker (discovery grid). */
export const SWEEP_DISCOVERY_RANKS = ['A', ...DISCARD_RANKS.slice(2, 13), JOKER_RANK];

/** Game ends when any suit tally exceeds this value (i.e. reaches 13). */
export const SWEPT_SUIT_CAP = 12;

export const SWEPT_SUIT_CAP_REASON = 'suit tally complete';

export function tallySuit(suit) {
  if (!suit || state.suitTally[suit] == null) return;
  state.suitTally[suit]++;
}

/** Switcher Jokers convert — suit tally + discovery grid (joker rank, missing suit). */
export function tallySwitcherConvert(values) {
  const missing = missingInnerDieFromTricolor(values);
  if (missing == null) return;
  const suit = suitFromValue(missing);
  tallySuit(suit);
  if (!settings.sweptSuits) return;
  (state.convertSweepTiles ??= []).push({ suit, rank: JOKER_RANK, rankSum: 0 });
}

export function isSuitTallyCapReached() {
  if (!settings.sweptSuits) return false;
  return SWEPT_SUIT_ORDER.some(letter => (state.suitTally[letter] ?? 0) > SWEPT_SUIT_CAP);
}

/** @returns {typeof SWEPT_SUIT_CAP_REASON | null} */
export function suitTallyGameOverReason() {
  return isSuitTallyCapReached() ? SWEPT_SUIT_CAP_REASON : null;
}

export function lowestSuitTallyCount() {
  return Math.min(...SWEPT_SUIT_ORDER.map(letter => state.suitTally[letter] ?? 0));
}

/** End bonus points per lowest suit tally (applied at suit-cap game over). */
export const SWEPT_SUIT_END_BONUS_PER = 2;

/** End bonus points per unique swept rank+suit combo (full deck cap). */
export const SWEPT_SUIT_UNIQUE_COMBO_BONUS_PER = 1;

/** Max distinct rank+suit combos that count toward the end bonus (52-card deck). */
export const SWEPT_SUIT_UNIQUE_COMBO_CAP = 52;

/** Distinct suit:rank keys swept or Switcher-converted this session (capped). */
export function countUniqueSessionSweepCombos() {
  const seen = new Set();
  for (const tile of buildSessionSweepTiles()) {
    seen.add(tileCountKey(tile.suit, tile.rank));
  }
  return Math.min(seen.size, SWEPT_SUIT_UNIQUE_COMBO_CAP);
}

/** End bonus: lowest-suit tally + unique rank+suit combos (applied at suit-cap game over). */
export function applySweptSuitsEndBonus() {
  const suitBonus = lowestSuitTallyCount() * SWEPT_SUIT_END_BONUS_PER;
  const comboBonus = countUniqueSessionSweepCombos() * SWEPT_SUIT_UNIQUE_COMBO_BONUS_PER;
  const bonus = suitBonus + comboBonus;
  if (bonus > 0) state.points += bonus;
  return bonus;
}

/** All session swept tiles (sweeps + Switcher Joker converts), one entry per tile. */
export function buildSessionSweepTiles() {
  return [
    ...(state.convertSweepTiles ?? []),
    ...state.sweepHistory.flat(),
  ];
}

/** Per suit:rank counts from session sweeps + Switcher Joker converts. */
export function buildSessionSweepTileCounts() {
  const counts = {};
  for (const tile of buildSessionSweepTiles()) {
    const key = tileCountKey(tile.suit, tile.rank);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
