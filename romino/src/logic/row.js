import { state } from './state.js';
import { settings } from './settings.js';
import { isDominoPairLocked, dominoHandDicePlaceQuota, isDominoHandMode } from './domino-roll.js';
import {
  onTrayDiePlaced,
  onColumnVacated,
  onSpotColReposition,
  shiftDominoSpotCols,
  getDominoKeyForCol,
  ensureDominoSpotForCol,
  isDominoSpotsActive,
  maybeRebindDominoSpotToUsed,
  syncDominoSpotInvariants,
} from './domino-spots.js';
import { recordStarSpent } from './game-log.js';
import { JOKER_RANK, isInnerDie, isSwitcherTricolorStack, tileIdentityFromStackValues, tileIdentityRequiresStar } from './dice-visual.js';
import { flankStackTop } from './deck-flank.js';
import { identityBlockedByStripOrRow } from './dealt-strip.js';
import { isCubeLockedForIdentity, getCubeLockColForBlockedAttempt } from './nine-cubes.js';
import { monotonicEnabled, monotonicRankAllowed, monotonicBoundaryColsForCol } from './monotonic.js';
import {
  buggerSinglesEnabled,
  clearBuggerPendingCol,
  clearBuggerOuterStackLockedCol,
  clearPushReminderCol,
  clearSwapReminderCol,
  addSwapReminderCol,
  clearFlippedDie,
  isAllOuterStack,
  isBuggerOuterValue,
  isBuggerPendingCol,
  isSwapPaidCol,
  isSwapRefundableDie,
  isFlippedDie,
  markBuggerPendingCol,
  oppositeDieValue,
  canPushBelowAtCol,
  passesPushBelowAtCol,
  pushBelowEnabled,
  pushBelowStarCost,
  syncBuggerOuterStackLock,
} from './star-powers.js';

function tricolorJokersEnabled() {
  return settings.tricolors || settings.tricolorSevens;
}

function jokerTileOptions() {
  return {
    tricolors: settings.tricolors,
    tricolorSevens: settings.tricolorSevens,
  };
}

function jokerSuitFromStackValues(v0, v1, v2) {
  const { rank, suit } = tileIdentityFromStackValues([v0, v1, v2], jokerTileOptions());
  return rank === JOKER_RANK ? suit : null;
}

function stackValuesRequireStar(values) {
  if (!settings.aceJokerStarCost) return false;
  if (isSwitcherTricolorStack(values)) return true;
  const tile = tileIdentityFromStackValues(values, jokerTileOptions());
  return tileIdentityRequiresStar(tile);
}

function twoInnerDiceCanBecomeTricolorJoker(v0, v1) {
  if (!tricolorJokersEnabled()) return false;
  if (!isInnerDie(v0) || !isInnerDie(v1) || v0 === v1) return false;
  if (settings.tricolorSevens) {
    const third = 7 - v1;
    return isInnerDie(third) && third !== v0;
  }
  return settings.tricolors;
}

/** At most one committed joker (tile or full tricolor stack) on the row at a time. */
function rowHasJoker(excludeCol = null) {
  if (!settings.tricolorRestriction) return false;
  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (col === excludeCol) continue;

    if (column.kind === 'tile' && column.rank === JOKER_RANK) return true;

    if (column.kind !== 'stack') continue;
    const values = column.dice.map(id => state.dice[id].value);
    if (values.length !== 3) continue;
    const suit = jokerSuitFromStackValues(...values);
    if (suit != null && !state.jokerSuitsUsed.has(suit)) return true;
  }
  return false;
}

/** Another stack already committed or building toward a joker of this suit. */
function jokerSuitBlocked(suit, excludeCol = null) {
  if (!settings.tricolorRestriction) return false;
  if (state.jokerSuitsUsed.has(suit)) return true;

  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (col === excludeCol) continue;

    if (column.kind === 'tile' && column.rank === JOKER_RANK && column.suit === suit) {
      return true;
    }

    if (column.kind !== 'stack') continue;
    const n = column.dice.length;
    if (n !== 2 && n !== 3) continue;

    const values = column.dice.map(id => state.dice[id].value);
    if (n === 3) {
      const s = jokerSuitFromStackValues(...values);
      if (s === suit) return true;
      continue;
    }

    const [v0, v1] = values;
    if (!twoInnerDiceCanBecomeTricolorJoker(v0, v1)) continue;
    for (let third = 2; third <= 5; third++) {
      if (third === v0 || third === v1) continue;
      if (settings.tricolorSevens && v1 + third !== 7) continue;
      if (jokerSuitFromStackValues(v0, v1, third) === suit) return true;
    }
  }

  return false;
}

export function getOccupiedCols() {
  return Object.keys(state.row).map(Number).sort((a, b) => a - b);
}

export function isRowEmpty() {
  return getOccupiedCols().length === 0;
}

export function getColumn(col) {
  return state.row[col] ?? null;
}

export function stackHeight(col) {
  const c = getColumn(col);
  if (!c || c.kind === 'tile') return c ? 1 : 0;
  return c.dice.length;
}

export function dieValueAt(col, row) {
  const c = getColumn(col);
  if (!c) return null;
  if (c.kind === 'tile') return row === 0 ? c.bottomValue : null;
  const id = c.dice[row];
  return id != null ? state.dice[id]?.value ?? null : null;
}

/** Stack die id at row index; tiles have no die ids. */
export function dieIdAt(col, row) {
  const c = getColumn(col);
  if (!c || c.kind === 'tile') return null;
  return c.dice[row] ?? null;
}

function colIsEmpty(col) {
  return !state.row[col];
}

/** Column index 0 = horizontal center of the placement row (Figma). */
export const CENTER_COL = 0;

export function canPlaceMoreThisTurn() {
  return state.placedThisTurn < dominoHandDicePlaceQuota();
}

/** Tray die inactive when per-turn N-place quota is filled or domino quad pair is locked. */
export function isBarDieInactive(dieId) {
  const quota = dominoHandDicePlaceQuota();
  return state.actionBar.includes(dieId)
    && (state.placedThisTurn >= quota || isDominoPairLocked(dieId));
}

function canPlaceMoreDiceFromBar() {
  return state.placedThisTurn < dominoHandDicePlaceQuota();
}

function passesOneToOneNewColumn(value) {
  if (!settings.oneToOne) return true;
  if (buggerSinglesEnabled() && isBuggerOuterValue(value)) return true;
  return value >= 2 && value <= 5;
}

function isOneSixPair(a, b) {
  return (a === 1 && b === 6) || (a === 6 && b === 1);
}

function passesTricolorThirdDie(first, second, third, excludeCol = null) {
  if (!tricolorJokersEnabled()) return false;
  if (!isInnerDie(first) || !isInnerDie(second) || !isInnerDie(third)) return false;
  if (first === second || first === third || second === third) return false;
  if (settings.tricolorSevens && second + third !== 7) return false;
  if (settings.switcherJokers && settings.tricolors && !settings.tricolorSevens) return true;
  if (rowHasJoker(excludeCol)) return false;
  const suit = jokerSuitFromStackValues(first, second, third);
  if (suit == null || jokerSuitBlocked(suit, excludeCol)) return false;
  return true;
}

function passesOneToOneThirdDie(first, second, third, excludeCol = null) {
  if (passesTricolorThirdDie(first, second, third, excludeCol)) return true;
  if (!settings.oneToOne) return true;
  if (isOneSixPair(second, third)) return true;
  if (second === first) return true;
  if (second < first) return third === 1;
  return third === 6;
}

function hasLeftFlankNeighbor() {
  return settings.deckFlank && !!flankStackTop('left');
}

function hasRightFlankNeighbor() {
  return settings.deckFlank && !!flankStackTop('right');
}

function gapAllowsInsert(leftCol, rightCol) {
  const left = leftCol != null ? getColumn(leftCol) : null;
  const right = rightCol != null ? getColumn(rightCol) : null;
  if (left?.kind === 'tile' && right?.kind === 'tile') return false;
  return true;
}

/** New columns may touch a tile only when the other side of the gap is a dice stack (or flank stack). */
function passesTileAdjacencyRule(leftCol, rightCol) {
  if (settings.diceAndCubes) return true;
  const leftTile = leftCol != null && getColumn(leftCol)?.kind === 'tile';
  const rightTile = rightCol != null && getColumn(rightCol)?.kind === 'tile';
  if (!leftTile && !rightTile) return true;
  const leftStack = (leftCol != null && getColumn(leftCol)?.kind === 'stack')
    || (leftCol == null && hasLeftFlankNeighbor());
  const rightStack = (rightCol != null && getColumn(rightCol)?.kind === 'stack')
    || (rightCol == null && hasRightFlankNeighbor());
  if (leftTile && !rightStack) return false;
  if (rightTile && !leftStack) return false;
  return true;
}

/** Bottom die value in a column (stack index 0, or tile bottomValue). */
function columnBottomValue(col, excludeDieId = null) {
  const column = getColumn(col);
  if (!column) return null;
  if (column.kind === 'tile') return column.bottomValue;
  const ids = excludeDieId ? column.dice.filter(id => id !== excludeDieId) : column.dice;
  if (!ids.length) return null;
  return state.dice[ids[0]]?.value ?? null;
}

function rowHasTile(suit, rank, excludeCol = null) {
  for (const [colKey, column] of Object.entries(state.row)) {
    const col = Number(colKey);
    if (col === excludeCol) continue;
    if (column.kind === 'tile' && column.suit === suit && column.rank === rank) return true;
  }
  return false;
}

/** Ace/joker stacks already on the row that will cost a star on convert. */
function countStarCostConvertsOnRow(excludeCol = null) {
  let count = 0;
  for (const col of getOccupiedCols()) {
    if (col === excludeCol) continue;
    const column = getColumn(col);
    if (column?.kind !== 'stack' || column.dice.length !== 3) continue;
    const values = column.dice.map(id => state.dice[id].value);
    if (stackValuesRequireStar(values)) count++;
  }
  return count;
}

function passesStarCostForStackCompletion(bottomValue, midValue, topValue, col) {
  const values = [bottomValue, midValue, topValue];
  if (!stackValuesRequireStar(values)) return true;
  const needed = countStarCostConvertsOnRow(col) + 1;
  return state.stars >= needed;
}

function diceTripleKey(bottomValue, midValue, topValue) {
  return [bottomValue, midValue, topValue].sort((a, b) => a - b).join(',');
}

/** Another column already has the same three dice in any order (convert-ready stacks only). */
function rowHasMatchingThreeDiceStack(bottomValue, midValue, topValue, excludeCol = null) {
  const targetKey = diceTripleKey(bottomValue, midValue, topValue);
  for (const col of getOccupiedCols()) {
    if (col === excludeCol) continue;
    const column = getColumn(col);
    if (column?.kind !== 'stack' || column.dice.length !== 3) continue;
    const existing = column.dice.map(id => state.dice[id].value);
    if (diceTripleKey(existing[0], existing[1], existing[2]) === targetKey) return true;
  }
  return false;
}

/** Another convert-ready stack would produce the same tile identity. */
function rowHasMatchingConvertIdentity(suit, rank, excludeCol = null) {
  for (const col of getOccupiedCols()) {
    if (col === excludeCol) continue;
    const column = getColumn(col);
    if (column?.kind !== 'stack' || column.dice.length !== 3) continue;
    const values = column.dice.map(id => state.dice[id].value);
    const identity = tileIdentityFromStackValues(values, jokerTileOptions());
    if (identity.suit === suit && identity.rank === rank) return true;
  }
  return false;
}

function passesMonotonicTile(bottomValue, midValue, topValue, col) {
  if (!monotonicEnabled()) return true;
  const values = [bottomValue, midValue, topValue];
  if (isSwitcherTricolorStack(values)) return true;
  const { rank, rankSum } = tileIdentityFromStackValues(values, jokerTileOptions());
  if (rank === JOKER_RANK) return true;
  return monotonicRankAllowed(col, rankSum);
}

/** Block completing a stack whose convert result duplicates an existing tile or another full stack. */
function passesNoDuplicateTile(bottomValue, midValue, topValue, excludeCol = null) {
  const values = [bottomValue, midValue, topValue];
  if (rowHasMatchingThreeDiceStack(bottomValue, midValue, topValue, excludeCol)) return false;
  if (isSwitcherTricolorStack(values)) return true;
  const { suit, rank } = tileIdentityFromStackValues(values, jokerTileOptions());
  if (rank === JOKER_RANK && settings.tricolorRestriction) {
    if (rowHasJoker(excludeCol) || jokerSuitBlocked(suit, excludeCol)) return false;
  }
  if (identityBlockedByStripOrRow(suit, rank, excludeCol)) return false;
  if (rowHasMatchingConvertIdentity(suit, rank, excludeCol)) return false;
  if (rowHasTile(suit, rank, excludeCol)) return false;
  if (settings.nineCubes > 0 && isCubeLockedForIdentity(suit, rank, excludeCol)) return false;
  if (!passesMonotonicTile(bottomValue, midValue, topValue, excludeCol)) return false;
  return true;
}

function passesSuitRestriction(leftCol, rightCol, value, excludeDieId = null) {
  if (!settings.suitRestriction) return true;
  if (leftCol != null) {
    const leftValue = columnBottomValue(leftCol, excludeDieId);
    if (leftValue != null && leftValue === value) return false;
  }
  if (rightCol != null) {
    const rightValue = columnBottomValue(rightCol, excludeDieId);
    if (rightValue != null && rightValue === value) return false;
  }
  return true;
}

/** Lone die value in a column, optionally ignoring a die being repositioned. */
function loneDieValueInColumn(column, excludeDieId = null) {
  if (column?.kind !== 'stack') return null;
  const remaining = excludeDieId
    ? column.dice.filter(id => id !== excludeDieId)
    : column.dice;
  if (remaining.length !== 1) return null;
  return state.dice[remaining[0]]?.value ?? null;
}

/** True when a lone-die stack shows this value (nextMustFollow blocks new columns). */
function hasLoneDieWithValue(value, excludeDieId = null) {
  if (!settings.nextMustFollow) return false;
  for (const col of getOccupiedCols()) {
    if (loneDieValueInColumn(getColumn(col), excludeDieId) === value) return true;
  }
  return false;
}

function passesNextMustFollowNewColumn(value, excludeDieId = null) {
  return !hasLoneDieWithValue(value, excludeDieId);
}

function shiftColumnsFrom(fromCol, delta) {
  shiftDominoSpotCols(fromCol, delta);
  if (delta) {
    const remappedPending = new Set();
    for (const col of state.buggerPendingCols) {
      remappedPending.add(col >= fromCol ? col + delta : col);
    }
    state.buggerPendingCols = remappedPending;
    const remappedLocked = new Set();
    for (const col of state.buggerOuterStackLockedCols) {
      remappedLocked.add(col >= fromCol ? col + delta : col);
    }
    state.buggerOuterStackLockedCols = remappedLocked;
  }
  for (const k of Object.keys(state.row).map(Number).filter(c => c >= fromCol).sort((a, b) => b - a)) {
    state.row[k + delta] = state.row[k];
    delete state.row[k];
  }
}

/** Column index for a die inserted in the gap between leftCol and rightCol (null = row edge). */
export function resolveInsertCol(leftCol, rightCol) {
  if (leftCol == null) return rightCol - 1;
  if (rightCol == null) return leftCol + 1;
  const target = leftCol + 1;
  if (target >= rightCol) {
    shiftColumnsFrom(rightCol, 1);
    return rightCol;
  }
  return target;
}

function canInsertAt(leftCol, rightCol, value, excludeDieId = null) {
  if (!gapAllowsInsert(leftCol, rightCol)) return false;
  if (!passesTileAdjacencyRule(leftCol, rightCol)) return false;
  if (!passesOneToOneNewColumn(value)) return false;
  if (!passesNextMustFollowNewColumn(value, excludeDieId)) return false;
  return passesSuitRestriction(leftCol, rightCol, value, excludeDieId);
}

export function slotFromHintDataset(ds) {
  if (ds.kind === 'insert') {
    return {
      kind: 'insert',
      leftCol: ds.leftCol === '' ? null : Number(ds.leftCol),
      rightCol: ds.rightCol === '' ? null : Number(ds.rightCol),
    };
  }
  return { col: Number(ds.col), kind: ds.kind };
}

export function countTilesInRow() {
  return Object.values(state.row).filter(column => column.kind === 'tile').length;
}

/** Occupied columns on the row — dice stacks and tiles (flank stacks are virtual, not in row). */
export function countSpotsInRow() {
  return getOccupiedCols().length;
}

export function isAtSpotCap() {
  return countSpotsInRow() >= settings.nSpots;
}

/** Gap-insert spread / fly spread phase — N-place + N-spots gate for dice. */
export function gapInsertAnimationsAllowed() {
  if (state.placedThisTurn < dominoHandDicePlaceQuota() && !isAtSpotCap()) return true;
  if (state.draggingDieId != null && state.placedDieIds.has(state.draggingDieId)) return true;
  return false;
}

export function countDiceInRow() {
  return Object.values(state.row).reduce(
    (n, column) => n + (column.kind === 'stack' ? column.dice.length : 0),
    0,
  );
}

/** Any column with a full 3-dice stack (convert-ready). */
export function rowHasThreeDiceStack() {
  return Object.values(state.row).some(
    column => column.kind === 'stack' && column.dice.length === 3,
  );
}

/** Any freshly rolled tray die with at least one valid slot? */
export function hasAnyLegalPlacementForTray() {
  for (const dieId of state.actionBar) {
    if (getValidSlotsForDie(dieId).length > 0) return true;
  }
  return false;
}

/** Active tray dice remain but none have a legal slot (confirm-ready leftovers excluded). */
export function isTrayStuck() {
  let hasActive = false;
  for (const dieId of state.actionBar) {
    if (isBarDieInactive(dieId)) continue;
    hasActive = true;
    if (getValidSlotsForDie(dieId).length > 0) return false;
  }
  return hasActive;
}

/** Slot completes a 3-dice stack whose convert identity is blocked by strip or row tile. */
export function wouldCompleteBlockedDuplicate(dieId, slot) {
  if (slot.kind !== 'stack') return false;
  const column = getColumn(slot.col);
  if (!column || column.kind !== 'stack' || column.dice.length !== 2) return false;
  const die = state.dice[dieId];
  if (!die) return false;
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  const v2 = die.value;
  if (!passesOneToOneThirdDie(v0, v1, v2, slot.col)) return false;
  if (!passesStarCostForStackCompletion(v0, v1, v2, slot.col)) return false;
  const { suit, rank } = tileIdentityFromStackValues([v0, v1, v2], jokerTileOptions());
  if (rank === JOKER_RANK && settings.tricolorRestriction) {
    if (rowHasJoker(slot.col) || jokerSuitBlocked(suit, slot.col)) return false;
  }
  if (rowHasMatchingThreeDiceStack(v0, v1, v2, slot.col)) return false;
  if (rowHasMatchingConvertIdentity(suit, rank, slot.col)) return false;
  return identityBlockedByStripOrRow(suit, rank, slot.col);
}

/** Slot completes a stack blocked by nine-cubes lock (duplicate-block takes priority). */
export function wouldCompleteBlockedCube(dieId, slot) {
  if (!settings.nineCubes) return false;
  if (wouldCompleteBlockedDuplicate(dieId, slot)) return false;
  if (slot.kind !== 'stack') return false;
  const column = getColumn(slot.col);
  if (!column || column.kind !== 'stack' || column.dice.length !== 2) return false;
  const die = state.dice[dieId];
  if (!die) return false;
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  const v2 = die.value;
  if (!passesOneToOneThirdDie(v0, v1, v2, slot.col)) return false;
  if (!passesStarCostForStackCompletion(v0, v1, v2, slot.col)) return false;
  const { suit, rank } = tileIdentityFromStackValues([v0, v1, v2], jokerTileOptions());
  if (rank === JOKER_RANK && settings.tricolorRestriction) {
    if (rowHasJoker(slot.col) || jokerSuitBlocked(suit, slot.col)) return false;
  }
  if (rowHasMatchingThreeDiceStack(v0, v1, v2, slot.col)) return false;
  if (rowHasMatchingConvertIdentity(suit, rank, slot.col)) return false;
  if (rowHasTile(suit, rank, slot.col)) return false;
  if (identityBlockedByStripOrRow(suit, rank, slot.col)) return false;
  return isCubeLockedForIdentity(suit, rank, slot.col);
}

/** Row col of the tile locking the cube for a blocked stack completion. */
export function cubeLockColForStackCompletion(dieId, slot) {
  if (!wouldCompleteBlockedCube(dieId, slot)) return null;
  const column = getColumn(slot.col);
  const die = state.dice[dieId];
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  const { suit, rank } = tileIdentityFromStackValues([v0, v1, die.value], jokerTileOptions());
  return getCubeLockColForBlockedAttempt(suit, rank, slot.col);
}

/** Slot completes a stack blocked by monotonic rank zone (duplicate/cube take priority). */
export function wouldCompleteBlockedMonotonic(dieId, slot) {
  if (!monotonicEnabled()) return false;
  if (wouldCompleteBlockedDuplicate(dieId, slot)) return false;
  if (wouldCompleteBlockedCube(dieId, slot)) return false;
  if (isStarBlockedPlacement(dieId, slot)) return false;
  if (slot.kind !== 'stack') return false;
  const column = getColumn(slot.col);
  if (!column || column.kind !== 'stack' || column.dice.length !== 2) return false;
  const die = state.dice[dieId];
  if (!die) return false;
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  const v2 = die.value;
  if (!passesOneToOneThirdDie(v0, v1, v2, slot.col)) return false;
  if (!passesStarCostForStackCompletion(v0, v1, v2, slot.col)) return false;
  const values = [v0, v1, v2];
  if (isSwitcherTricolorStack(values)) return false;
  const { suit, rank } = tileIdentityFromStackValues(values, jokerTileOptions());
  if (rank === JOKER_RANK) return false;
  if (rowHasMatchingThreeDiceStack(v0, v1, v2, slot.col)) return false;
  if (rowHasMatchingConvertIdentity(suit, rank, slot.col)) return false;
  if (rowHasTile(suit, rank, slot.col)) return false;
  if (identityBlockedByStripOrRow(suit, rank, slot.col)) return false;
  if (settings.nineCubes > 0 && isCubeLockedForIdentity(suit, rank, slot.col)) return false;
  return !passesMonotonicTile(v0, v1, v2, slot.col);
}

/** Boundary anchor cols to flash on monotonic-blocked stack completion. */
export function monotonicBoundaryColsForBlockedAttempt(_dieId, slot) {
  if (slot?.col != null) return monotonicBoundaryColsForCol(slot.col);
  return [];
}

/** Convert identity for a would-be 3-dice stack completion (for duplicate feedback). */
export function convertIdentityForStackCompletion(dieId, slot) {
  if (slot.kind !== 'stack') return null;
  const column = getColumn(slot.col);
  if (!column || column.kind !== 'stack' || column.dice.length !== 2) return null;
  const die = state.dice[dieId];
  if (!die) return null;
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  return tileIdentityFromStackValues([v0, v1, die.value], jokerTileOptions());
}

/** True when slot completes an ace/joker stack but star balance is too low. */
export function isStarBlockedPlacement(dieId, slot) {
  if (slot.kind !== 'stack') return false;
  const column = getColumn(slot.col);
  if (!column || column.kind !== 'stack' || column.dice.length !== 2) return false;
  const die = state.dice[dieId];
  if (!die) return false;
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  const v2 = die.value;
  if (!stackValuesRequireStar([v0, v1, v2])) return false;
  return !passesStarCostForStackCompletion(v0, v1, v2, slot.col);
}

export function slotsEqual(a, b) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'stack' || a.kind === 'stack-below' || a.kind === 'new-column') return a.col === b.col;
  if (a.kind === 'insert') return a.leftCol === b.leftCol && a.rightCol === b.rightCol;
  return false;
}

/** Star powers: outer bottom blocks top-stack unless Bugger Singles outer-on-outer. */
function passesOuterBottomGuard(col, placingValue = null) {
  if (!pushBelowEnabled()) return true;
  const column = getColumn(col);
  if (column?.kind !== 'stack' || !column.dice.length) return true;
  const bottomOuter = isBuggerOuterValue(state.dice[column.dice[0]].value);
  if (!bottomOuter) return true;
  if (buggerSinglesEnabled() && placingValue != null && isBuggerOuterValue(placingValue)
      && isAllOuterStack(column)) {
    return true;
  }
  return false;
}

/** Push lands at index 0, so the would-be stack reads [push, v0, v1]. */
function passesPushBelowNoDuplicate(col, value) {
  const column = getColumn(col);
  if (column?.kind !== 'stack' || column.dice.length !== 2) return true;
  const v0 = state.dice[column.dice[0]].value;
  const v1 = state.dice[column.dice[1]].value;
  return passesNoDuplicateTile(value, v0, v1, col);
}

/** Rules only — no star balance, no phase. Shared by slot listing and commit. */
function pushBelowRulesPass(col, value) {
  return passesPushBelowAtCol(col, value) && passesPushBelowNoDuplicate(col, value);
}

/** Push-below snap listing — a push die being repositioned earns a star credit (refund on leave). */
function canOfferPushBelowSlot(dieId, col, value) {
  if (!pushBelowRulesPass(col, value)) return false;
  const cost = pushBelowStarCost();
  if (!cost) return false;
  const credit = isPushBelowPlacedDie(dieId) ? cost : 0;
  return state.stars + credit >= cost;
}

function canPlaceValueAt(col, kind, value) {
  const column = getColumn(col);

  if (kind === 'new-column') {
    if (!passesOneToOneNewColumn(value)) return false;
    if (!passesNextMustFollowNewColumn(value)) return false;
    if (isRowEmpty()) return col === CENTER_COL;
    return false;
  }

  if (kind === 'stack') {
    if (!column || column.kind === 'tile') return false;
    if (isBuggerPendingCol(col) && !(buggerSinglesEnabled() && isBuggerOuterValue(value))) {
      return false;
    }
    if (column.dice.length >= 3) return false;
    if (!passesOuterBottomGuard(col, value)) return false;
    if (column.dice.length === 2) {
      const v0 = state.dice[column.dice[0]].value;
      const v1 = state.dice[column.dice[1]].value;
      if (!passesOneToOneThirdDie(v0, v1, value, col)) return false;
      if (!passesStarCostForStackCompletion(v0, v1, value, col)) return false;
      return passesNoDuplicateTile(v0, v1, value, col);
    }
    return true;
  }

  if (kind === 'stack-below') {
    return canPushBelowAtCol(col, value) && passesPushBelowNoDuplicate(col, value);
  }

  return false;
}

export function getValidSlotsForDie(dieId) {
  const die = state.dice[dieId];
  if (!die) return [];
  const fromBar = state.actionBar.includes(dieId);
  const fromRow = state.placedDieIds.has(dieId);
  if (!fromBar && !fromRow) return [];
  if (fromBar && !canPlaceMoreDiceFromBar()) return [];

  const value = die.value;
  const excludeDieId = fromBar ? null : dieId;
  let slots = [];

  if (isRowEmpty()) {
    if (canPlaceValueAt(CENTER_COL, 'new-column', value)) {
      slots.push({ col: CENTER_COL, kind: 'new-column' });
    }
    return slots;
  }

  const occupied = getOccupiedCols();
  const minCol = occupied[0];
  const maxCol = occupied[occupied.length - 1];

  const currentCol = findDieColumn(dieId)?.col;

  for (const col of occupied) {
    const column = getColumn(col);
    if (column?.kind === 'stack' && column.dice.length < 3) {
      if (col === currentCol && column.dice.includes(dieId)) continue;
      if (canPlaceValueAt(col, 'stack', value)) {
        slots.push({ col, kind: 'stack' });
      }
      if (canOfferPushBelowSlot(dieId, col, value)) {
        slots.push({ col, kind: 'stack-below' });
      }
    }
  }

  if (canInsertAt(null, minCol, value, excludeDieId)) {
    slots.push({ kind: 'insert', leftCol: null, rightCol: minCol });
  }

  for (let i = 0; i < occupied.length - 1; i++) {
    const left = occupied[i];
    const right = occupied[i + 1];
    if (canInsertAt(left, right, value, excludeDieId)) {
      slots.push({ kind: 'insert', leftCol: left, rightCol: right });
    }
  }

  if (canInsertAt(maxCol, null, value, excludeDieId)) {
    slots.push({ kind: 'insert', leftCol: maxCol, rightCol: null });
  }

  if (isAtSpotCap()) {
    slots = slots.filter(slot => slot.kind === 'stack' || slot.kind === 'stack-below');
  }

  return slots;
}

/** Top die id in a stack column (respects stackBottomUp). */
function topDieIdAtCol(col) {
  const column = getColumn(col);
  if (!column || column.kind !== 'stack' || !column.dice.length) return null;
  const { dice } = column;
  return settings.stackBottomUp ? dice[dice.length - 1] : dice[0];
}

/** Only the visually topmost stack die may leave its column (return or reposition). */
export function isTopDieInStack(dieId) {
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind !== 'stack' || !column.dice.includes(dieId)) continue;
    return topDieIdAtCol(Number(colKey)) === dieId;
  }
  return false;
}

function isBottomDieInStack(dieId) {
  for (const [, column] of Object.entries(state.row)) {
    if (column.kind !== 'stack' || !column.dice.includes(dieId)) continue;
    return column.dice[0] === dieId;
  }
  return false;
}

export { isSwapRefundableDie } from './star-powers.js';

export function isPushBelowPlacedDie(dieId) {
  return state.pushBelowDieIds.has(dieId);
}

export function canReturnDieToBar(dieId) {
  if (!state.placedDieIds.has(dieId)) return false;
  if (isPushBelowPlacedDie(dieId)) return isBottomDieInStack(dieId);
  if (isTopDieInStack(dieId)) return true;
  // A die placed this turn can also be pulled from the bottom of a 2-die stack
  // (e.g. a stack swap moved it under a settled die).
  const loc = findDieColumn(dieId);
  return !!loc && loc.column.dice.length === 2 && loc.column.dice[0] === dieId;
}

export function isReturnablePlacedDie(dieId) {
  return state.placedDieIds.has(dieId) && canReturnDieToBar(dieId);
}

/** @returns {number | false | null} vacated col, null if removed but column remains, false if die not found */
function removeDieFromRow(dieId) {
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind !== 'stack') continue;
    const idx = column.dice.indexOf(dieId);
    if (idx === -1) continue;
    column.dice.splice(idx, 1);
    const col = Number(colKey);
    if (column.dice.length === 0) {
      delete state.row[col];
      clearBuggerPendingCol(col);
      clearBuggerOuterStackLockedCol(col);
      if (isRowEmpty()) state.hasPlacedFirstDie = false;
      return col;
    }
    if (isRowEmpty()) state.hasPlacedFirstDie = false;
    return null;
  }
  return false;
}

/** Hand preview — strip preview-placed dice from row and undo spot bindings. */
export function purgePreviewPlacementsFromRow() {
  const ids = [...state.placedDieIds];
  for (const dieId of ids) {
    const loc = findDieColumn(dieId);
    const boundKey = loc ? getDominoKeyForCol(loc.col) : null;
    const sourceCol = loc?.col ?? null;

    if (isPushBelowPlacedDie(dieId)) {
      state.pushBelowDieIds.delete(dieId);
      state.stars += pushBelowStarCost();
      if (sourceCol != null) clearPushReminderCol(sourceCol);
    }

    const removeResult = removeDieFromRow(dieId);
    if (removeResult === false) continue;

    if (typeof removeResult === 'number') {
      onColumnVacated(removeResult, boundKey);
    } else if (sourceCol != null) {
      onColumnVacated(sourceCol, boundKey);
    }

    state.placedDieIds.delete(dieId);
  }
  state.placedThisTurn = 0;
}

/** Top die, or a push-below bottom die, may leave its column for reposition. */
function canRepositionPlacedDie(dieId) {
  if (isTopDieInStack(dieId)) return true;
  return isPushBelowPlacedDie(dieId) && isBottomDieInStack(dieId);
}

export function placeDie(dieId, slot) {
  const fromBar = state.actionBar.includes(dieId);
  const fromRow = state.placedDieIds.has(dieId);
  if (!fromBar && !fromRow) return false;
  if (fromBar && !canPlaceMoreDiceFromBar()) return false;

  if (slot.kind === 'stack-below') {
    const cost = pushBelowStarCost();
    if (!pushBelowRulesPass(slot.col, state.dice[dieId].value)) return false;
    // Bar push: stars debited in placement-anim before lift commit (`deductState`).
    if (fromRow) {
      const credit = isPushBelowPlacedDie(dieId) ? cost : 0;
      if (state.stars + credit < cost) return false;
    }
  } else {
    const valid = getValidSlotsForDie(dieId);
    if (!valid.some(s => slotsEqual(s, slot))) return false;
  }

  let vacatedCol = null;
  let vacatedDominoKey = null;
  if (fromBar) {
    state.actionBar = state.actionBar.filter(id => id !== dieId);
  } else {
    if (!canRepositionPlacedDie(dieId)) return false;
    const wasPushBelow = isPushBelowPlacedDie(dieId);
    const loc = findDieColumn(dieId);
    vacatedDominoKey = loc ? getDominoKeyForCol(loc.col) : null;
    const sourceCol = loc?.col ?? null;
    const removeResult = removeDieFromRow(dieId);
    if (removeResult === false) return false;
    if (wasPushBelow) {
      state.pushBelowDieIds.delete(dieId);
      state.stars += pushBelowStarCost();
      if (sourceCol != null) clearPushReminderCol(sourceCol);
    }
    if (typeof removeResult === 'number') vacatedCol = removeResult;
    else if (wasPushBelow && sourceCol != null) {
      const column = getColumn(sourceCol);
      if (column?.kind === 'stack') {
        if (column.dice.length === 1) {
          const outerVal = state.dice[column.dice[0]].value;
          if (buggerSinglesEnabled() && isBuggerOuterValue(outerVal)) {
            markBuggerPendingCol(sourceCol);
          }
        } else {
          syncBuggerOuterStackLock(sourceCol);
        }
      }
    } else if (sourceCol != null) syncBuggerOuterStackLock(sourceCol);
  }

  let targetCol;
  if (slot.kind === 'new-column') {
    state.row[slot.col] = { kind: 'stack', dice: [dieId] };
    targetCol = slot.col;
    state.hasPlacedFirstDie = true;
    if (buggerSinglesEnabled() && isBuggerOuterValue(state.dice[dieId].value)) {
      markBuggerPendingCol(targetCol);
    }
  } else if (slot.kind === 'insert') {
    targetCol = resolveInsertCol(slot.leftCol, slot.rightCol);
    state.row[targetCol] = { kind: 'stack', dice: [dieId] };
    state.hasPlacedFirstDie = true;
    if (buggerSinglesEnabled() && isBuggerOuterValue(state.dice[dieId].value)) {
      markBuggerPendingCol(targetCol);
    }
  } else if (slot.kind === 'stack-below') {
    targetCol = slot.col;
    const column = state.row[slot.col];
    column.dice.unshift(dieId);
    clearBuggerPendingCol(targetCol);
    clearBuggerOuterStackLockedCol(targetCol);
    if (!fromBar) {
      state.stars -= pushBelowStarCost();
      recordStarSpent('push-below');
    }
    state.pushBelowDieIds.add(dieId);
  } else {
    targetCol = slot.col;
    const column = state.row[slot.col];
    column.dice.push(dieId);
    if (isBuggerPendingCol(targetCol) && buggerSinglesEnabled()
        && isBuggerOuterValue(state.dice[dieId].value)) {
      clearBuggerPendingCol(targetCol);
    }
    syncBuggerOuterStackLock(targetCol);
  }

  if (fromBar) {
    state.placedThisTurn++;
    state.placedDieIds.add(dieId);
    onTrayDiePlaced(dieId, targetCol);
  } else if (state.placedDieIds.has(dieId)) {
    if (vacatedCol != null) {
      onSpotColReposition(vacatedCol, targetCol, dieId, vacatedDominoKey);
    } else if (!state.dominoSpotCols.includes(targetCol)) {
      onTrayDiePlaced(dieId, targetCol);
    }
  }

  if (slot.kind === 'stack' || slot.kind === 'stack-below') {
    maybeRebindDominoSpotToUsed(targetCol, dieId);
  }

  if (state.dominoSpotCols.includes(targetCol)) getDominoKeyForCol(targetCol);

  if (isDominoSpotsActive() && state.row[targetCol] && !ensureDominoSpotForCol(targetCol)) {
    return 'domino-exhausted';
  }

  if (isDominoSpotsActive()) syncDominoSpotInvariants();

  state.selectedDieId = null;
  return true;
}

/** Star-power refund due when returning a placed die — call before `returnDieToBar`. */
export function peekStarPowerReturnRefund(dieId) {
  const loc = findDieColumn(dieId);
  const col = loc?.col ?? null;
  if (col == null) return null;

  let count = 0;
  let fromRow = null;
  if (isPushBelowPlacedDie(dieId)) {
    count += pushBelowStarCost();
    fromRow = 0;
  }
  if (isFlippedDie(dieId)) count += 1;

  if (count <= 0) return null;
  return { col, count, fromRow };
}

/** Push-below credit on leave — call before reposition `placeDie`. */
export function peekStarPowerRepositionRefund(dieId) {
  if (!isPushBelowPlacedDie(dieId)) return null;
  const loc = findDieColumn(dieId);
  if (!loc) return null;
  const count = pushBelowStarCost();
  if (count <= 0) return null;
  return { col: loc.col, count };
}

export function returnDieToBar(dieId, keepSelected = false) {
  if (!canReturnDieToBar(dieId)) return false;

  const pushBelow = isPushBelowPlacedDie(dieId);
  const loc = findDieColumn(dieId);
  const boundKey = loc ? getDominoKeyForCol(loc.col) : null;
  const col = loc?.col ?? null;

  if (pushBelow) {
    state.pushBelowDieIds.delete(dieId);
    state.stars += pushBelowStarCost();
    if (col != null) {
      clearPushReminderCol(col);
      if (isSwapPaidCol(col)) addSwapReminderCol(col);
    }
  }

  const removeResult = removeDieFromRow(dieId);
  if (removeResult === false) {
    if (pushBelow) {
      state.pushBelowDieIds.add(dieId);
      state.stars -= pushBelowStarCost();
    }
    return false;
  }
  if (typeof removeResult === 'number') onColumnVacated(removeResult, boundKey);

  if (pushBelow && col != null) {
    const column = getColumn(col);
    if (column?.kind === 'stack') {
      if (column.dice.length === 1) {
        const outerVal = state.dice[column.dice[0]].value;
        if (buggerSinglesEnabled() && isBuggerOuterValue(outerVal)) {
          markBuggerPendingCol(col);
        }
      } else {
        syncBuggerOuterStackLock(col);
      }
    }
  } else if (col != null) {
    syncBuggerOuterStackLock(col);
  }

  if (isFlippedDie(dieId)) {
    state.stars += 1;
    const die = state.dice[dieId];
    if (die) die.value = oppositeDieValue(die.value);
    clearFlippedDie(dieId);
  }

  state.actionBar.push(dieId);
  state.placedThisTurn--;
  state.placedDieIds.delete(dieId);
  if (!keepSelected) state.selectedDieId = null;
  return true;
}

export function isPlacedThisTurn(dieId) {
  return state.placedDieIds.has(dieId);
}

export function findDieColumn(dieId) {
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind === 'stack' && column.dice.includes(dieId)) {
      return { col: Number(colKey), column };
    }
  }
  return null;
}

/** Sole-die column being repositioned vanishes on commit — remap insert slot as if it is already gone. */
function remapInsertSlotAfterColRemoval(slot, removedCol) {
  if (slot.kind !== 'insert') return slot;

  const remaining = getOccupiedCols().filter(c => c !== removedCol);
  let { leftCol, rightCol } = slot;

  if (leftCol === removedCol) {
    const idx = remaining.indexOf(rightCol);
    leftCol = idx > 0 ? remaining[idx - 1] : null;
  }

  if (rightCol === removedCol) {
    const idx = remaining.indexOf(leftCol);
    rightCol = idx >= 0 && idx < remaining.length - 1 ? remaining[idx + 1] : null;
  }

  return { kind: 'insert', leftCol, rightCol };
}

/** Spread + snap anchor context while dragging a row die (sole-source column excluded). */
export function spreadContextForDie(slot, dieId = null) {
  const occupiedFull = getOccupiedCols();
  if (!dieId || state.actionBar.includes(dieId)) {
    return { slot, occupied: occupiedFull, excludeCols: new Set() };
  }

  const loc = findDieColumn(dieId);
  if (!loc) return { slot, occupied: occupiedFull, excludeCols: new Set() };

  const column = getColumn(loc.col);
  const soleSource = column?.kind === 'stack' && column.dice.length === 1;
  if (!soleSource) {
    return { slot, occupied: occupiedFull, excludeCols: new Set() };
  }

  const removedCol = loc.col;
  return {
    slot: slot.kind === 'insert' ? remapInsertSlotAfterColRemoval(slot, removedCol) : slot,
    occupied: occupiedFull.filter(c => c !== removedCol),
    excludeCols: new Set([removedCol]),
  };
}
