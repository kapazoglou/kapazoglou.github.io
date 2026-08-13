import { state } from './state.js';
import { settings } from './settings.js';
import { SWEPT_SUIT_ORDER } from './dice-visual.js';

/** Game ends when any suit tally exceeds this value (i.e. reaches 13). */
export const SWEPT_SUIT_CAP = 12;

export const SWEPT_SUIT_CAP_REASON = 'suit tally complete';

export function tallySuit(suit) {
  if (!suit || state.suitTally[suit] == null) return;
  state.suitTally[suit]++;
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

/** End bonus: 10 points × lowest suit tally (applied at suit-cap game over). */
export function applySweptSuitsEndBonus() {
  const bonus = lowestSuitTallyCount() * 10;
  if (bonus > 0) state.points += bonus;
  return bonus;
}
