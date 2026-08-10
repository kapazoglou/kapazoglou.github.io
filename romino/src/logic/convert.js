import { state } from './state.js';
import { settings } from './settings.js';
import {
  tileIdentityFromStackValues,
  tileIdentityRequiresStar,
  isSwitcherTricolorStack,
  missingInnerDieFromTricolor,
  JOKER_RANK,
} from './dice-visual.js';
import { getOccupiedCols } from './row.js';
import { getDominoKeyForCol } from './domino-spots.js';
import { recordTileCreated, recordStarSpent } from './game-log.js';
import { tickDeckOnConvert } from './deck-size.js';

function convertOptions() {
  return {
    tricolors: settings.tricolors,
    tricolorSevens: settings.tricolorSevens,
  };
}

export function stackValuesRequireStar(values) {
  if (!settings.aceJokerStarCost) return false;
  if (isSwitcherTricolorStack(values)) return true;
  const tile = tileIdentityFromStackValues(values, convertOptions());
  return tileIdentityRequiresStar(tile);
}

export function convertRequiresStar(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return false;
  const values = column.dice.map(id => state.dice[id].value);
  return stackValuesRequireStar(values);
}

export function isSwitcherConvertCol(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return false;
  const values = column.dice.map(id => state.dice[id].value);
  return isSwitcherTricolorStack(values);
}

export function getConvertibleCols() {
  return getOccupiedCols().filter(col => {
    const column = state.row[col];
    return column.kind === 'stack' && column.dice.length === 3;
  });
}

/** Switcher Jokers: tricolor stack → lone die of missing inner color; mid+top return to pool. */
export function convertSwitcherColumn(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return null;
  const values = column.dice.map(id => state.dice[id].value);
  if (!isSwitcherTricolorStack(values)) return null;

  const missing = missingInnerDieFromTricolor(values);
  const bottomId = column.dice[0];
  state.dicePool += 2;

  if (stackValuesRequireStar(values) && state.stars > 0) {
    state.stars -= 1;
    recordStarSpent('convert');
  }

  state.dice[bottomId].value = missing;
  const dominoKey = getDominoKeyForCol(col);
  state.row[col] = { kind: 'stack', dice: [bottomId], ...(dominoKey ? { dominoKey } : {}) };
  return null;
}

/** @returns {'well-done' | null} */
export function convertColumn(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return null;
  const values = column.dice.map(id => state.dice[id].value);
  if (isSwitcherTricolorStack(values)) return convertSwitcherColumn(col);

  const hold = settings.tileDiceHold ? 1 : 0;
  state.dicePool += column.dice.length - hold;
  state.diceWithheld += hold;
  const tile = tileIdentityFromStackValues(values, convertOptions());
  if (stackValuesRequireStar(values) && state.stars > 0) {
    state.stars -= 1;
    recordStarSpent('convert');
  }
  if (tile.rank === JOKER_RANK) state.jokerSuitsUsed.add(tile.suit);
  const dominoKey = getDominoKeyForCol(col);
  state.row[col] = { kind: 'tile', ...tile, ...(dominoKey ? { dominoKey } : {}) };
  recordTileCreated(tile, col);
  return tickDeckOnConvert();
}

export function convertFullStacks() {
  for (const col of getConvertibleCols()) convertColumn(col);
}

/** Release virtual dice held by swept/removed tiles when tileDiceHold ON. */
export function releaseWithheldDice(count = 1) {
  if (!settings.tileDiceHold || count <= 0) return;
  state.dicePool += count;
  state.diceWithheld -= count;
}
