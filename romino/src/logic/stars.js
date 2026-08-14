import { state } from './state.js';
import { settings } from './settings.js';
import { getOccupiedCols, dieValueAt, dieIdAt, stackHeight, getColumn, findDieColumn } from './row.js';

/** Columns with a push-below commit this turn. */
function getPushBelowMutedCols() {
  const cols = new Set();
  for (const dieId of state.pushBelowDieIds) {
    const loc = findDieColumn(dieId);
    if (loc) cols.add(loc.col);
  }
  return cols;
}

/** Dice that may trigger a star pair this turn — placements plus optional push/swap stack mutations. */
export function getStarEligibleDieIds() {
  const ids = new Set(state.placedDieIds);
  if (!settings.pushSwapStars) {
    for (const dieId of state.pushBelowDieIds) ids.delete(dieId);
    for (const col of state.swapStackCols) {
      const column = getColumn(col);
      if (column?.kind === 'stack') {
        for (const dieId of column.dice) ids.delete(dieId);
      }
    }
    return ids;
  }
  const pushCols = new Set();
  for (const dieId of state.pushBelowDieIds) {
    const loc = findDieColumn(dieId);
    if (loc) pushCols.add(loc.col);
  }
  for (const col of pushCols) {
    const column = getColumn(col);
    if (column?.kind === 'stack') {
      for (const dieId of column.dice) ids.add(dieId);
    }
  }
  for (const col of state.swapStackCols) {
    const column = getColumn(col);
    if (column?.kind === 'stack') {
      for (const dieId of column.dice) ids.add(dieId);
    }
  }
  return ids;
}

function matchDieIds(match) {
  if (match.axis === 'v') {
    return [dieIdAt(match.col, match.row), dieIdAt(match.col, match.row + 1)]
      .filter(id => id != null);
  }
  return [dieIdAt(match.leftCol, match.row), dieIdAt(match.rightCol, match.row)]
    .filter(id => id != null);
}

/** When OFF, swap cols are fully muted; push cols only allow normal tray placements. */
function matchPassesPushSwapGate(match, eligibleIds) {
  if (settings.pushSwapStars) return true;
  const ids = matchDieIds(match);
  if (!ids.some(id => eligibleIds.has(id))) return false;

  for (const id of ids) {
    const loc = findDieColumn(id);
    if (loc && state.swapStackCols.has(loc.col)) return false;
  }

  const pushCols = getPushBelowMutedCols();
  return ids.every(id => {
    const loc = findDieColumn(id);
    if (!loc || !pushCols.has(loc.col)) return true;
    return eligibleIds.has(id);
  });
}

/** Adjacent die values ±1, or ace wrap 1↔6. */
function isStarValuePair(va, vb) {
  if (va == null || vb == null) return false;
  if (settings.consecutiveStars) {
    if (Math.abs(va - vb) === 1) return true;
    return (va === 1 && vb === 6) || (va === 6 && vb === 1);
  }
  return va === vb;
}

function matchIncludesNewDie(leftCol, rightCol, row, newDieIds) {
  const leftId = dieIdAt(leftCol, row);
  const rightId = dieIdAt(rightCol, row);
  return (leftId != null && newDieIds.has(leftId))
    || (rightId != null && newDieIds.has(rightId));
}

function isTileCol(col) {
  return getColumn(col)?.kind === 'tile';
}

/** Dice & Cubes: tile bottom die vs adjacent stack die — new die must be on the stack side. */
function matchIncludesNewDieWithTile(leftCol, rightCol, row, newDieIds) {
  const leftTile = isTileCol(leftCol);
  const rightTile = isTileCol(rightCol);
  if (leftTile && rightTile) return false;
  if (row !== 0) return false;
  const stackCol = leftTile ? rightCol : leftCol;
  const stackDieId = dieIdAt(stackCol, 0);
  return stackDieId != null && newDieIds.has(stackDieId);
}

function matchIncludesNewDieVertical(col, topRow, newDieIds) {
  const topId = dieIdAt(col, topRow);
  const bottomId = dieIdAt(col, topRow + 1);
  return (topId != null && newDieIds.has(topId))
    || (bottomId != null && newDieIds.has(bottomId));
}

/** Horizontal + optional vertical stack-die pairs (tiles excluded). Same or consecutive per setting. ≥1 die placed this turn. */
export function findStarMatches(newDieIds = getStarEligibleDieIds()) {
  const matches = [];
  const cols = getOccupiedCols();
  for (let i = 0; i < cols.length - 1; i++) {
    const leftCol = cols[i];
    const rightCol = cols[i + 1];
    const leftTile = isTileCol(leftCol);
    const rightTile = isTileCol(rightCol);
    if (leftTile || rightTile) {
      if (!settings.diceAndCubes || (leftTile && rightTile)) continue;
    }
    const maxRows = Math.max(stackHeight(leftCol), stackHeight(rightCol));
    for (let row = 0; row < maxRows; row++) {
      if ((leftTile || rightTile) && row !== 0) continue;
      const va = dieValueAt(leftCol, row);
      const vb = dieValueAt(rightCol, row);
      const includesNew = (leftTile || rightTile)
        ? matchIncludesNewDieWithTile(leftCol, rightCol, row, newDieIds)
        : matchIncludesNewDie(leftCol, rightCol, row, newDieIds);
      if (isStarValuePair(va, vb) && includesNew
        && matchPassesPushSwapGate({ axis: 'h', leftCol, rightCol, row }, newDieIds)) {
        matches.push({ axis: 'h', leftCol, rightCol, row });
      }
    }
  }

  if (settings.verticalStars) {
    for (const col of cols) {
      if (getColumn(col)?.kind === 'tile') continue;
      const height = stackHeight(col);
      for (let row = 0; row < height - 1; row++) {
        const va = dieValueAt(col, row);
        const vb = dieValueAt(col, row + 1);
        if (isStarValuePair(va, vb)
          && matchIncludesNewDieVertical(col, row, newDieIds)
          && matchPassesPushSwapGate({ axis: 'v', col, row }, newDieIds)) {
          matches.push({ axis: 'v', col, row });
        }
      }
    }
  }

  return matches;
}

export function detectAndAddStars(newDieIds = getStarEligibleDieIds()) {
  state.stars += findStarMatches(newDieIds).length;
}
