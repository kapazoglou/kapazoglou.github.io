import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { starSVG } from '../../logic/dice-visual.js';
import { selectedOuterTrayDieId, tryRerollOuterPay } from '../transitions/reroll-outer-anim.js';
import { flashStarShortagePlacement } from '../transitions/invalid-flash.js';
import { showGameOver } from './game-over.js';
import { render } from './render.js';

const DRAG_THRESHOLD = 8;
const HUD_STAR_PX = 32;

let dragStarPay = false;
let starDragActive = false;
let starDragMoved = false;
let starFlyer = null;
let hoverDieEl = null;
let dragStartX = 0;
let dragStartY = 0;
let capturedPointerId = null;

function onGameOver(reason) {
  showGameOver(reason);
  render();
}

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

function viewportScale() {
  const root = flyLayer();
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function isStarPayDraggable() {
  return settings.rerollOuter && state.phase === 'rolled' && state.stars > 0;
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
  if (hoverDieEl) {
    const id = Number(hoverDieEl.dataset.dieId);
    if (state.selectedDieId !== id) {
      hoverDieEl.classList.remove('die--action-selected');
    }
  }
  hoverDieEl = null;
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
  const el = document.elementFromPoint(clientX, clientY)?.closest('.die--action.die--rerollable');
  if (!el) return null;
  const dieId = Number(el.dataset.dieId);
  if (Number.isNaN(dieId)) return null;
  return { el, dieId };
}

function updateStarDropHover(clientX, clientY) {
  const target = trayRerollTargetAt(clientX, clientY);
  const nextEl = target?.el ?? null;
  if (nextEl === hoverDieEl) return;
  clearHoverTarget();
  hoverDieEl = nextEl;
  hoverDieEl?.classList.add('die--action-selected');
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
      else tryRerollOuterPay(target.dieId, onGameOver);
    }
    clearStarDrag();
    return;
  }

  clearStarDrag();

  if (!settings.rerollOuter || state.phase !== 'rolled') return;

  const dieId = selectedOuterTrayDieId();
  if (dieId == null) return;
  if (state.stars <= 0) {
    flashStarShortagePlacement();
    return;
  }
  tryRerollOuterPay(dieId, onGameOver);
}

export function initStarRerollInput() {
  document.addEventListener('pointerdown', onStarPointerDown);
  document.addEventListener('pointermove', onStarPointerMove);
  document.addEventListener('pointerup', onStarPointerUp);
  document.addEventListener('pointercancel', onStarPointerUp);
}
