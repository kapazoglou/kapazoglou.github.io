import { state } from './state.js';
import { settings } from './settings.js';
import { isOuterDieValue } from './dice.js';

/** Logic-only — never import `row.js` (row imports this module). */
export function starPowersEnabled() {
  return settings.starPowers;
}

export function buggerSinglesEnabled() {
  return settings.starPowers && settings.buggerSingles;
}

/** Opposite face on a standard die (1↔6, 2↔5, 3↔4). */
export function oppositeDieValue(value) {
  return 7 - value;
}

export function isInnerTrayFlipValue(value) {
  return value >= 2 && value <= 5;
}

/** Tray die may push from below — inner faces only (2–5). */
export function isPushBelowTrayValue(value) {
  return value >= 2 && value <= 5;
}

export function canSpendStarPower() {
  return starPowersEnabled() && state.phase === 'rolled' && state.stars > 0;
}

export function canStarFlipTrayDie(dieId) {
  if (!canSpendStarPower()) return false;
  if (!state.actionBar.includes(dieId)) return false;
  const die = state.dice[dieId];
  return die != null && isInnerTrayFlipValue(die.value);
}

/** Stack index 0 = bottom, last index = top (canonical row order). */
export function stackTopBottomValues(column) {
  if (!column || column.kind !== 'stack' || !column.dice.length) return null;
  const values = column.dice.map(id => state.dice[id].value);
  return { top: values[values.length - 1], bottom: values[0] };
}

export function passesPushBelowMatch(topValue, bottomValue, pushValue) {
  if (!isPushBelowTrayValue(pushValue)) return false;
  if (topValue === bottomValue) return false;
  if (topValue === 6) return pushValue <= bottomValue;
  if (topValue === 1) return pushValue >= bottomValue;
  return pushValue === bottomValue;
}

/** Lone bugger 1/6 awaiting inner push — outer on top, any inner 2–5 slides under. */
function passesBuggerPendingPush(bottomValue, pushValue) {
  if (!isPushBelowTrayValue(pushValue)) return false;
  if (bottomValue === 6) return pushValue <= 6;
  if (bottomValue === 1) return pushValue >= 1;
  return false;
}

/** Match rules only — for snap ghosts / highlights (no star balance). */
export function passesPushBelowAtCol(col, pushValue) {
  if (!starPowersEnabled()) return false;
  const column = state.row[col] ?? null;
  if (!column || column.kind !== 'stack') return false;
  const n = column.dice.length;
  if (n !== 1 && n !== 2) return false;
  const pair = stackTopBottomValues(column);
  if (!pair) return false;
  if (n === 1) {
    if (!state.buggerPendingCols.has(col)) return false;
    return passesBuggerPendingPush(pair.bottom, pushValue);
  }
  return passesPushBelowMatch(pair.top, pair.bottom, pushValue);
}

export function canPushBelowAtCol(col, pushValue) {
  return passesPushBelowAtCol(col, pushValue) && state.stars > 0 && state.phase === 'rolled';
}

/** Swap needs two different inner faces — an outer 1/6 or a matching pair locks the stack. */
export function canStarSwapStack(col) {
  if (!canSpendStarPower()) return false;
  const column = state.row[col] ?? null;
  if (column?.kind !== 'stack' || column.dice.length !== 2) return false;
  const pair = stackTopBottomValues(column);
  if (!pair || pair.top === pair.bottom) return false;
  return !isOuterDieValue(pair.top) && !isOuterDieValue(pair.bottom);
}

export function swapStackDice(col) {
  const column = state.row[col] ?? null;
  if (!column || column.kind !== 'stack' || column.dice.length !== 2) return false;
  column.dice.reverse();
  return true;
}

export function isBuggerOuterValue(value) {
  return value === 1 || value === 6;
}

export function markBuggerPendingCol(col) {
  if (buggerSinglesEnabled()) state.buggerPendingCols.add(col);
}

export function clearBuggerPendingCol(col) {
  state.buggerPendingCols.delete(col);
}

export function isBuggerPendingCol(col) {
  return state.buggerPendingCols.has(col);
}

/** Tray die eligible for star-pay reroll (outer 1/6) — takes priority over flip. */
export function isStarRerollTrayDie(dieId) {
  if (!state.actionBar.includes(dieId)) return false;
  const die = state.dice[dieId];
  return die != null && isOuterDieValue(die.value);
}
