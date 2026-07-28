import { state } from './state.js';
import { settings } from './settings.js';
import { buildFullDeck, decodeTileKey, tileKey } from './tile-deck.js';
import { getOccupiedCols } from './row.js';
import { JOKER_RANK } from './dice-visual.js';

/** @typedef {'left' | 'right'} FlankSide */

function emptyStack() {
  return { remaining: [], top: null };
}

function shuffle(keys) {
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
}

function stackForSide(side) {
  return side === 'left' ? state.flankStackLeft : state.flankStackRight;
}

function popKey(stack) {
  if (!stack.remaining.length) return null;
  return stack.remaining.pop();
}

function revealTop(stack) {
  const key = popKey(stack);
  stack.top = key ? decodeTileKey(key) : null;
}

function seedStack(keys) {
  const stack = emptyStack();
  stack.remaining = keys.slice();
  revealTop(stack);
  return stack;
}

export function initFlankStacks() {
  if (!settings.deckFlank) {
    state.flankStackLeft = emptyStack();
    state.flankStackRight = emptyStack();
    return;
  }
  const keys = buildFullDeck(true).map(tileKey);
  shuffle(keys);
  state.flankStackLeft = seedStack(keys.slice(0, 26));
  state.flankStackRight = seedStack(keys.slice(26));
}

/** @param {FlankSide} side */
export function flankStackCount(side) {
  const stack = stackForSide(side);
  return (stack.top ? 1 : 0) + stack.remaining.length;
}

/** @param {FlankSide} side */
export function flankStackTop(side) {
  return stackForSide(side).top;
}

/** @param {FlankSide} side */
export function flankTopIdentity(side) {
  const top = flankStackTop(side);
  if (!top) return null;
  return { suit: top.suit, rank: top.rank };
}

export function flankTopMatchesIdentity(suit, rank) {
  if (!settings.deckFlank) return false;
  for (const side of ['left', 'right']) {
    const top = flankStackTop(side);
    if (top?.suit === suit && top?.rank === rank) return true;
  }
  return false;
}

export function flankBuriedMatchesIdentity(suit, rank) {
  if (!settings.deckFlank) return false;
  for (const side of ['left', 'right']) {
    const stack = stackForSide(side);
    for (const key of stack.remaining) {
      const tile = decodeTileKey(key);
      if (tile?.suit === suit && tile?.rank === rank) return true;
    }
  }
  return false;
}

export function flankMatchesIdentity(suit, rank) {
  return flankTopMatchesIdentity(suit, rank) || flankBuriedMatchesIdentity(suit, rank);
}

/** Flank sides whose visible top matches suit+rank (convert-match discard). */
export function findFlankSidesWithTopMatch(suit, rank) {
  if (!settings.deckFlank) return [];
  /** @type {FlankSide[]} */
  const sides = [];
  for (const side of ['left', 'right']) {
    const top = flankStackTop(side);
    if (top?.suit === suit && top?.rank === rank) sides.push(side);
  }
  return sides;
}

/** Player columns only — used for dynamic flank sweep col placement. */
function playerOccupiedCols() {
  return getOccupiedCols();
}

/** @param {FlankSide} side */
export function getFlankSweepCol(side) {
  const occupied = playerOccupiedCols();
  if (!occupied.length) return side === 'left' ? -1 : 1;
  if (side === 'left') return occupied[0] - 1;
  return occupied[occupied.length - 1] + 1;
}

/** @param {number} col */
export function flankSideForSweepCol(col) {
  if (!settings.deckFlank) return null;
  if (flankStackTop('left') && col === getFlankSweepCol('left')) return 'left';
  if (flankStackTop('right') && col === getFlankSweepCol('right')) return 'right';
  return null;
}

export function isFlankSweepCol(col) {
  return flankSideForSweepCol(col) != null;
}

export function bothFlankStacksEmpty() {
  return flankStackCount('left') === 0 && flankStackCount('right') === 0;
}

/** Deck Flank ON and at least one stack still holds cards — session must not end yet. */
export function flankEndgamePending() {
  return settings.deckFlank && !bothFlankStacksEmpty();
}

/** @param {FlankSide} side @returns {'ok' | 'well-done'} */
export function popFlankStack(side) {
  const stack = stackForSide(side);
  if (stack.top?.rank === JOKER_RANK) {
    state.jokerSuitsUsed.add(stack.top.suit);
  }
  stack.top = null;
  revealTop(stack);
  return bothFlankStacksEmpty() ? 'well-done' : 'ok';
}

/** Build tile entries for sweep detection including flank tops. */
export function sweepTileEntriesWithFlanks() {
  const tileEntries = playerOccupiedCols()
    .filter(col => state.row[col]?.kind === 'tile')
    .map(col => [col, state.row[col]]);

  if (settings.deckFlank) {
    const leftTop = flankStackTop('left');
    if (leftTop) tileEntries.push([getFlankSweepCol('left'), leftTop]);
    const rightTop = flankStackTop('right');
    if (rightTop) tileEntries.push([getFlankSweepCol('right'), rightTop]);
  }

  tileEntries.sort((a, b) => a[0] - b[0]);
  return tileEntries;
}

/** Occupied cols for adjacency checks — player cols only (flanks are virtual). */
export function getPlayerOccupiedCols() {
  return playerOccupiedCols();
}
