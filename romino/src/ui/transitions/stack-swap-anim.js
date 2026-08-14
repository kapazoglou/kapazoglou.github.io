import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { canStarSwapStack, swapStackDice } from '../../logic/star-powers.js';
import { recordStarSpent } from '../../logic/game-log.js';
import { payStarForConvert } from './pip-anim.js';
import { DIE_OUTER, DIE_BORDER } from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { CUBE_MERGE_MS } from './timing.js';

const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';
const DIE_STACK_STEP = DIE_OUTER - DIE_BORDER;

function stackDiceEls(col) {
  const colNode = document.querySelector(`.placement-col[data-col="${col}"]`);
  if (!colNode) return null;
  const dice = [...colNode.querySelectorAll('.die--placed')];
  if (dice.length !== 2) return null;
  const bottom = settings.stackBottomUp ? dice[0] : dice[1];
  const top = settings.stackBottomUp ? dice[1] : dice[0];
  return { bottom, top };
}

/** @returns {boolean} true when swap animation started */
export function tryStarSwapStackPay(col) {
  if (!canStarSwapStack(col)) return false;
  return swapStackWithAnim(col);
}

export function swapStackWithAnim(col) {
  if (!canStarSwapStack(col)) return false;
  const els = stackDiceEls(col);
  if (!els) return false;

  state.phase = 'animating';
  const mergeMs = spd(CUBE_MERGE_MS);

  payStarForConvert(col, () => {
    const { bottom, top } = els;
    bottom.classList.add('die--cube-merge', 'die--cube-merge-blend');
    top.classList.add('die--cube-merge', 'die--cube-merge-blend');
    bottom.style.transition = `transform ${mergeMs}ms ${FLY_EASING}`;
    top.style.transition = `transform ${mergeMs}ms ${FLY_EASING}`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bottom.style.transform = `translate(0, ${-DIE_STACK_STEP}px)`;
        top.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
      });
    });

    setTimeout(() => {
      swapStackDice(col);
      state.stars -= 1;
      recordStarSpent('swap');
      state.phase = 'rolled';
      render();
    }, mergeMs);
  });

  return true;
}
