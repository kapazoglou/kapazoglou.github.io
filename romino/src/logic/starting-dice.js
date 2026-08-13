import { state } from './state.js';
import { settings } from './settings.js';
import { rollValue, spawnDie, isOuterDieValue } from './dice.js';

/** Contiguous column indices centered on col 0. */
function centeredCols(count) {
  const start = -Math.ceil((count - 1) / 2);
  return Array.from({ length: count }, (_, i) => start + i);
}

/** Reroll until face is inner (2–5); initial value already logged by rollValue. */
function ensureInner(value) {
  let v = value;
  while (isOuterDieValue(v)) {
    v = rollValue();
  }
  return v;
}

/** @typedef {{ kind: 'stack', dice: number[] }} StackColumn */

/** Pair roll → one 2-high stack; outers rerolled until inner. */
function stackFromPair() {
  const f1 = ensureInner(rollValue());
  const f2 = ensureInner(rollValue());
  return { kind: 'stack', dice: [spawnDie(f1), spawnDie(f2)] };
}

/** Odd remainder — single die, reroll outer until inner. */
function columnFromSingleton() {
  const v = ensureInner(rollValue());
  return { kind: 'stack', dice: [spawnDie(v)] };
}

/**
 * Seed the row with random dice on reset — bypasses placement rules.
 * Debits dicePool; dice are committed board state (not tray / not `placedDieIds`).
 */
export function seedStartingDice() {
  const n = settings.startingDice;
  if (n <= 0) return;

  /** @type {StackColumn[]} */
  const columns = [];
  const pairCount = Math.floor(n / 2);

  for (let i = 0; i < pairCount; i++) {
    columns.push(stackFromPair());
  }

  if (n % 2 === 1) {
    const insertAt = Math.floor(Math.random() * (columns.length + 1));
    columns.splice(insertAt, 0, columnFromSingleton());
  }

  const cols = centeredCols(columns.length);
  for (let i = 0; i < columns.length; i++) {
    state.row[cols[i]] = columns[i];
  }

  state.hasPlacedFirstDie = true;
  state.dicePool -= n;
}
