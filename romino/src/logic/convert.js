import { state } from './state.js';
import { tileIdentityFromStackValues } from './dice-visual.js';
import { recordTileDiscovery } from './discovery.js';
import { getOccupiedCols } from './row.js';

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
  const tile = { kind: 'tile', ...tileIdentityFromStackValues(values) };
  state.row[col] = tile;
  recordTileDiscovery(tile);
}

export function convertFullStacks() {
  for (const col of getConvertibleCols()) convertColumn(col);
}
