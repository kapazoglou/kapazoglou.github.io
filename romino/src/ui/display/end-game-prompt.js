/** UI-only armed state for roll-button KO confirm (not game state). */

let armed = false;
/** @type {string|null} */
let pendingReason = null;

export function isEndGamePromptArmed() {
  return armed;
}

export function getPendingEndGameReason() {
  return pendingReason ?? '';
}

export function armEndGamePrompt(reason) {
  armed = true;
  pendingReason = reason;
}

export function disarmEndGamePrompt() {
  armed = false;
  pendingReason = null;
}
