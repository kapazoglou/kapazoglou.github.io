import { state } from '../../logic/state.js';
import { canShowDominoPairReroll } from '../../logic/domino-roll.js';
import { rerollDominoPairOffer, evaluateGameOver, triggerGameOver, scheduleRender } from '../../logic/turn.js';
import { recordStarSpent } from '../../logic/game-log.js';
import { payStarForDominoPair } from './pip-anim.js';
import { render } from '../display/render.js';

/** Drop on either domino die — star-pay redraws the whole pair. */
export function canDominoPairStarReroll(dieId) {
  return canShowDominoPairReroll() && state.actionBar.includes(dieId);
}

/** @returns {boolean} true when star-pay domino pair redraw animation started */
export function tryDominoPairStarReroll(dieId, { skipStarFly = false } = {}) {
  if (!canDominoPairStarReroll(dieId)) return false;

  state.phase = 'animating';

  payStarForDominoPair(() => {
    state.stars -= 1;
    recordStarSpent('reroll');
    rerollDominoPairOffer();

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
