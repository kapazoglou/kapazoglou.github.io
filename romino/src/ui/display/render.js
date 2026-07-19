import { state } from '../../logic/state.js';
import { isBarDieInactive } from '../../logic/row.js';
import { renderHUD } from './hud-v2.js';
import { renderPlacementRow, updatePlacementSelection, positionHints, positionEdgeGhosts, restorePinnedRowScroll } from './placement-row.js';
import { renderActionBar } from './action-bar.js';

export function render() {
  if (state.selectedDieId != null && isBarDieInactive(state.selectedDieId)) {
    state.selectedDieId = null;
  }
  renderPlacementRow();
  renderHUD();
  renderActionBar();
  requestAnimationFrame(() => {
    restorePinnedRowScroll();
    positionEdgeGhosts();
    positionHints();
  });
}

/** Selection-only refresh — avoids rebuilding tiles when hint arrows appear. */
export function renderSelection() {
  if (state.selectedDieId != null && isBarDieInactive(state.selectedDieId)) {
    state.selectedDieId = null;
  }
  updatePlacementSelection();
  renderActionBar();
  requestAnimationFrame(() => {
    positionEdgeGhosts();
    positionHints();
  });
}
