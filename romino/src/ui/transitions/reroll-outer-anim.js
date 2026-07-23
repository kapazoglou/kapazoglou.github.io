import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { isOuterDieValue, rerollDieValue } from '../../logic/dice.js';
import { evaluateGameOver } from '../../logic/turn.js';
import { payStarForTrayDie } from './pip-anim.js';
import { render } from '../display/render.js';
import { renderHUD } from '../display/hud-v2.js';

function canRerollOuterDie(dieId) {
  if (!settings.rerollOuter || state.phase !== 'rolled' || state.stars <= 0) return false;
  if (!state.actionBar.includes(dieId)) return false;
  const die = state.dice[dieId];
  return die != null && isOuterDieValue(die.value);
}

/** Star pay fly → deduct → reroll → is-new tray pop. */
export function rerollOuterDieWithAnim(dieId, onGameOver) {
  if (!canRerollOuterDie(dieId)) return false;

  state.phase = 'animating';

  payStarForTrayDie(dieId, () => {
    state.stars -= 1;
    rerollDieValue(dieId);
    if (state.selectedDieId === dieId) state.selectedDieId = null;
    state.newTrayDieIds.add(dieId);
    renderHUD();
    render();

    const stuckReason = evaluateGameOver('post-roll');
    if (stuckReason) {
      state.phase = 'replay';
      onGameOver?.(stuckReason);
      return;
    }

    state.phase = 'rolled';
  });

  return true;
}
