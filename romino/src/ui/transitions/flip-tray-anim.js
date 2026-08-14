import { state } from '../../logic/state.js';
import { oppositeDieValue, canStarFlipTrayDie, recordFlip } from '../../logic/star-powers.js';
import { recordStarSpent } from '../../logic/game-log.js';
import { payStarForTrayDie } from './pip-anim.js';
import { render } from '../display/render.js';

/** Star pay fly → deduct → flip tray die to opposite face (all faces; outer gated by rerollOuter). */
export function tryStarFlipTrayPay(dieId, { skipStarFly = false } = {}) {
  if (!canStarFlipTrayDie(dieId)) return false;
  return flipTrayDieWithAnim(dieId, { skipStarFly });
}

export function flipTrayDieWithAnim(dieId, { skipStarFly = false } = {}) {
  if (!canStarFlipTrayDie(dieId)) return false;

  state.phase = 'animating';

  payStarForTrayDie(dieId, () => {
    const die = state.dice[dieId];
    if (!die) {
      state.phase = 'rolled';
      render();
      return;
    }

    state.stars -= 1;
    recordStarSpent('flip');
    die.value = oppositeDieValue(die.value);
    recordFlip(dieId);
    state.newTrayDieIds.add(dieId);

    state.phase = 'rolled';
    render();
  }, { skipFly: skipStarFly });

  return true;
}
