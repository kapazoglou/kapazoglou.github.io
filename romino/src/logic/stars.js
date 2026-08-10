import { state } from './state.js';
import { settings } from './settings.js';
import { getOccupiedCols, dieValueAt, dieIdAt, stackHeight, getColumn } from './row.js';

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
export function findStarMatches(newDieIds = state.placedDieIds) {
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
      if (isStarValuePair(va, vb) && includesNew) {
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
          && matchIncludesNewDieVertical(col, row, newDieIds)) {
          matches.push({ axis: 'v', col, row });
        }
      }
    }
  }

  return matches;
}

export function detectAndAddStars(newDieIds = state.placedDieIds) {
  state.stars += findStarMatches(newDieIds).length;
}
