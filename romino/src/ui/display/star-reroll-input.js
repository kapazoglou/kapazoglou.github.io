import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { canShowDominoPairReroll } from '../../logic/domino-roll.js';
import { starSVG } from '../../logic/dice-visual.js';
import { selectedOuterTrayDieId, tryRerollOuterPay } from '../transitions/reroll-outer-anim.js';
import { canDominoPairStarReroll, tryDominoPairStarReroll } from '../transitions/domino-reroll-anim.js';
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

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

function viewportScale() {
  const root = flyLayer();
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function isStarPayDraggable() {
  if (state.phase !== 'rolled' || state.stars <= 0) return false;
  return settings.rerollOuter || canShowDominoPairReroll();
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

function tryStarPayReroll(dieId) {
  if (canDominoPairStarReroll(dieId)) return tryDominoPairStarReroll(dieId);
  return tryRerollOuterPay(dieId);
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
  const layer = flyLayer();
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
  const layer = flyLayer();
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  starFlyer.style.left = `${(clientX - layerRect.left) / scale - HUD_STAR_PX / 2}px`;
  starFlyer.style.top = `${(clientY - layerRect.top) / scale - HUD_STAR_PX / 2}px`;
}

function trayRerollTargetAt(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY)?.closest(
    '.die--action.die--domino-rerollable, .die--action.die--rerollable',
  );
  if (!el) return null;
  const dieId = Number(el.dataset.dieId);
  if (Number.isNaN(dieId)) return null;
  return { el, dieId };
}

function updateStarDropHover(clientX, clientY) {
  const target = trayRerollTargetAt(clientX, clientY);
  const nextEls = target && canDominoPairStarReroll(target.dieId)
    ? dominoPairHoverEls()
    : (target ? [target.el] : []);
  if (nextEls.length === hoverDieEls.length
    && nextEls.every((el, i) => el === hoverDieEls[i])) {
    return;
  }
  clearHoverTarget();
  hoverDieEls = nextEls;
  for (const el of hoverDieEls) {
    el.classList.add('die--action-selected');
  }
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
    const target = trayRerollTargetAt(e.clientX, e.clientY);
    if (target) {
      if (state.stars <= 0) flashStarShortagePlacement();
      else tryStarPayReroll(target.dieId);
    }
    clearStarDrag();
    return;
  }

  clearStarDrag();

  if (!isStarPayDraggable()) return;

  const dieId = selectedStarPayTrayDieId();
  if (dieId == null) return;
  if (state.stars <= 0) {
    flashStarShortagePlacement();
    return;
  }
  tryStarPayReroll(dieId);
}

export function initStarRerollInput() {
  document.addEventListener('pointerdown', onStarPointerDown);
  document.addEventListener('pointermove', onStarPointerMove);
  document.addEventListener('pointerup', onStarPointerUp);
  document.addEventListener('pointercancel', onStarPointerUp);
}
