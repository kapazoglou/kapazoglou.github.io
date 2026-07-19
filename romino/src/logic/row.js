import { state } from './state.js';
import { settings } from './settings.js';
import { tileIdentityFromStackValues } from './dice-visual.js';

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

/** Tray die left in the bar after this turn's placement quota is filled. */
export function isBarDieInactive(dieId) {
  return state.actionBar.includes(dieId) && !canPlaceMoreThisTurn();
}

function passesOneToOneNewColumn(value) {
  if (!settings.oneToOne) return true;
  return value >= 2 && value <= 5;
}

function isOneSixPair(a, b) {
  return (a === 1 && b === 6) || (a === 6 && b === 1);
}

function passesOneToOneThirdDie(first, second, third) {
  if (!settings.oneToOne) return true;
  if (isOneSixPair(second, third)) return true;
  if (second === first) return true;
  if (second < first) return third === 1;
  return third === 6;
}

function gapAllowsInsert(leftCol, rightCol) {
  const left = leftCol != null ? getColumn(leftCol) : null;
  const right = rightCol != null ? getColumn(rightCol) : null;
  if (left?.kind === 'tile' && right?.kind === 'tile') return false;
  return true;
}

/** New columns may touch a tile only when the other side of the gap is a dice stack. */
function passesTileAdjacencyRule(leftCol, rightCol) {
  const leftTile = leftCol != null && getColumn(leftCol)?.kind === 'tile';
  const rightTile = rightCol != null && getColumn(rightCol)?.kind === 'tile';
  if (!leftTile && !rightTile) return true;
  const leftStack = leftCol != null && getColumn(leftCol)?.kind === 'stack';
  const rightStack = rightCol != null && getColumn(rightCol)?.kind === 'stack';
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

function rowHasTile(suit, rank) {
  for (const column of Object.values(state.row)) {
    if (column.kind === 'tile' && column.suit === suit && column.rank === rank) return true;
  }
  return false;
}

/** Block completing a stack whose convert result duplicates an existing tile. */
function passesNoDuplicateTile(bottomValue, midValue, topValue) {
  const { suit, rank } = tileIdentityFromStackValues([bottomValue, midValue, topValue]);
  return !rowHasTile(suit, rank);
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

/** Read-only column index for an insert slot (resolveInsertCol mutates the row). */
function previewInsertCol(leftCol, rightCol) {
  if (leftCol == null) return rightCol - 1;
  if (rightCol == null) return leftCol + 1;
  const target = leftCol + 1;
  if (target >= rightCol) return rightCol;
  return target;
}

function slotTargetCol(slot) {
  if (slot.kind === 'insert') return previewInsertCol(slot.leftCol, slot.rightCol);
  return slot.col;
}

function anchorColForAdjacentRule() {
  const order = state.placementOrderThisTurn;
  if (!order.length) return null;
  return findDieColumn(order[order.length - 1])?.col ?? null;
}

function passesAdjacentColumnsOnly(slot, fromBar) {
  if (!settings.adjacentColumnsOnly || !fromBar) return true;
  const anchorCol = anchorColForAdjacentRule();
  if (anchorCol == null) return true;
  return Math.abs(slotTargetCol(slot) - anchorCol) <= 1;
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
      if (!passesOneToOneThirdDie(v0, v1, value)) return false;
      return passesNoDuplicateTile(v0, v1, value);
    }
    return true;
  }

  return false;
}

export function getValidSlotsForDie(dieId) {
  if (!canPlaceMoreThisTurn()) return [];
  const die = state.dice[dieId];
  if (!die) return [];
  if (!state.actionBar.includes(dieId) && !state.placedDieIds.has(dieId)) return [];

  const value = die.value;
  const fromBar = state.actionBar.includes(dieId);
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

  if (settings.adjacentColumnsOnly && fromBar) {
    slots = slots.filter(slot => passesAdjacentColumnsOnly(slot, true));
  }

  return slots;
}

function removeDieFromRow(dieId) {
  for (const [colKey, column] of Object.entries(state.row)) {
    if (column.kind !== 'stack') continue;
    const idx = column.dice.indexOf(dieId);
    if (idx === -1) continue;
    column.dice.splice(idx, 1);
    if (column.dice.length === 0) delete state.row[Number(colKey)];
    if (isRowEmpty()) state.hasPlacedFirstDie = false;
    return true;
  }
  return false;
}

export function placeDie(dieId, slot) {
  const fromBar = state.actionBar.includes(dieId);
  const fromRow = state.placedDieIds.has(dieId);
  if (!fromBar && !fromRow) return false;
  if (fromBar && !canPlaceMoreThisTurn()) return false;

  const valid = getValidSlotsForDie(dieId);
  if (!valid.some(s => slotsEqual(s, slot))) return false;

  if (fromBar) {
    state.actionBar = state.actionBar.filter(id => id !== dieId);
  } else {
    removeDieFromRow(dieId);
  }

  if (slot.kind === 'new-column') {
    state.row[slot.col] = { kind: 'stack', dice: [dieId] };
    state.hasPlacedFirstDie = true;
  } else if (slot.kind === 'insert') {
    const col = resolveInsertCol(slot.leftCol, slot.rightCol);
    state.row[col] = { kind: 'stack', dice: [dieId] };
    state.hasPlacedFirstDie = true;
  } else {
    const column = state.row[slot.col];
    column.dice.push(dieId);
  }

  if (fromBar) {
    state.placedThisTurn++;
    state.placedDieIds.add(dieId);
    state.placementOrderThisTurn.push(dieId);
  }

  state.selectedDieId = null;
  return true;
}

export function returnDieToBar(dieId) {
  if (!state.placedDieIds.has(dieId)) return false;
  if (!removeDieFromRow(dieId)) return false;

  state.actionBar.push(dieId);
  state.placedThisTurn--;
  state.placedDieIds.delete(dieId);
  state.placementOrderThisTurn = state.placementOrderThisTurn.filter(id => id !== dieId);
  state.selectedDieId = null;
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

