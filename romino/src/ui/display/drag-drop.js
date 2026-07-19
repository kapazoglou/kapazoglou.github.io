import { state } from '../../logic/state.js';
import { returnDieToBar, slotFromHintDataset, isBarDieInactive } from '../../logic/row.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { placeDieWithAnim } from '../transitions/placement-anim.js';
import { render, renderSelection } from './render.js';

const DRAG_THRESHOLD = 8;

let dragDieId = null;
let dragDieEl = null;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let dragGhost = null;

/** @returns {'row' | 'selection' | null} */
function handleDieTap(dieEl) {
  if (dieEl.classList.contains('die--placed')) {
    const dieId = Number(dieEl.dataset.dieId);
    if (state.placedDieIds.has(dieId)) {
      return returnDieToBar(dieId) ? 'row' : null;
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
  dragGhost = document.getElementById('drag-ghost');

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);
}

function onPointerDown(e) {
  if (state.phase === 'animating') return;
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
}

function beginDrag(e) {
  isDragging = true;
  state.selectedDieId = dragDieId;
  const die = state.dice[dragDieId];
  dragGhost.innerHTML = dieSVG(die.value, DIE_OUTER);
  dragGhost.style.display = 'block';
  dragGhost.style.width = `${DIE_OUTER}px`;
  dragGhost.style.height = `${DIE_OUTER}px`;
  moveGhost(e.clientX, e.clientY);
  dragDieEl?.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e) {
  if (dragDieId == null) return;

  if (!isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    beginDrag(e);
  }

  moveGhost(e.clientX, e.clientY);
}

function onPointerUp(e) {
  if (dragDieId == null) return;

  if (isDragging) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const hint = target?.closest('.placement-hint');
    let animHandled = false;
    let returnedToBar = false;
    if (hint) {
      dragGhost.style.display = 'none';
      dragGhost.innerHTML = '';
      animHandled = placeDieWithAnim(dragDieId, slotFromHintDataset(hint.dataset));
    } else if (
      target?.closest('#action-bar, #action-bar-dice')
      && state.placedDieIds.has(dragDieId)
    ) {
      returnedToBar = returnDieToBar(dragDieId);
    }

    if (!animHandled) {
      dragGhost.style.display = 'none';
      dragGhost.innerHTML = '';
      if (returnedToBar) render();
      else renderSelection();
    }
  } else if (dragDieEl) {
    const tapResult = handleDieTap(dragDieEl);
    if (tapResult === 'row') render();
    else if (tapResult === 'selection') renderSelection();
  }

  dragDieEl?.releasePointerCapture?.(e.pointerId);
  dragDieId = null;
  dragDieEl = null;
  isDragging = false;
}

function moveGhost(x, y) {
  dragGhost.style.left = `${x - 20}px`;
  dragGhost.style.top = `${y - 20}px`;
}
