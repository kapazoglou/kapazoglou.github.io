import { state } from './state.js';
import { settings } from './settings.js';

/** Domino Roll uses the HUD deck counter for combo-list countdown (even when deckSize is 0). */
export function isDominoDeckCountdown() {
  return settings.dominoRoll
    && (settings.nRoll === 2 || settings.nRoll === 3 || settings.nRoll === 4);
}

export function isDeckSizeActive() {
  return settings.deckSize > 0 || isDominoDeckCountdown();
}

/** nRoll=4 Domino Roll shows the deck counter under the tray pipe instead of the HUD. */
export function isDominoDeckInActionBar() {
  return isDominoDeckCountdown() && settings.nRoll === 4;
}

export function showDeckInHud() {
  if (isDominoDeckInActionBar()) return false;
  return isDeckSizeActive();
}

export function initDeckRemaining() {
  if (isDominoDeckCountdown()) return;
  state.deckRemaining = settings.deckSize > 0 ? settings.deckSize : null;
}

/** @returns {'well-done' | null} */
export function tickDeckOnConvert() {
  if (isDominoDeckCountdown()) return null;
  if (!settings.deckSize || state.deckRemaining == null || state.deckRemaining <= 0) {
    return null;
  }
  state.deckRemaining -= 1;
  return state.deckRemaining === 0 ? 'well-done' : null;
}
