import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { canShowDominoPairReroll } from '../../logic/domino-roll.js';
import { starSVG } from '../../logic/dice-visual.js';
import {
  canStarFlipTrayDie,
  canStarSwapStack,
  canSpendStarPower,
  isStarRerollTrayDie,
  starPowersEnabled,
} from '../../logic/star-powers.js';
import { selectedOuterTrayDieId, tryRerollOuterPay } from '../transitions/reroll-outer-anim.js';
import { canDominoPairStarReroll, tryDominoPairStarReroll } from '../transitions/domino-reroll-anim.js';
import { tryStarFlipTrayPay } from '../transitions/flip-tray-anim.js';
import { tryStarSwapStackPay } from '../transitions/stack-swap-anim.js';
import { playSfx } from '../transitions/sfx.js';
import { starFlyLayer } from '../transitions/pip-anim.js';
import { flashStarShortagePlacement } from '../transitions/invalid-flash.js';

const DRAG_THRESHOLD = 8;
const HUD_STAR_PX = 32;

let dragStarPay = false;
let starDragActive = false;
let starDragMoved = false;
let starFlyer = null;
/** @type {HTMLElement[]} */
let hoverDieEls = [];
let dragStartX = 0;
let dragStartY = 0;
let capturedPointerId = null;

function viewportScale() {
  const root = starFlyLayer()?.parentElement ?? document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function isStarPayDraggable() {
  if (state.phase !== 'rolled' || state.stars <= 0) return false;
  return settings.rerollOuter || canShowDominoPairReroll() || starPowersEnabled();
}

export function isHudStarPayDraggable() {
  return isStarPayDraggable();
}

function dominoPairStarPayDieId() {
  if (!canShowDominoPairReroll()) return null;
  if (state.selectedDieId != null && state.actionBar.includes(state.selectedDieId)) {
    return state.selectedDieId;
  }
  return state.actionBar[0] ?? null;
}

function selectedStarPayTrayDieId() {
  if (state.phase !== 'rolled') return null;
  const dominoDieId = dominoPairStarPayDieId();
  if (dominoDieId != null) return dominoDieId;
  return selectedOuterTrayDieId();
}

function selectedStarFlipTrayDieId() {
  if (!canSpendStarPower()) return null;
  if (state.selectedDieId != null && canStarFlipTrayDie(state.selectedDieId)) {
    return state.selectedDieId;
  }
  return null;
}

function tryStarPayReroll(dieId, { skipStarFly = false } = {}) {
  if (canDominoPairStarReroll(dieId)) return tryDominoPairStarReroll(dieId, { skipStarFly });
  return tryRerollOuterPay(dieId, { skipStarFly });
}

function trayDieTargetAt(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY)?.closest('.die--action');
  if (!el) return null;
  const dieId = Number(el.dataset.dieId);
  if (Number.isNaN(dieId) || !state.actionBar.includes(dieId)) return null;
  return { el, dieId };
}

function stackSwapTargetAt(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY)?.closest('.die--placed');
  if (!el) return null;
  const col = Number(el.dataset.col);
  if (Number.isNaN(col)) return null;
  return { col, el };
}

function tryStarPowerOnTrayDie(dieId, { skipStarFly = false } = {}) {
  if (canDominoPairStarReroll(dieId)) return tryDominoPairStarReroll(dieId, { skipStarFly });
  if (settings.rerollOuter && isStarRerollTrayDie(dieId)) return tryRerollOuterPay(dieId, { skipStarFly });
  if (canStarFlipTrayDie(dieId)) return tryStarFlipTrayPay(dieId, { skipStarFly });
  return false;
}

function dominoPairHoverEls() {
  return state.actionBar
    .map(id => document.querySelector(`.die--action[data-die-id="${id}"]`))
    .filter(Boolean);
}

function capturePointer(e) {
  capturedPointerId = e.pointerId;
  document.body.setPointerCapture(e.pointerId);
}

function releasePointer() {
  if (capturedPointerId != null) {
    document.body.releasePointerCapture?.(capturedPointerId);
    capturedPointerId = null;
  }
}

function clearHoverTarget() {
  for (const el of hoverDieEls) {
    const id = Number(el.dataset.dieId);
    if (state.selectedDieId !== id) {
      el.classList.remove('die--action-selected');
    }
    el.classList.remove('die--star-power-hover');
  }
  hoverDieEls = [];
}

function clearStarDrag() {
  starFlyer?.remove();
  starFlyer = null;
  clearHoverTarget();
  dragStarPay = false;
  starDragActive = false;
  starDragMoved = false;
  releasePointer();
}

function createStarFlyer(sourceRect) {
  const layer = starFlyLayer();
  if (!layer) return;
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const left = (sourceRect.left + sourceRect.width / 2 - layerRect.left) / scale - HUD_STAR_PX / 2;
  const top = (sourceRect.top + sourceRect.height / 2 - layerRect.top) / scale - HUD_STAR_PX / 2;
  starFlyer = document.createElement('div');
  starFlyer.className = 'star-flyer star-flyer--drag';
  starFlyer.innerHTML = starSVG(HUD_STAR_PX);
  starFlyer.style.left = `${left}px`;
  starFlyer.style.top = `${top}px`;
  layer.appendChild(starFlyer);
}

function moveStarFlyer(clientX, clientY) {
  if (!starFlyer) return;
  const layer = starFlyLayer();
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  starFlyer.style.left = `${(clientX - layerRect.left) / scale - HUD_STAR_PX / 2}px`;
  starFlyer.style.top = `${(clientY - layerRect.top) / scale - HUD_STAR_PX / 2}px`;
}

function updateStarDropHover(clientX, clientY) {
  const stackTarget = stackSwapTargetAt(clientX, clientY);
  if (stackTarget && canStarSwapStack(stackTarget.col)) {
    const colNode = stackTarget.el.closest('.placement-col');
    const nextEls = colNode ? [...colNode.querySelectorAll('.die--placed')] : [];
    if (nextEls.length === hoverDieEls.length && nextEls.every((el, i) => el === hoverDieEls[i])) {
      return;
    }
    clearHoverTarget();
    hoverDieEls = nextEls;
    for (const el of hoverDieEls) el.classList.add('die--star-power-hover');
    return;
  }

  const trayTarget = trayDieTargetAt(clientX, clientY);
  let nextEls = [];
  if (trayTarget) {
    if (canDominoPairStarReroll(trayTarget.dieId)) {
      nextEls = dominoPairHoverEls();
    } else if (
      (settings.rerollOuter && isStarRerollTrayDie(trayTarget.dieId))
      || canStarFlipTrayDie(trayTarget.dieId)
    ) {
      nextEls = [trayTarget.el];
    }
  }

  if (nextEls.length === hoverDieEls.length && nextEls.every((el, i) => el === hoverDieEls[i])) {
    return;
  }
  clearHoverTarget();
  hoverDieEls = nextEls;
  for (const el of hoverDieEls) {
    if (el.classList.contains('die--action')) {
      el.classList.add('die--action-selected');
    } else {
      el.classList.add('die--star-power-hover');
    }
  }
}

function resolveStarDrop(clientX, clientY, { skipStarFly = false } = {}) {
  const stackTarget = stackSwapTargetAt(clientX, clientY);
  if (stackTarget && canStarSwapStack(stackTarget.col)) {
    return tryStarSwapStackPay(stackTarget.col, { skipStarFly });
  }

  const trayTarget = trayDieTargetAt(clientX, clientY);
  if (trayTarget) {
    return tryStarPowerOnTrayDie(trayTarget.dieId, { skipStarFly });
  }

  return false;
}

function onStarPointerDown(e) {
  if (state.phase === 'animating' || state.phase === 'replay') return;
  if (e.button !== 0) return;
  const starPayEl = e.target.closest('#hud-star-pay');
  if (!starPayEl || !isStarPayDraggable()) return;

  dragStarPay = true;
  starDragActive = false;
  starDragMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  capturePointer(e);
  e.preventDefault();
}

function onStarPointerMove(e) {
  if (!dragStarPay) return;

  if (!starDragActive) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    starDragActive = true;
    starDragMoved = true;
    playSfx('dice_pickup');
    const source = document.getElementById('hud-star-pay')?.getBoundingClientRect();
    if (source) createStarFlyer(source);
  }

  if (starDragActive) {
    moveStarFlyer(e.clientX, e.clientY);
    updateStarDropHover(e.clientX, e.clientY);
  }
}

function onStarPointerUp(e) {
  if (!dragStarPay) return;

  if (starDragActive) {
    if (state.stars <= 0) flashStarShortagePlacement();
    else resolveStarDrop(e.clientX, e.clientY, { skipStarFly: true });
    clearStarDrag();
    return;
  }

  clearStarDrag();

  if (!isStarPayDraggable()) return;

  // Star Powers: all HUD star-pay actions require drag (dice taps that spend stars unchanged).
  if (starPowersEnabled()) return;

  if (state.stars <= 0) {
    flashStarShortagePlacement();
    return;
  }

  const flipDieId = selectedStarFlipTrayDieId();
  if (flipDieId != null) {
    tryStarFlipTrayPay(flipDieId);
    return;
  }

  const dieId = selectedStarPayTrayDieId();
  if (dieId == null) return;
  tryStarPayReroll(dieId);
}

export function initStarRerollInput() {
  document.addEventListener('pointerdown', onStarPointerDown);
  document.addEventListener('pointermove', onStarPointerMove);
  document.addEventListener('pointerup', onStarPointerUp);
  document.addEventListener('pointercancel', onStarPointerUp);
}
