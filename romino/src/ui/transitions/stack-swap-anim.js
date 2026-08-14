import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import {
  canStarSwapStack,
  canRefundSwapStack,
  markSwapStackCol,
  clearSwapStackCol,
  swapStackDice,
  addSwapReminderCol,
  clearSwapReminderCol,
} from '../../logic/star-powers.js';
import { syncStarMarkersDuringMotion } from '../display/placement-row.js';
import { recordStarSpent } from '../../logic/game-log.js';
import { payStarForConvert, refundStarFromCol } from './pip-anim.js';
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
export function tryStarSwapStackPay(col, { skipStarFly = false } = {}) {
  if (!canStarSwapStack(col)) return false;
  return swapStackWithAnim(col, { skipStarFly });
}

export function swapStackWithAnim(col, { skipStarFly = false } = {}) {
  if (!canStarSwapStack(col)) return false;
  const els = stackDiceEls(col);
  if (!els) return false;

  state.phase = 'animating';
  const mergeMs = spd(CUBE_MERGE_MS);

  payStarForConvert(col, () => {
    syncStarMarkersDuringMotion(mergeMs);
    runSwapCrossAnim(els, mergeMs, () => {
      swapStackDice(col);
      markSwapStackCol(col);
      addSwapReminderCol(col);
      state.phase = 'rolled';
      render();
    });
  }, 1, { skipFly: skipStarFly, deductState: true });
  recordStarSpent('swap');

  return true;
}

function wrapDieForSwapBlend(dieEl) {
  const wrap = document.createElement('div');
  wrap.className = 'die-swap-blend-wrap';
  const backdrop = document.createElement('div');
  backdrop.className = 'die-swap-blend-bg';
  dieEl.parentNode.insertBefore(wrap, dieEl);
  wrap.append(backdrop, dieEl);
  return wrap;
}

function runSwapCrossAnim(els, mergeMs, onDone) {
  const { bottom, top } = els;
  const colNode = bottom.closest('.placement-col');
  if (!colNode) {
    onDone();
    return;
  }

  colNode.classList.add('placement-col--stack-swap-animating');
  const bottomWrap = wrapDieForSwapBlend(bottom);
  const topWrap = wrapDieForSwapBlend(top);
  const wraps = [bottomWrap, topWrap];

  const transition = `transform ${mergeMs}ms ${FLY_EASING}`;
  for (const wrap of wraps) {
    wrap.style.transition = transition;
  }

  bottom.classList.add('die--cube-merge', 'die--swap-blend');
  top.classList.add('die--cube-merge', 'die--swap-blend');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bottomWrap.style.transform = `translate(0, ${-DIE_STACK_STEP}px)`;
      topWrap.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
    });
  });

  // Commit state + render replaces the row — do not unwrap or clear transforms first
  // (that snaps dice back one frame before render, causing a visible flash).
  setTimeout(onDone, mergeMs);
}

/** @returns {boolean} true when refund animation started */
export function tryRefundSwapStack(col) {
  if (!canRefundSwapStack(col)) return false;
  return refundSwapStackWithAnim(col);
}

export function refundSwapStackWithAnim(col) {
  if (!canRefundSwapStack(col)) return false;
  const els = stackDiceEls(col);
  if (!els) return false;

  state.phase = 'animating';
  const mergeMs = spd(CUBE_MERGE_MS);

  runSwapCrossAnim(els, mergeMs, () => {
    swapStackDice(col);
    state.stars += 1;
    clearSwapStackCol(col);
    clearSwapReminderCol(col);
    state.phase = 'rolled';
    refundStarFromCol(col, () => render(), 1, { fromRow: 0 });
  });

  return true;
}
