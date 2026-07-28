/** UI-only armed state for roll-button KO confirm (not game state). */

let armed = false;
/** @type {string|null} */
let pendingReason = null;
/** @type {'warning-red' | 'pending-roll' | null} */
let armSource = null;

export function isEndGamePromptArmed() {
  return armed;
}

export function getPendingEndGameReason() {
  return pendingReason ?? '';
}

/**
 * @param {string} reason
 * @param {'warning-red' | 'pending-roll'} [source]
 */
export function armEndGamePrompt(reason, source = 'warning-red') {
  armed = true;
  pendingReason = reason;
  armSource = source;
}

export function disarmEndGamePrompt() {
  armed = false;
  pendingReason = null;
  armSource = null;
}

/** Collapse warning-red arms when roll chrome is no longer warning red. */
export function syncEndGamePromptWithRollChrome(isWarningRedBorder) {
  if (armed && armSource === 'warning-red' && !isWarningRedBorder) {
    disarmEndGamePrompt();
    return true;
  }
  return false;
}
