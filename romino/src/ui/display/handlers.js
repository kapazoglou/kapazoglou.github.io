import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { returnDieToBar, getValidSlotsForDie, getValidSlotsForDealtTile, slotFromHintDataset } from '../../logic/row.js';
import { handleRollButton } from '../../logic/turn.js';
import { showGameOver } from './game-over.js';
import { placeDieWithAnim, placeDealtTileWithAnim } from '../transitions/placement-anim.js';
import { render, renderSelection } from './render.js';
import { attemptPlacementAtPoint, attemptDealtTilePlacementAtPoint } from './placement-input.js';
import { consumeRowClickBlock } from './drag-drop.js';

export function initHandlers() {
  document.getElementById('app').addEventListener('click', e => {
    if (state.phase === 'animating' || state.phase === 'replay') return;

    const rollBtn = e.target.closest('#roll-btn');
    if (rollBtn && !rollBtn.disabled) {
      if (handleRollButton(() => { showGameOver(); render(); })) render();
      return;
    }

    /* Dealt tile tap/drag — drag-drop.js pointer handlers (not click; preventDefault on pointerdown). */
    if (settings.directPlacement) {
      if (consumeRowClickBlock()) return;

      if (e.target.closest('#placement-row') && !e.target.closest('.die--placed, .placement-tile--returnable')) {
        if (state.selectedDealtTile) {
          const result = attemptDealtTilePlacementAtPoint(e.clientX, e.clientY);
          if (result === 'placed' || result === 'invalid') return;
        }
        if (state.selectedDieId != null) {
          const result = attemptPlacementAtPoint(state.selectedDieId, e.clientX, e.clientY);
          if (result === 'placed' || result === 'invalid') return;
        }
        state.selectedDieId = null;
        state.selectedDealtTile = false;
        renderSelection();
        return;
      }
      return;
    }

    const hint = e.target.closest('.placement-hint');
    if (hint && state.selectedDealtTile) {
      placeDealtTileWithAnim(slotFromHintDataset(hint.dataset));
      return;
    }
    if (hint && state.selectedDieId != null) {
      placeDieWithAnim(state.selectedDieId, slotFromHintDataset(hint.dataset));
      return;
    }

    const ghostEdge = e.target.closest('.placement-col--ghost-edge');
    if (ghostEdge && state.selectedDealtTile) {
      const edge = ghostEdge.dataset.edge;
      const slot = getValidSlotsForDealtTile().find(
        s => s.kind === 'insert' && (edge === 'left' ? s.leftCol === null : s.rightCol === null),
      );
      if (slot) {
        placeDealtTileWithAnim(slot);
        return;
      }
    }
    if (ghostEdge && state.selectedDieId != null) {
      const edge = ghostEdge.dataset.edge;
      const slot = getValidSlotsForDie(state.selectedDieId).find(
        s => s.kind === 'insert' && (edge === 'left' ? s.leftCol === null : s.rightCol === null),
      );
      if (slot) {
        placeDieWithAnim(state.selectedDieId, slot);
        return;
      }
    }

    const ghostFirst = e.target.closest('.placement-col--ghost-first');
    if (ghostFirst && state.selectedDealtTile) {
      const slot = getValidSlotsForDealtTile().find(s => s.kind === 'new-column');
      if (slot) {
        placeDealtTileWithAnim(slot);
        return;
      }
    }
    if (ghostFirst && state.selectedDieId != null) {
      const slot = getValidSlotsForDie(state.selectedDieId).find(s => s.kind === 'new-column');
      if (slot) {
        placeDieWithAnim(state.selectedDieId, slot);
        return;
      }
    }

    if (e.target.closest('#placement-row') && !e.target.closest('.die--placed, .placement-tile--returnable')) {
      state.selectedDieId = null;
      state.selectedDealtTile = false;
      renderSelection();
    }
  });
}
