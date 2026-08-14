import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { isOuterDieValue, rerollDieValue } from '../../logic/dice.js';
import { evaluateGameOver, triggerGameOver, scheduleRender } from '../../logic/turn.js';
import { recordStarSpent } from '../../logic/game-log.js';
import { payStarForTrayDie } from './pip-anim.js';
import { render } from '../display/render.js';

function canRerollOuterDie(dieId) {
  if (!settings.rerollOuter || state.phase !== 'rolled' || state.stars <= 0) return false;
  if (!state.actionBar.includes(dieId)) return false;
  const die = state.dice[dieId];
  return die != null && isOuterDieValue(die.value);
}

/** Selected tray die that can be paid for an outer reroll. */
export function selectedOuterTrayDieId() {
  if (state.selectedDieId == null) return null;
  if (!settings.rerollOuter || state.phase !== 'rolled') return null;
  const die = state.dice[state.selectedDieId];
  if (!die || !isOuterDieValue(die.value)) return null;
  if (!state.actionBar.includes(state.selectedDieId)) return null;
  return state.selectedDieId;
}

/** @returns {boolean} true when reroll animation started */
export function tryRerollOuterPay(dieId, { skipStarFly = false } = {}) {
  if (dieId == null || !canRerollOuterDie(dieId)) return false;
  return rerollOuterDieWithAnim(dieId, { skipStarFly });
}

/** Star pay fly → deduct → reroll → is-new tray pop. */
export function rerollOuterDieWithAnim(dieId, { skipStarFly = false } = {}) {
  if (!canRerollOuterDie(dieId)) return false;

  state.phase = 'animating';

  payStarForTrayDie(dieId, () => {
    state.stars -= 1;
    recordStarSpent('reroll');
    rerollDieValue(dieId);
    if (state.selectedDieId === dieId) state.selectedDieId = null;
    state.newTrayDieIds.add(dieId);

    const stuckReason = evaluateGameOver('post-roll');
    if (stuckReason) {
      triggerGameOver(stuckReason);
      scheduleRender(render);
      return;
    }

    state.phase = 'rolled';
    render();
  }, { skipFly: skipStarFly });

  return true;
}
