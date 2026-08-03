import { state } from './state.js';
import { settings } from './settings.js';
import { isDominoPairLocked } from './domino-roll.js';
import { onTrayDiePlaced, onColumnVacated, onSpotColReposition } from './domino-spots.js';
import { JOKER_RANK, isInnerDie, tileIdentityFromStackValues, tileIdentityRequiresStar } from './dice-visual.js';
import { flankStackTop } from './deck-flank.js';
import { identityBlockedByStripOrRow } from './dealt-strip.js';

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
  return state.placedThisTurn < settings.nPlace;
}

/** Tray die inactive when per-turn N-place quota is filled or domino quad pair is locked. */
export function isBarDieInactive(dieId) {
  return state.actionBar.includes(dieId)
    && (state.placedThisTurn >= settings.nPlace || isDominoPairLocked(dieId));
}

function canPlaceMoreDiceFromBar() {
  return state.placedThisTurn < settings.nPlace;
}

function passesOneToOneNewColumn(value) {
  if (!settings.oneToOne) return true;
  return value >= 2 && value <= 5;
}

function isOneSixPair(a, b) {
  return (a === 1 && b === 6) || (a === 6 && b === 1);
}

function passesTricolorThirdDie(first, second, third, excludeCol = null) {
  if (!tricolorJokersEnabled()) return false;
  if (rowHasJoker(excludeCol)) return false;
  if (!isInnerDie(first) || !isInnerDie(second) || !isInnerDie(third)) return false;
  if (first === second || first === third || second === third) return false;
  if (settings.tricolorSevens && second + third !== 7) return false;
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

/** Block completing a stack whose convert result duplicates an existing tile or another full stack. */
function passesNoDuplicateTile(bottomValue, midValue, topValue, excludeCol = null) {
  const values = [bottomValue, midValue, topValue];
  if (rowHasMatchingThreeDiceStack(bottomValue, midValue, topValue, excludeCol)) return false;
  const { suit, rank } = tileIdentityFromStackValues(values, jokerTileOptions());
  if (rank === JOKER_RANK && settings.tricolorRestriction) {
    if (rowHasJoker(excludeCol) || jokerSuitBlocked(suit, excludeCol)) return false;
  }
  if (identityBlockedByStripOrRow(suit, rank, excludeCol)) return false;
  if (rowHasMatchingConvertIdentity(suit, rank, excludeCol)) return false;
  return !rowHasTile(suit, rank, excludeCol);
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

function shiftColumnsFrom(fromCol, delta) {
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
  if (state.placedThisTurn < settings.nPlace && !isAtSpotCap()) return true;
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
  if (a.kind === 'stack' || a.kind === 'new-column') return a.col === b.col;
  if (a.kind === 'insert') return a.leftCol === b.leftCol && a.rightCol === b.rightCol;
  return false;
}

function canPlaceValueAt(col, kind, value) {
  const column = getColumn(col);

  if (kind === 'new-column') {
    if (!passesOneToOneNewColumn(value)) return false;
    if (isRowEmpty()) return col === CENTER_COL;
    return false;
  }

  if (kind === 'stack') {
    if (!column || column.kind === 'tile') return false;
    if (column.dice.length >= 3) return false;
    if (column.dice.length === 2) {
      const v0 = state.dice[column.dice[0]].value;
      const v1 = state.dice[column.dice[1]].value;
      if (!passesOneToOneThirdDie(v0, v1, value, col)) return false;
      if (!passesStarCostForStackCompletion(v0, v1, value, col)) return false;
      return passesNoDuplicateTile(v0, v1, value, col);
    }
    return true;
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
    slots = slots.filter(slot => slot.kind === 'stack');
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
      if (isRowEmpty()) state.hasPlacedFirstDie = false;
      return col;
    }
    if (isRowEmpty()) state.hasPlacedFirstDie = false;
    return null;
  }
  return false;
}

export function placeDie(dieId, slot) {
  const fromBar = state.actionBar.includes(dieId);
  const fromRow = state.placedDieIds.has(dieId);
  if (!fromBar && !fromRow) return false;
  if (fromBar && !canPlaceMoreDiceFromBar()) return false;

  const valid = getValidSlotsForDie(dieId);
  if (!valid.some(s => slotsEqual(s, slot))) return false;

  let vacatedCol = null;
  if (fromBar) {
    state.actionBar = state.actionBar.filter(id => id !== dieId);
  } else {
    if (!isTopDieInStack(dieId)) return false;
    const removeResult = removeDieFromRow(dieId);
    if (removeResult === false) return false;
    if (typeof removeResult === 'number') vacatedCol = removeResult;
  }

  let targetCol;
  if (slot.kind === 'new-column') {
    state.row[slot.col] = { kind: 'stack', dice: [dieId] };
    targetCol = slot.col;
    state.hasPlacedFirstDie = true;
  } else if (slot.kind === 'insert') {
    targetCol = resolveInsertCol(slot.leftCol, slot.rightCol);
    state.row[targetCol] = { kind: 'stack', dice: [dieId] };
    state.hasPlacedFirstDie = true;
  } else {
    targetCol = slot.col;
    const column = state.row[slot.col];
    column.dice.push(dieId);
  }

  if (fromBar) {
    state.placedThisTurn++;
    state.placedDieIds.add(dieId);
    onTrayDiePlaced(dieId, targetCol);
  } else if (state.placedDieIds.has(dieId)) {
    if (vacatedCol != null) {
      onSpotColReposition(vacatedCol, targetCol, dieId);
    } else {
      onTrayDiePlaced(dieId, targetCol);
    }
  }

  state.selectedDieId = null;
  return true;
}

export function returnDieToBar(dieId, keepSelected = false) {
  if (!state.placedDieIds.has(dieId)) return false;
  if (!isTopDieInStack(dieId)) return false;
  const loc = findDieColumn(dieId);
  const boundKey = loc ? state.row[loc.col]?.dominoKey ?? null : null;
  const removeResult = removeDieFromRow(dieId);
  if (removeResult === false) return false;
  if (typeof removeResult === 'number') onColumnVacated(removeResult, boundKey);

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
