import { state } from './state.js';
import { settings } from './settings.js';

export function isDeckSizeActive() {
  return settings.deckSize > 0;
}

export function initDeckRemaining() {
  state.deckRemaining = isDeckSizeActive() ? settings.deckSize : null;
}

/** @returns {'well-done' | null} */
export function tickDeckOnConvert() {
  if (!isDeckSizeActive() || state.deckRemaining == null || state.deckRemaining <= 0) {
    return null;
  }
  state.deckRemaining -= 1;
  return state.deckRemaining === 0 ? 'well-done' : null;
}
