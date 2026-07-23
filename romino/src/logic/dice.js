import { state } from './state.js';

export function spawnDie(value) {
  const id = state.nextDieId++;
  state.dice[id] = { id, value };
  return id;
}

export function rollValue() {
  return Math.floor(Math.random() * 6) + 1;
}

export function spawnRandomDie() {
  return spawnDie(rollValue());
}

/** Tray extreme face — 1 or 6. */
export function isOuterDieValue(value) {
  return value === 1 || value === 6;
}

/** Assign a fresh random 1–6. Returns false when die missing. */
export function rerollDieValue(dieId) {
  const die = state.dice[dieId];
  if (!die) return false;
  die.value = rollValue();
  return true;
}
