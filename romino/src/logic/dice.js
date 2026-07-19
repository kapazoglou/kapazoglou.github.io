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
