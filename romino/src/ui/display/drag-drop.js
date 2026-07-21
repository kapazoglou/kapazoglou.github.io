import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { returnDieToBar, slotFromHintDataset, isBarDieInactive, getValidSlotsForDie, getValidSlotsForDealtTile, isDealtTileInactive, isPlacedDealtTileCol, liftDealtTileForReposition, cancelDealtTileReposition } from '../../logic/row.js';
import { dieSVG, DIE_OUTER, TILE_OUTER_W, TILE_OUTER_H, tileHTML } from '../../logic/dice-visual.js';
import { placeDieWithAnim, placeDealtTileWithAnim } from '../transitions/placement-anim.js';
import { render, renderSelection } from './render.js';
import { syncStarMarkersDuringMotion } from './placement-row.js';
import { renderActionBar } from './action-bar.js';
import { attemptPlacementAtPoint, attemptDealtTilePlacementAtPoint } from './placement-input.js';
import { updateInsertHoverSpread, clearInsertHoverSpread } from '../transitions/placement-hover.js';
import { beginRepositionCollapse, beginColumnRepositionCollapse, clearRepositionCollapse } from '../transitions/reposition-collapse.js';

const DRAG_THRESHOLD = 8;
/** Gap between pointer and bottom edge of drag die (screen px). */
const FINGER_CLEARANCE_PX = 16;

let dragDealtTile = false;
/** @type {number | null} — row column when repositioning a placed dealt tile. */
let dragDealtTileFromCol = null;
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

function createTileDragFlyer(tile, sourceRect) {
  const layer = flyLayer();
  if (!layer) return;
  const pos = screenRectToLayerDesign(sourceRect);
  dragFlyer = document.createElement('div');
  dragFlyer.className = 'placement-die-flyer placement-die-flyer--tile';
  dragFlyer.innerHTML = tileHTML(tile);
  dragFlyer.style.left = `${pos.left}px`;
  dragFlyer.style.top = `${pos.top}px`;
  dragFlyer.style.transform = 'translate(0, 0)';
  dragFlyer.style.transition = 'none';
  layer.appendChild(dragFlyer);
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
  const outerW = dragDealtTile ? TILE_OUTER_W : DIE_OUTER;
  const outerH = dragDealtTile ? TILE_OUTER_H : DIE_OUTER;
  dragFlyer.style.left = `${(clientX - layerRect.left) / scale - outerW / 2}px`;
  dragFlyer.style.top = `${(clientY - layerRect.top) / scale - outerH - clearance}px`;
}

function flyerResolvePoint() {
  if (!dragFlyer) return null;
  const r = dragFlyer.getBoundingClientRect();
  return { x: (r.left + r.right) / 2, y: r.top };
}

function isDragSessionActive() {
  return dragDieId != null || dragDealtTile;
}

function handleDealtTileTap(tileEl) {
  const fromRow = tileEl.closest('.placement-col--tile');
  if (!fromRow && isDealtTileInactive()) return null;
  state.selectedDealtTile = !state.selectedDealtTile;
  state.selectedDieId = null;
  return 'selection';
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
    state.selectedDealtTile = false;
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

  const rowTileEl = e.target.closest('.placement-col--tile .placement-tile--returnable');
  if (rowTileEl && e.button === 0) {
    const colEl = rowTileEl.closest('.placement-col[data-col]');
    const col = Number(colEl?.dataset.col);
    if (!isPlacedDealtTileCol(col)) return;
    dragDealtTile = true;
    dragDealtTileFromCol = col;
    dragDieId = null;
    dragDieEl = rowTileEl;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    isDragging = false;
    rowTileEl.classList.add('placement-tile--drag-pending');
    setDragPending(true);
    capturePointer(e);
    e.preventDefault();
    return;
  }

  const tileEl = e.target.closest('.action-bar-tile-slot .placement-tile[data-dealt-tile]:not(.placement-tile--discarding)');
  if (tileEl && e.button === 0) {
    if (isDealtTileInactive()) return;
    dragDealtTile = true;
    dragDealtTileFromCol = null;
    dragDieId = null;
    dragDieEl = tileEl;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    isDragging = false;
    tileEl.classList.add('placement-tile--drag-pending');
    setDragPending(true);
    capturePointer(e);
    e.preventDefault();
    return;
  }

  const dieEl = e.target.closest('.die--action, .die--placed.die--returnable');
  if (!dieEl || e.button !== 0) return;
  const dieId = Number(dieEl.dataset.dieId);
  if (!dieId && dieId !== 0) return;

  if (dieEl.classList.contains('die--placed')) {
    if (!state.placedDieIds.has(dieId)) return;
  } else if (!state.actionBar.includes(dieId) || isBarDieInactive(dieId)) {
    return;
  }

  dragDealtTile = false;
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
  setDragActive(true);

  const sourceRect = dragDieEl.getBoundingClientRect();

  if (dragDealtTile) {
    dragDieEl.classList.remove('placement-tile--drag-pending');
    state.draggingDealtTile = true;
    if (dragDealtTileFromCol != null) {
      beginColumnRepositionCollapse(dragDealtTileFromCol);
      liftDealtTileForReposition(dragDealtTileFromCol);
      createTileDragFlyer(state.dealtTile, sourceRect);
      render();
    } else {
      createTileDragFlyer(state.dealtTile, sourceRect);
      renderActionBar();
    }
    dragDieEl = null;
    syncStarMarkersDuringMotion();
    return;
  }

  dragDieEl.classList.remove('die--drag-pending');

  state.draggingDieId = dragDieId;

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
  if (!isDragSessionActive()) return;

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
      const validSlots = dragDealtTile
        ? getValidSlotsForDealtTile()
        : getValidSlotsForDie(dragDieId);
      const dieId = dragDealtTile ? null : dragDieId;
      updateInsertHoverSpread(e.clientX, e.clientY, validSlots, dieId);
    }
  }
}

function clearDragVisuals() {
  state.draggingDieId = null;
  state.draggingDealtTile = false;
  clearInsertHoverSpread(false);
  clearRepositionCollapse(false);
  dragFlyer?.remove();
  dragFlyer = null;
  dragDieEl?.classList.remove('die--drag-source', 'die--drag-pending', 'placement-tile--drag-pending');
  setDragPending(false);
  setDragActive(false);
}

function onPointerUp(e) {
  if (!isDragSessionActive()) return;

  if (isDragging) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    let animHandled = false;
    let returnedToBar = false;

    if (dragDealtTile) {
      if (settings.directPlacement) {
        const flyerPt = flyerResolvePoint();
        const stackY = flyerPt?.y ?? e.clientY;
        const result = attemptDealtTilePlacementAtPoint(e.clientX, e.clientY, stackY, dragFlyer);
        if (result === 'placed') {
          dragFlyer = null;
          animHandled = true;
        }
      } else {
        const hint = target?.closest('.placement-hint');
        if (hint) {
          animHandled = placeDealtTileWithAnim(
            slotFromHintDataset(hint.dataset), dragFlyer,
          );
          if (animHandled) dragFlyer = null;
        }
      }
    } else if (
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

    if (!animHandled) {
      if (dragDealtTile && dragDealtTileFromCol != null && state.dealtTile) {
        const tile = { ...state.dealtTile };
        cancelDealtTileReposition(dragDealtTileFromCol, tile);
      }
      clearDragVisuals();
    } else {
      state.draggingDieId = null;
      state.draggingDealtTile = false;
    }

    if (!animHandled) {
      if (returnedToBar || (dragDealtTile && dragDealtTileFromCol != null)) {
        render();
      } else if (
        (dragDieId != null && state.actionBar.includes(dragDieId))
        || (dragDealtTile && dragDealtTileFromCol == null)
      ) {
        // Tray die / dealt tile was hidden from the bar on drag start — restore layout.
        renderActionBar();
      } else {
        requestAnimationFrame(() => renderSelection());
      }
    }
  } else if (dragDieEl) {
    dragDieEl.classList.remove('die--drag-pending', 'placement-tile--drag-pending');
    if (dragDealtTile) {
      const tapResult = handleDealtTileTap(dragDieEl);
      if (tapResult === 'selection') {
        if (dragDealtTileFromCol != null) blockNextRowClick = true;
        renderSelection();
      }
    } else {
      const tapResult = handleDieTap(dragDieEl);
      if (tapResult === 'return') {
        blockNextRowClick = true;
        render();
      } else if (tapResult === 'selection') renderSelection();
    }
  }

  if (capturedPointerId != null) {
    releasePointer();
  }
  dragDieId = null;
  dragDealtTile = false;
  dragDealtTileFromCol = null;
  dragDieEl = null;
  isDragging = false;
  skipNextFlyerMove = false;
  setDragPending(false);
  setDragActive(false);
}
