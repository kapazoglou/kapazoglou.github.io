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

/** Adjacent same-row stack-die pairs (tiles excluded). Same or consecutive per setting. ≥1 die placed this turn. */
export function findStarMatches(newDieIds = state.placedDieIds) {
  const matches = [];
  const cols = getOccupiedCols();
  for (let i = 0; i < cols.length - 1; i++) {
    const leftCol = cols[i];
    const rightCol = cols[i + 1];
    if (getColumn(leftCol)?.kind === 'tile' || getColumn(rightCol)?.kind === 'tile') continue;
    const maxRows = Math.max(stackHeight(leftCol), stackHeight(rightCol));
    for (let row = 0; row < maxRows; row++) {
      const va = dieValueAt(leftCol, row);
      const vb = dieValueAt(rightCol, row);
      if (isStarValuePair(va, vb)
        && matchIncludesNewDie(leftCol, rightCol, row, newDieIds)) {
        matches.push({ leftCol, rightCol, row });
      }
    }
  }
  return matches;
}

export function detectAndAddStars(newDieIds = state.placedDieIds) {
  state.stars += findStarMatches(newDieIds).length;
}
