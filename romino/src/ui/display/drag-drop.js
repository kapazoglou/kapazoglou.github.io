import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { slotFromHintDataset, isBarDieInactive, getValidSlotsForDie, isReturnablePlacedDie, isSwapRefundableDie, findDieColumn, slotsEqual } from '../../logic/row.js';
import { returnDieToBarWithStarRefund } from '../transitions/star-refund-anim.js';
import {
  setDominoChosenPairFromDie,
  clearDominoChosenPair,
  isDominoPairLocked,
  isDominoQuadRollActive,
  onDominoDieReturnedToTray,
  syncDominoTrayIdleUnlock,
} from '../../logic/domino-roll.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { placeDieWithAnim } from '../transitions/placement-anim.js';
import { render, renderSelection } from './render.js';
import {
  syncStarMarkersDuringMotion,
  resolveNearestValidSlot,
  slotAnchorXY,
  syncPushBelowTargets,
  isPointerOnPlacementRow,
} from './placement-row.js';
import { renderActionBar } from './action-bar.js';
import { attemptPlacementAtPoint, attemptPushBelowOnBottomDie } from './placement-input.js';
import { updateInsertHoverSpread, clearInsertHoverSpread } from '../transitions/placement-hover.js';
import { beginRepositionCollapse, clearRepositionCollapse, beginPushReturnCollapse, clearPushReturnCollapse } from '../transitions/reposition-collapse.js';
import { tryRefundSwapStack } from '../transitions/stack-swap-anim.js';
import { playSfx } from '../transitions/sfx.js';

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
/** @type {import('../../logic/row.js').Slot | null} */
let activeSnapSlot = null;
/** @type {HTMLElement | null} */
let snapGhostEl = null;
/** Last slot that triggered `snap_tick` — reset when ghost hides. */
let lastSnapTickSlot = null;

function snappingActive() {
  return settings.snapping && settings.directPlacement;
}

/** Rect hit-test on the dice tray only — not roll-btn padding (flyer/ghost must not block). */
function isPointerOnDiceTray(clientX, clientY) {
  const tray = document.getElementById('action-bar-dice');
  if (!tray) return false;
  const r = tray.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right
    && clientY >= r.top && clientY <= r.bottom;
}

/** Action-bar band above roll button — tray + top padding (row→tray drops only). */
function isActionBarTrayBand(clientX, clientY) {
  const bar = document.getElementById('action-bar');
  if (!bar) return false;
  const barRect = bar.getBoundingClientRect();
  if (clientX < barRect.left || clientX > barRect.right
    || clientY < barRect.top || clientY > barRect.bottom) {
    return false;
  }
  const rollWrap = bar.querySelector('.roll-btn-wrap');
  if (!rollWrap) return isPointerOnDiceTray(clientX, clientY);
  const rollTop = rollWrap.getBoundingClientRect().top;
  return clientY < rollTop;
}

/**
 * Row → tray return hit-test — pointer and/or drag flyer (flyer sits above finger).
 * Domino Spots discard pile sits below the roll button in the cancel zone; the flyer
 * often overlaps the tray while the finger does not.
 */
function isRowReturnDrop(clientX, clientY) {
  if (isPointerOnDiceTray(clientX, clientY)) return true;
  if (!isPointerOnPlacementRow(clientX, clientY) && isActionBarTrayBand(clientX, clientY)) {
    return true;
  }
  const pt = flyerResolvePoint();
  if (!pt) return false;
  if (isPointerOnDiceTray(pt.x, pt.y)) return true;
  return isActionBarTrayBand(pt.x, pt.y);
}

/** Placed die → tray: row band below placement row through action bar (incl. discard pile). */
function isPlacedDieReturnBand(clientX, clientY) {
  const rowEl = document.getElementById('placement-row');
  const bar = document.getElementById('action-bar');
  if (!rowEl || !bar) return false;
  const rowRect = rowEl.getBoundingClientRect();
  const barRect = bar.getBoundingClientRect();
  if (clientY <= rowRect.bottom) return false;
  if (clientY > barRect.bottom) return false;
  if (clientX < barRect.left || clientX > barRect.right) return false;
  return true;
}

/** Placed die row→tray — tray band, discard pile, or flyer over either. */
function isPlacedDieReturnDrop(clientX, clientY) {
  if (isRowReturnDrop(clientX, clientY)) return true;
  if (isPlacedDieReturnBand(clientX, clientY)) return true;
  const pt = flyerResolvePoint();
  if (!pt) return false;
  if (isRowReturnDrop(pt.x, pt.y)) return true;
  return isPlacedDieReturnBand(pt.x, pt.y);
}

/** Below the row and not on the dice tray — cancel drag (no snap commit, no return). */
function isDropCancelZone(clientX, clientY, { allowPlacedReturn = false } = {}) {
  if (allowPlacedReturn && isPlacedDieReturnDrop(clientX, clientY)) return false;
  return !isPointerOnPlacementRow(clientX, clientY)
    && !isPointerOnDiceTray(clientX, clientY);
}

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
  syncDragPreviewVisibility();
}

/** Snapping ON — show snap ghost only; hide pointer flyer while ghost has a slot. */
function syncDragPreviewVisibility() {
  if (!dragFlyer || !snappingActive()) return;
  dragFlyer.style.visibility = activeSnapSlot ? 'hidden' : '';
}

function createSnapGhost(dieId) {
  const layer = flyLayer();
  if (!layer) return;
  const die = state.dice[dieId];
  snapGhostEl = document.createElement('div');
  snapGhostEl.className = 'placement-snap-ghost';
  snapGhostEl.innerHTML = dieSVG(die.value, DIE_OUTER);
  snapGhostEl.style.display = 'none';
  layer.appendChild(snapGhostEl);
}

function updateSnapGhost(slot) {
  state.snapGhostSlot = slot ?? null;
  if (!snapGhostEl) return;
  snapGhostEl.classList.toggle('placement-snap-ghost--push-below', slot?.kind === 'stack-below');
  if (!slot) {
    snapGhostEl.style.display = 'none';
    lastSnapTickSlot = null;
    syncDragPreviewVisibility();
    return;
  }
  const pos = slotAnchorXY(slot, dragDieId);
  if (!pos) {
    snapGhostEl.style.display = 'none';
    lastSnapTickSlot = null;
    syncDragPreviewVisibility();
    return;
  }
  const wasHidden = snapGhostEl.style.display === 'none';
  const slotChanged = !lastSnapTickSlot || !slotsEqual(lastSnapTickSlot, slot);
  snapGhostEl.style.display = '';
  snapGhostEl.style.left = `${pos.left}px`;
  snapGhostEl.style.top = `${pos.top}px`;
  if (wasHidden || slotChanged) {
    playSfx('snap_tick');
    lastSnapTickSlot = slot;
  }
  syncDragPreviewVisibility();
}

function clearSnapGhost() {
  state.snapGhostSlot = null;
  snapGhostEl?.remove();
  snapGhostEl = null;
  activeSnapSlot = null;
  lastSnapTickSlot = null;
  syncPushBelowTargets();
}

function takeSnapGhostForCommit() {
  if (!snapGhostEl || snapGhostEl.style.display === 'none') return null;
  const el = snapGhostEl;
  snapGhostEl = null;
  state.snapGhostSlot = null;
  activeSnapSlot = null;
  return el;
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

function isDragSessionActive() {
  return dragDieId != null;
}

/** @returns {'return' | 'refund-swap' | 'push-below' | 'push-invalid' | 'selection' | null} */
function handleDieTap(dieEl) {
  if (dieEl.classList.contains('die--placed')) {
    const dieId = Number(dieEl.dataset.dieId);
    if (!state.placedDieIds.has(dieId)) return null;

    if (
      isSwapRefundableDie(dieId)
      && !isReturnablePlacedDie(dieId)
    ) {
      const loc = findDieColumn(dieId);
      if (loc && tryRefundSwapStack(loc.col)) return 'refund-swap';
    }

    if (isReturnablePlacedDie(dieId)) {
      if (returnDieToBarWithStarRefund(dieId, !isDominoQuadRollActive())) {
        if (isDominoQuadRollActive()) onDominoDieReturnedToTray(dieId);
        else state.selectedDieId = dieId;
        return 'return';
      }
    }

    if (
      state.selectedDieId != null
      && state.actionBar.includes(state.selectedDieId)
      && state.phase === 'rolled'
    ) {
      const pushResult = attemptPushBelowOnBottomDie(state.selectedDieId, dieEl);
      if (pushResult === 'placed') return 'push-below';
      if (pushResult === 'invalid') return 'push-invalid';
    }

    return null;
  }

  if (dieEl.classList.contains('die--action')) {
    const dieId = Number(dieEl.dataset.dieId);
    if (isDominoPairLocked(dieId)) return null;
    if (isBarDieInactive(dieId) && !dieEl.classList.contains('die--rerollable')) return null;
    if (state.selectedDieId === dieId) {
      state.selectedDieId = null;
      clearDominoChosenPair();
      syncDominoTrayIdleUnlock();
    } else {
      state.selectedDieId = dieId;
      setDominoChosenPairFromDie(dieId);
    }
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

  const dieEl = e.target.closest('.die--action, .die--placed.die--returnable, .die--placed.die--swap-refundable');
  if (!dieEl || e.button !== 0) return;
  const dieId = Number(dieEl.dataset.dieId);
  if (!dieId && dieId !== 0) return;

  if (dieEl.classList.contains('die--placed')) {
    if (!state.placedDieIds.has(dieId)) return;
  } else if (!state.actionBar.includes(dieId)) {
    return;
  } else if (isDominoPairLocked(dieId)) {
    return;
  } else if (isBarDieInactive(dieId) && !dieEl.classList.contains('die--rerollable')) {
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
  if (dragDieId != null && state.actionBar.includes(dragDieId) && isBarDieInactive(dragDieId)) return;

  isDragging = true;
  skipNextFlyerMove = true;
  setDragActive(true);

  const sourceRect = dragDieEl.getBoundingClientRect();

  dragDieEl.classList.remove('die--drag-pending');

  state.draggingDieId = dragDieId;

  const fromBar = state.actionBar.includes(dragDieId);

  setDominoChosenPairFromDie(dragDieId);

  createDragFlyer(dragDieId, sourceRect);

  if (snappingActive()) {
    createSnapGhost(dragDieId);
  }

  if (fromBar) {
    renderActionBar();
    renderSelection();
    dragDieEl = null;
  } else {
    dragDieEl.classList.add('die--drag-source');
    beginRepositionCollapse(dragDieId);
    beginPushReturnCollapse(dragDieId);
  }

  syncStarMarkersDuringMotion();
  playSfx('dice_pickup');
}

function onPointerMove(e) {
  if (!isDragSessionActive()) return;

  if (!isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (dragDieId != null && state.actionBar.includes(dragDieId) && isBarDieInactive(dragDieId)) return;
    beginDrag(e);
  }

  if (isDragging) {
    if (skipNextFlyerMove) {
      skipNextFlyerMove = false;
    } else {
      moveFlyer(e.clientX, e.clientY);
    }
    if (settings.directPlacement) {
      const validSlots = getValidSlotsForDie(dragDieId);
      const returningPlaced = state.placedDieIds.has(dragDieId);
      if (isDropCancelZone(e.clientX, e.clientY, { allowPlacedReturn: returningPlaced })) {
        activeSnapSlot = null;
        updateSnapGhost(null);
        clearInsertHoverSpread(false);
      } else if (snappingActive()) {
        const stackY = flyerResolvePoint()?.y ?? e.clientY;
        activeSnapSlot = resolveNearestValidSlot(
          e.clientX, e.clientY, stackY, validSlots, dragDieId,
        );
        updateSnapGhost(activeSnapSlot);
        syncPushBelowTargets();
        updateInsertHoverSpread(e.clientX, e.clientY, validSlots, dragDieId, activeSnapSlot);
      } else {
        updateInsertHoverSpread(e.clientX, e.clientY, validSlots, dragDieId);
      }
    }
  }
}

function clearDragVisuals() {
  state.draggingDieId = null;
  clearInsertHoverSpread(false);
  clearRepositionCollapse(false);
  clearPushReturnCollapse();
  clearSnapGhost();
  dragFlyer?.remove();
  dragFlyer = null;
  dragDieEl?.classList.remove('die--drag-source', 'die--drag-pending');
  setDragPending(false);
  setDragActive(false);
}

function onPointerUp(e) {
  if (!isDragSessionActive()) return;
  try {
    resolveDrop(e);
  } catch (err) {
    console.error('[drag-drop] drop failed', err);
    if (state.phase === 'animating') state.phase = 'rolled';
    clearDragVisuals();
    render();
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

function resolveDrop(e) {
  if (isDragging) {
    let animHandled = false;
    let returnedToBar = false;
    const returningPlaced = state.placedDieIds.has(dragDieId);
    const cancelDrop = isDropCancelZone(e.clientX, e.clientY, { allowPlacedReturn: returningPlaced });

    if (returningPlaced && isPlacedDieReturnDrop(e.clientX, e.clientY)) {
      // Clear before render — buildDiceTrayHTML hides state.draggingDieId.
      state.draggingDieId = null;
      returnedToBar = returnDieToBarWithStarRefund(dragDieId);
      if (returnedToBar) onDominoDieReturnedToTray(dragDieId);
    } else if (settings.directPlacement && !cancelDrop) {
      if (snappingActive()) {
        const validSlots = getValidSlotsForDie(dragDieId);
        const flyerPt = flyerResolvePoint();
        const stackY = flyerPt?.y ?? e.clientY;
        // Re-resolve at release — never commit a stale ghost from the last move frame.
        const commitSlot = resolveNearestValidSlot(
          e.clientX, e.clientY, stackY, validSlots, dragDieId,
        );
        if (commitSlot) {
          updateSnapGhost(commitSlot);
          const snapHandoff = takeSnapGhostForCommit();
          dragFlyer?.remove();
          dragFlyer = null;
          animHandled = placeDieWithAnim(dragDieId, commitSlot, snapHandoff);
          if (animHandled) {
            dragFlyer = null;
          } else {
            snapHandoff?.remove();
          }
          clearSnapGhost();
        }
      } else {
        const flyerPt = flyerResolvePoint();
        const stackY = flyerPt?.y ?? e.clientY;
        const result = attemptPlacementAtPoint(
          dragDieId, e.clientX, e.clientY, stackY, dragFlyer,
          { suppressInvalidFlash: returningPlaced },
        );
        if (result === 'placed') {
          dragFlyer = null;
          animHandled = true;
        }
      }
    } else if (settings.directPlacement && cancelDrop) {
      clearSnapGhost();
    } else if (!cancelDrop) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const hint = target?.closest('.placement-hint');
      if (hint) {
        animHandled = placeDieWithAnim(
          dragDieId, slotFromHintDataset(hint.dataset), dragFlyer,
        );
        if (animHandled) dragFlyer = null;
      }
    }

    if (!animHandled) {
      clearDragVisuals();
    }

    if (!animHandled) {
      if (returnedToBar) {
        playSfx('dice_return');
        /* render handled in returnDieToBarWithStarRefund */
        dragFlyer?.remove();
        dragFlyer = null;
      } else if (dragDieId != null && state.actionBar.includes(dragDieId)) {
        playSfx('dice_cancel');
        syncDominoTrayIdleUnlock();
        renderActionBar();
      } else if (dragDieId != null && state.placedDieIds.has(dragDieId)) {
        // Full row rebuild — selection-only refresh leaves reposition collapse /
        // die--drag-source chrome and the die can vanish while still in state.
        render();
      } else {
        requestAnimationFrame(() => renderSelection());
      }
    }
  } else if (dragDieEl) {
    dragDieEl.classList.remove('die--drag-pending');
    const tapResult = handleDieTap(dragDieEl);
    if (tapResult === 'return' || tapResult === 'refund-swap' || tapResult === 'push-below' || tapResult === 'push-invalid') {
      blockNextRowClick = true;
      if (tapResult === 'return') playSfx('dice_return');
      if (tapResult === 'refund-swap') render();
    } else if (tapResult === 'selection') {
      playSfx('dice_select');
      renderSelection();
    }
  }
}
