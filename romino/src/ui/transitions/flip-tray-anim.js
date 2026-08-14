import { state } from '../../logic/state.js';
import { oppositeDieValue, canStarFlipTrayDie } from '../../logic/star-powers.js';
import { recordStarSpent } from '../../logic/game-log.js';
import { payStarForTrayDie } from './pip-anim.js';
import { render } from '../display/render.js';

/** Star pay fly → deduct → flip tray die to opposite face (2–5 only). */
export function tryStarFlipTrayPay(dieId) {
  if (!canStarFlipTrayDie(dieId)) return false;
  return flipTrayDieWithAnim(dieId);
}

export function flipTrayDieWithAnim(dieId) {
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
    if (state.selectedDieId === dieId) state.selectedDieId = null;
    state.newTrayDieIds.add(dieId);

    state.phase = 'rolled';
    render();
  });

  return true;
}
