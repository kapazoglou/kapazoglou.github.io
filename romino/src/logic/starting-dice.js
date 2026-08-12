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

/**
 * Roll two dice: any outer on first throw → reroll outers to inner, one 2-high stack;
 * both inner → two single-die columns (no stack).
 * @returns {StackColumn[]}
 */
function columnsFromPair() {
  const v1 = rollValue();
  const v2 = rollValue();

  if (isOuterDieValue(v1) || isOuterDieValue(v2)) {
    const f1 = ensureInner(v1);
    const f2 = ensureInner(v2);
    return [{ kind: 'stack', dice: [spawnDie(f1), spawnDie(f2)] }];
  }

  return [
    { kind: 'stack', dice: [spawnDie(v1)] },
    { kind: 'stack', dice: [spawnDie(v2)] },
  ];
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
  let remaining = n;

  while (remaining >= 2) {
    columns.push(...columnsFromPair());
    remaining -= 2;
  }

  if (remaining === 1) {
    columns.push(columnFromSingleton());
  }

  const cols = centeredCols(columns.length);
  for (let i = 0; i < columns.length; i++) {
    state.row[cols[i]] = columns[i];
  }

  state.hasPlacedFirstDie = true;
  state.dicePool -= n;
}
