import { state } from '../../logic/state.js';
import { isBarDieInactive } from '../../logic/row.js';
import { renderHUD } from './hud-v2.js';
import { renderPlacementRow, updatePlacementSelection, positionHints, positionEdgeGhosts, positionStarMarkers, restorePinnedRowScroll } from './placement-row.js';
import { renderActionBar } from './action-bar.js';
import { clearInsertHoverSpread, resetInsertHoverSpread } from '../transitions/placement-hover.js';
import { resetRepositionCollapse } from '../transitions/reposition-collapse.js';

export function render() {
  resetInsertHoverSpread();
  resetRepositionCollapse();
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
    positionStarMarkers();
  });
}

/** Selection-only refresh — avoids rebuilding tiles when hint arrows appear. */
export function renderSelection() {
  clearInsertHoverSpread(false);
  if (state.selectedDieId != null && isBarDieInactive(state.selectedDieId)) {
    state.selectedDieId = null;
  }
  updatePlacementSelection();
  renderActionBar();
  requestAnimationFrame(() => {
    positionEdgeGhosts();
    positionHints();
    positionStarMarkers();
  });
}
