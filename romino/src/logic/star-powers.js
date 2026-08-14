import { state } from './state.js';
import { settings } from './settings.js';
import { isOuterDieValue } from './dice.js';

/** Logic-only — never import `row.js` (row imports this module). */
export function starPowersEnabled() {
  return settings.starPowers;
}

export function buggerSinglesEnabled() {
  return pushBelowEnabled() && settings.buggerSingles;
}

export function pushBelowStarCost() {
  return settings.pushBelowCost > 0 ? settings.pushBelowCost : 0;
}

export function pushBelowEnabled() {
  return starPowersEnabled() && pushBelowStarCost() > 0;
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
  if (die == null) return false;
  const value = die.value;
  if (isInnerTrayFlipValue(value)) return true;
  if (isOuterDieValue(value)) return !settings.rerollOuter;
  return false;
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
  if (!pushBelowEnabled()) return false;
  const column = state.row[col] ?? null;
  if (!column || column.kind !== 'stack') return false;
  const n = column.dice.length;
  if (n !== 1 && n !== 2) return false;
  const pair = stackTopBottomValues(column);
  if (!pair) return false;
  if (n === 1) {
    if (!isLoneBuggerOuterCol(col)) return false;
    return passesBuggerPendingPush(pair.bottom, pushValue);
  }
  if (isAllOuterStack(column)) {
    return isPushBelowTrayValue(pushValue);
  }
  return passesPushBelowMatch(pair.top, pair.bottom, pushValue);
}

export function canPushBelowAtCol(col, pushValue) {
  const cost = pushBelowStarCost();
  return passesPushBelowAtCol(col, pushValue) && state.stars >= cost && state.phase === 'rolled';
}

/** Toggle flip tracking — odd flips leave the die flagged for refund on return. */
export function recordFlip(dieId) {
  if (state.flippedDieIds.has(dieId)) state.flippedDieIds.delete(dieId);
  else state.flippedDieIds.add(dieId);
}

export function isFlippedDie(dieId) {
  return state.flippedDieIds.has(dieId);
}

export function clearFlippedDie(dieId) {
  state.flippedDieIds.delete(dieId);
}

export function markSwapStackCol(col) {
  if (starPowersEnabled()) state.swapStackCols.add(col);
}

export function clearSwapStackCol(col) {
  state.swapStackCols.delete(col);
}

export function isSwapPaidCol(col) {
  return state.swapStackCols.has(col);
}

export function isSwapRefundableDie(dieId) {
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind !== 'stack' || !column.dice.includes(dieId)) continue;
    return isSwapPaidCol(Number(colKey));
  }
  return false;
}

export function canRefundSwapStack(col) {
  if (!isSwapPaidCol(col) || state.phase !== 'rolled') return false;
  const column = state.row[col] ?? null;
  return column?.kind === 'stack' && column.dice.length === 2;
}

/** Swap needs two different inner faces — an outer 1/6 or a matching pair locks the stack. */
export function canStarSwapStack(col) {
  if (!canSpendStarPower()) return false;
  if (isSwapPaidCol(col)) return false;
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

/** Lone 1/6 column awaiting push-below — derived from row shape, not the pending Set alone. */
export function isLoneBuggerOuterCol(col) {
  if (!buggerSinglesEnabled()) return false;
  const column = state.row[col] ?? null;
  if (column?.kind !== 'stack' || column.dice.length !== 1) return false;
  return isBuggerOuterValue(state.dice[column.dice[0]]?.value);
}

export function isBuggerPendingCol(col) {
  return isLoneBuggerOuterCol(col);
}

/** Stack column where every die is outer (1 or 6). */
export function isAllOuterStack(column) {
  if (!column || column.kind !== 'stack' || !column.dice.length) return false;
  return column.dice.every(id => isBuggerOuterValue(state.dice[id]?.value));
}

export function markBuggerOuterStackLockedCol(col) {
  if (buggerSinglesEnabled()) state.buggerOuterStackLockedCols.add(col);
}

export function clearBuggerOuterStackLockedCol(col) {
  state.buggerOuterStackLockedCols.delete(col);
}

export function isBuggerOuterStackLockedCol(col) {
  return state.buggerOuterStackLockedCols.has(col);
}

/** After stack mutations — lock 2+ all-outer stacks; clear when height drops below 2. */
export function syncBuggerOuterStackLock(col) {
  if (!buggerSinglesEnabled()) {
    clearBuggerOuterStackLockedCol(col);
    return;
  }
  const column = state.row[col] ?? null;
  if (!column || column.kind !== 'stack') {
    clearBuggerOuterStackLockedCol(col);
    return;
  }
  if (column.dice.length < 2) {
    clearBuggerOuterStackLockedCol(col);
    return;
  }
  if (isAllOuterStack(column)) {
    markBuggerOuterStackLockedCol(col);
  }
}

/** Tray die eligible for star-pay reroll (outer 1/6) — takes priority over flip. */
export function isStarRerollTrayDie(dieId) {
  if (!state.actionBar.includes(dieId)) return false;
  const die = state.dice[dieId];
  return die != null && isOuterDieValue(die.value);
}

export function addPushReminderCol(col) {
  if (starPowersEnabled()) state.pushReminderCols.add(col);
}

export function addSwapReminderCol(col) {
  if (starPowersEnabled()) state.swapReminderCols.add(col);
}

export function clearPushReminderCol(col) {
  state.pushReminderCols.delete(col);
}

export function clearSwapReminderCol(col) {
  state.swapReminderCols.delete(col);
}

/** Swap ⭐ sits between the two swapped dice — row 1 only when a push die sits below them. */
function swapReminderRow(column) {
  if (!column?.dice || column.dice.length < 2) return null;
  const pushBelow = state.pushBelowDieIds.has(column.dice[0]);
  return pushBelow && column.dice.length >= 3 ? 1 : 0;
}

/** Vertical gap markers for star-paid push/swap — UI only, until confirm. */
export function getStarPowerCostReminderMatches() {
  const matches = [];
  for (const col of state.pushReminderCols) {
    const column = state.row[col] ?? null;
    if (column?.kind === 'stack' && column.dice.length >= 2) {
      matches.push({ axis: 'v', col, row: 0, costReminder: true });
    }
  }
  for (const col of state.swapReminderCols) {
    const column = state.row[col] ?? null;
    if (column?.kind !== 'stack') continue;
    const row = swapReminderRow(column);
    if (row == null) continue;
    matches.push({ axis: 'v', col, row, costReminder: true });
  }
  return matches;
}
