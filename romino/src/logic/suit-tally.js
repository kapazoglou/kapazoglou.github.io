import { state } from './state.js';
import { settings } from './settings.js';
import { tileCountKey } from './game-log.js';
import { DISCARD_RANKS, JOKER_RANK, SWEPT_SUIT_ORDER, missingInnerDieFromTricolor, suitFromValue, isSwitcherTricolorStack, tileIdentityFromStackValues } from './dice-visual.js';

/** 13 rank rows: A + 2–12 + joker (discovery grid). */
export const SWEEP_DISCOVERY_RANKS = ['A', ...DISCARD_RANKS.slice(2, 13), JOKER_RANK];

/** Game ends when any suit tally exceeds this value (i.e. reaches 14). */
export const SWEPT_SUIT_CAP = 13;

export const SWEPT_SUIT_CAP_REASON = 'suit tally complete';

/** Game-over reason when all 52 rank+suit combos appear in the discovery grid. */
export const DISCOVERY_WIN_REASON = 'winner';

/** Game-over reason when discovery is complete with zero duplicate suit:rank copies. */
export const DISCOVERY_FLAWLESS_REASON = 'flawless';

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

export function isDiscoveryGridComplete() {
  if (!settings.sweptSuits) return false;
  return countUniqueSessionSweepCombos() >= SWEPT_SUIT_UNIQUE_COMBO_CAP;
}

export function isDiscoveryFlawless() {
  return isDiscoveryGridComplete() && countDuplicateSessionSweepExtras() === 0;
}

/** @returns {typeof DISCOVERY_FLAWLESS_REASON | typeof DISCOVERY_WIN_REASON | null} */
export function discoveryWinGameOverReason() {
  if (!settings.sweptSuits) return null;
  if (isDiscoveryFlawless()) return DISCOVERY_FLAWLESS_REASON;
  if (isDiscoveryGridComplete()) return DISCOVERY_WIN_REASON;
  return null;
}

/** Extra game-over multiplier on top of full sweeps (+1 winner, +2 flawless). */
export function discoveryWinMultiplierBonus(reason) {
  if (reason === DISCOVERY_FLAWLESS_REASON) return 2;
  if (reason === DISCOVERY_WIN_REASON) return 1;
  return 0;
}

export function lowestSuitTallyCount() {
  return Math.min(...SWEPT_SUIT_ORDER.map(letter => state.suitTally[letter] ?? 0));
}

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

/** Extra copies beyond the first per suit:rank (session sweeps + Switcher converts). */
export function countDuplicateSessionSweepExtras() {
  let extras = 0;
  for (const count of Object.values(buildSessionSweepTileCounts())) {
    if (count > 1) extras += count - 1;
  }
  return extras;
}

/** End bonus breakdown; does not mutate state. */
export function computeSweptSuitsEndBonus() {
  const lowestCount = lowestSuitTallyCount();
  const uniqueCount = countUniqueSessionSweepCombos();
  const duplicateExtras = countDuplicateSessionSweepExtras();
  const lowSuitPer = settings.sweptLowSuitBonus ?? 2;
  const dupPer = settings.sweptDuplicatePenalty ?? 1;
  const suitBonus = lowestCount * lowSuitPer;
  const comboBonus = uniqueCount * SWEPT_SUIT_UNIQUE_COMBO_BONUS_PER;
  const dupPenalty = duplicateExtras * dupPer;
  const total = suitBonus + comboBonus - dupPenalty;
  return {
    lowestCount,
    uniqueCount,
    duplicateExtras,
    suitBonus,
    comboBonus,
    dupPenalty,
    total,
  };
}

/** End bonus: lowest-suit tally + unique combos − duplicate penalty (when sweptSuits ON). */
export function applySweptSuitsEndBonus() {
  const breakdown = computeSweptSuitsEndBonus();
  if (breakdown.total !== 0) state.points += breakdown.total;
  return breakdown;
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

/** Prior session sweeps + Switcher converts for this suit:rank. */
export function sessionSweepPriorCount(suit, rank) {
  return buildSessionSweepTileCounts()[tileCountKey(suit, rank)] ?? 0;
}

/** Duplicate index if swept/converted next (1 = first duplicate, 2 = second, …); 0 = not yet duplicated. */
export function sessionSweepDuplicateNumber(suit, rank) {
  return sessionSweepPriorCount(suit, rank);
}

/** @deprecated alias — use sessionSweepDuplicateNumber */
export function sessionSweepNextCopyNumber(suit, rank) {
  return sessionSweepDuplicateNumber(suit, rank);
}

/** True when a prior session sweep or Switcher convert already recorded this suit:rank. */
export function isSessionSweepDuplicateIdentity(suit, rank) {
  return sessionSweepPriorCount(suit, rank) >= 1;
}

/** Switcher Jokers: joker identity tallied on convert (missing inner suit). */
export function isSwitcherStackSweepDuplicate(values) {
  const missing = missingInnerDieFromTricolor(values);
  if (missing == null) return false;
  return isSessionSweepDuplicateIdentity(suitFromValue(missing), JOKER_RANK);
}

/** 3-dice stack would convert to a session-duplicated tile (Switcher or standard convert). */
export function isStackConvertSweepDuplicate(values) {
  return stackConvertSweepDuplicateNumber(values) > 0;
}

/** Duplicate index if this 3-dice stack converts (1 = first duplicate, …); 0 = first copy. */
export function stackConvertSweepDuplicateNumber(values) {
  if (values.length !== 3) return 0;
  if (isSwitcherTricolorStack(values)) {
    const missing = missingInnerDieFromTricolor(values);
    if (missing == null) return 0;
    return sessionSweepDuplicateNumber(suitFromValue(missing), JOKER_RANK);
  }
  const tile = tileIdentityFromStackValues(values, {
    tricolors: settings.tricolors,
    tricolorSevens: settings.tricolorSevens,
  });
  return sessionSweepDuplicateNumber(tile.suit, tile.rank);
}

/** @deprecated alias — use stackConvertSweepDuplicateNumber */
export function stackConvertSweepNextCopyNumber(values) {
  return stackConvertSweepDuplicateNumber(values);
}
