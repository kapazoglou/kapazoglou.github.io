import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { returnDieToBar, slotFromHintDataset, isBarDieInactive } from '../../logic/row.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { placeDieWithAnim } from '../transitions/placement-anim.js';
import { render, renderSelection } from './render.js';
import { syncStarMarkersDuringMotion } from './placement-row.js';
import { renderActionBar } from './action-bar.js';
import { attemptPlacementAtPoint } from './placement-input.js';
import { updateInsertHoverSpread, clearInsertHoverSpread } from '../transitions/placement-hover.js';
import { beginRepositionCollapse, clearRepositionCollapse } from '../transitions/reposition-collapse.js';

const DRAG_THRESHOLD = 8;
/** Gap between pointer and bottom edge of drag die (screen px). */
const FINGER_CLEARANCE_PX = 16;

let dragDieId = null;
let dragDieEl = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
/** @type {HTMLElement | null} — same `.placement-die-flyer` used for commit fly. */
let dragFlyer = null;
let capturedPointerId = null;
let skipNextFlyerMove = false;
/** Swallow the click that follows a return-to-bar tap (would re-place on the row). */
let blockNextRowClick = false;

export function consumeRowClickBlock() {
  const blocked = blockNextRowClick;
  blockNextRowClick = false;
  return blocked;
}

function appEl() {
  return document.getElementById('app');
}

function setDragPending(on) {
  const app = appEl();
  if (!app) return;
  app.classList.toggle('is-die-drag-pending', on);
  app.classList.toggle('is-die-dragging', false);
}

function setDragActive(on) {
  const app = appEl();
  if (!app) return;
  app.classList.toggle('is-die-drag-pending', false);
  app.classList.toggle('is-die-dragging', on);
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

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

function viewportScale() {
  const root = flyLayer();
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function screenRectToLayerDesign(rect) {
  const layer = flyLayer();
  if (!layer) return { left: 0, top: 0 };
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  return {
    left: (rect.left - layerRect.left) / scale,
    top: (rect.top - layerRect.top) / scale,
  };
}

function createDragFlyer(dieId, sourceRect) {
  const layer = flyLayer();
  if (!layer) return;
  const die = state.dice[dieId];
  const pos = screenRectToLayerDesign(sourceRect);
  dragFlyer = document.createElement('div');
  dragFlyer.className = 'placement-die-flyer';
  dragFlyer.innerHTML = dieSVG(die.value, DIE_OUTER);
  dragFlyer.style.left = `${pos.left}px`;
  dragFlyer.style.top = `${pos.top}px`;
  dragFlyer.style.transform = 'translate(0, 0)';
  dragFlyer.style.transition = 'none';
  layer.appendChild(dragFlyer);
}

function moveFlyer(clientX, clientY) {
  if (!dragFlyer) return;
  const layer = flyLayer();
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const clearance = FINGER_CLEARANCE_PX / scale;
  dragFlyer.style.left = `${(clientX - layerRect.left) / scale - DIE_OUTER / 2}px`;
  dragFlyer.style.top = `${(clientY - layerRect.top) / scale - DIE_OUTER - clearance}px`;
}

function flyerResolvePoint() {
  if (!dragFlyer) return null;
  const r = dragFlyer.getBoundingClientRect();
  return { x: (r.left + r.right) / 2, y: r.top };
}

/** @returns {'return' | 'selection' | null} */
function handleDieTap(dieEl) {
  if (dieEl.classList.contains('die--placed')) {
    const dieId = Number(dieEl.dataset.dieId);
    if (!state.placedDieIds.has(dieId)) return null;
    if (returnDieToBar(dieId, true)) {
      state.selectedDieId = dieId;
      return 'return';
    }
    return null;
  }

  if (dieEl.classList.contains('die--action')) {
    const dieId = Number(dieEl.dataset.dieId);
    if (isBarDieInactive(dieId)) return null;
    state.selectedDieId = state.selectedDieId === dieId ? null : dieId;
    return 'selection';
  }

  return null;
}

export function initDragDrop() {
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);
}

function onPointerDown(e) {
  if (state.phase === 'animating' || state.phase === 'replay') return;
  const dieEl = e.target.closest('.die--action, .die--placed.die--returnable');
  if (!dieEl || e.button !== 0) return;
  const dieId = Number(dieEl.dataset.dieId);
  if (!dieId && dieId !== 0) return;

  if (dieEl.classList.contains('die--placed')) {
    if (!state.placedDieIds.has(dieId)) return;
  } else if (!state.actionBar.includes(dieId) || isBarDieInactive(dieId)) {
    return;
  }

  dragDieId = dieId;
  dragDieEl = dieEl;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  isDragging = false;
  dieEl.classList.add('die--drag-pending');
  setDragPending(true);
  capturePointer(e);
  e.preventDefault();
}

function beginDrag(e) {
  if (!dragDieEl) return;

  isDragging = true;
  skipNextFlyerMove = true;
  state.draggingDieId = dragDieId;
  setDragActive(true);
  dragDieEl.classList.remove('die--drag-pending');

  const sourceRect = dragDieEl.getBoundingClientRect();
  const fromBar = state.actionBar.includes(dragDieId);

  createDragFlyer(dragDieId, sourceRect);

  if (fromBar) {
    renderActionBar();
    dragDieEl = null;
  } else {
    dragDieEl.classList.add('die--drag-source');
    beginRepositionCollapse(dragDieId);
  }

  syncStarMarkersDuringMotion();
}

function onPointerMove(e) {
  if (dragDieId == null) return;

  if (!isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    beginDrag(e);
  }

  if (isDragging) {
    if (skipNextFlyerMove) {
      skipNextFlyerMove = false;
    } else {
      moveFlyer(e.clientX, e.clientY);
    }
    if (settings.directPlacement) {
      updateInsertHoverSpread(dragDieId, e.clientX, e.clientY);
    }
  }
}

function clearDragVisuals() {
  state.draggingDieId = null;
  clearInsertHoverSpread(false);
  clearRepositionCollapse(false);
  dragFlyer?.remove();
  dragFlyer = null;
  dragDieEl?.classList.remove('die--drag-source', 'die--drag-pending');
  setDragPending(false);
  setDragActive(false);
}

function onPointerUp(e) {
  if (dragDieId == null) return;

  if (isDragging) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    let animHandled = false;
    let returnedToBar = false;

    if (
      target?.closest('#action-bar, #action-bar-dice')
      && state.placedDieIds.has(dragDieId)
    ) {
      returnedToBar = returnDieToBar(dragDieId);
    } else if (settings.directPlacement) {
      const flyerPt = flyerResolvePoint();
      const stackY = flyerPt?.y ?? e.clientY;
      const result = attemptPlacementAtPoint(
        dragDieId, e.clientX, e.clientY, stackY, dragFlyer,
      );
      if (result === 'placed') {
        dragFlyer = null;
        animHandled = true;
      }
    } else {
      const hint = target?.closest('.placement-hint');
      if (hint) {
        animHandled = placeDieWithAnim(
          dragDieId, slotFromHintDataset(hint.dataset), dragFlyer,
        );
        if (animHandled) dragFlyer = null;
      }
    }

    if (!animHandled) clearDragVisuals();
    else state.draggingDieId = null;

    if (!animHandled) {
      if (returnedToBar) render();
      else requestAnimationFrame(() => renderSelection());
    }
  } else if (dragDieEl) {
    dragDieEl.classList.remove('die--drag-pending');
    const tapResult = handleDieTap(dragDieEl);
    if (tapResult === 'return') {
      blockNextRowClick = true;
      render();
    } else if (tapResult === 'selection') renderSelection();
  }

  if (capturedPointerId != null) {
    releasePointer();
  }
  dragDieId = null;
  dragDieEl = null;
  isDragging = false;
  skipNextFlyerMove = false;
  setDragPending(false);
  setDragActive(false);
}
