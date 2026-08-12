import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { getOccupiedCols } from '../../logic/row.js';
import { render } from '../display/render.js';
import {
  flyLayer,
  viewportScale,
  toDesignPx,
  captureElementFlyStart,
  FLY_EASING,
} from './cube-fly.js';
import { COL_DIE_IN_MS, TRAY_STAGGER_MS } from './timing.js';

const TRAY_GAP_PX = 20;

/** Die ids in column order (left→right), bottom→top within each stack. */
function seededDieFlightOrder() {
  const order = [];
  for (const col of getOccupiedCols()) {
    const column = state.row[col];
    if (column.kind !== 'stack') continue;
    for (const dieId of column.dice) order.push(dieId);
  }
  return order;
}

/** Staggered origin behind the action-bar dice tray (viewport-inner design px). */
function actionBarOriginXY(index, total, layerRect, scale) {
  const bar = document.querySelector('.action-bar-dice') ?? document.getElementById('action-bar');
  if (!bar) return null;

  const r = bar.getBoundingClientRect();
  const spread = Math.max(0, total - 1) * TRAY_GAP_PX;
  const startX = r.left + r.width / 2 - spread / 2;
  const x = startX + index * TRAY_GAP_PX;

  return {
    left: toDesignPx(x - layerRect.left, scale),
    top: toDesignPx(r.top + (r.height - DIE_OUTER) / 2 - layerRect.top, scale),
  };
}

function setStartingDiceAnimActive(active) {
  document.getElementById('app')?.classList.toggle('is-starting-dice-anim', active);
}

function finishStartingDiceAnim(onDone) {
  state.startingDiceAnimPending = false;
  state.phase = 'idle';
  setStartingDiceAnimActive(false);
  render();
  onDone?.();
}

/**
 * Fly seeded row dice from behind the action bar into place.
 * Expects `state.startingDiceAnimPending` and a prior `render()`.
 */
export function runStartingDiceAnim(onDone) {
  if (!state.startingDiceAnimPending || settings.startingDice <= 0) {
    onDone?.();
    return;
  }

  const order = seededDieFlightOrder();
  if (!order.length) {
    finishStartingDiceAnim(onDone);
    return;
  }

  const layer = flyLayer();
  if (!layer) {
    finishStartingDiceAnim(onDone);
    return;
  }

  state.phase = 'animating';
  setStartingDiceAnimActive(true);

  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const flyMs = spd(COL_DIE_IN_MS);
  const staggerMs = spd(TRAY_STAGGER_MS);
  let remaining = order.length;

  const onOneDone = () => {
    remaining -= 1;
    if (remaining <= 0) finishStartingDiceAnim(onDone);
  };

  order.forEach((dieId, index) => {
    setTimeout(() => {
      const targetEl = document.querySelector(`.die--placed[data-die-id="${dieId}"]`);
      const start = actionBarOriginXY(index, order.length, layerRect, scale);
      if (!targetEl || !start) {
        onOneDone();
        return;
      }

      const end = captureElementFlyStart(targetEl, layer, scale);
      const die = state.dice[dieId];
      if (!die) {
        onOneDone();
        return;
      }

      const flyer = document.createElement('div');
      flyer.className = 'placement-die-flyer placement-die-flyer--starting';
      flyer.innerHTML = dieSVG(die.value, DIE_OUTER);
      flyer.style.left = `${start.left}px`;
      flyer.style.top = `${start.top}px`;
      flyer.style.transform = 'translate(0, 0)';
      layer.appendChild(flyer);

      const dx = end.left - start.left;
      const dy = end.top - start.top;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flyer.style.transition = `transform ${flyMs}ms ${FLY_EASING}`;
          flyer.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      });

      setTimeout(() => {
        flyer.remove();
        onOneDone();
      }, flyMs);
    }, index * staggerMs);
  });
}

/** After resetGame + render — double rAF so row targets are laid out. */
export function beginStartingDiceAnim(onDone) {
  if (!state.startingDiceAnimPending) {
    onDone?.();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => runStartingDiceAnim(onDone));
  });
}
