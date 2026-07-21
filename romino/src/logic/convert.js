import { state } from './state.js';
import { settings } from './settings.js';
import { tileIdentityFromStackValues, tileIdentityRequiresStar, JOKER_RANK } from './dice-visual.js';
import { getOccupiedCols } from './row.js';

function convertOptions() {
  return {
    tricolors: settings.tricolors,
    tricolorSevens: settings.tricolorSevens,
  };
}

export function stackValuesRequireStar(values) {
  const tile = tileIdentityFromStackValues(values, convertOptions());
  return tileIdentityRequiresStar(tile);
}

export function convertRequiresStar(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return false;
  const values = column.dice.map(id => state.dice[id].value);
  return stackValuesRequireStar(values);
}

export function getConvertibleCols() {
  return getOccupiedCols().filter(col => {
    const column = state.row[col];
    return column.kind === 'stack' && column.dice.length === 3;
  });
}

export function convertColumn(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return;
  const values = column.dice.map(id => state.dice[id].value);
  state.dicePool += column.dice.length;
  const tile = tileIdentityFromStackValues(values, convertOptions());
  if (tileIdentityRequiresStar(tile) && state.stars > 0) state.stars -= 1;
  if (tile.rank === JOKER_RANK) state.jokerSuitsUsed.add(tile.suit);
  state.row[col] = { kind: 'tile', ...tile };
}

export function convertFullStacks() {
  for (const col of getConvertibleCols()) convertColumn(col);
}
