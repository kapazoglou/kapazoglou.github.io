import { state } from '../../logic/state.js';
import { isBarDieInactive, isDealtTileInactive, isAtSpotCap } from '../../logic/row.js';
import { renderHUD } from './hud-v2.js';
import { renderPlacementRow, updatePlacementSelection, positionHints, positionEdgeGhosts, positionStarMarkers, restorePinnedRowScroll } from './placement-row.js';
import { renderActionBar, updateActionBarSelection } from './action-bar.js';
import { clearInsertHoverSpread, resetInsertHoverSpread } from '../transitions/placement-hover.js';
import { resetRepositionCollapse } from '../transitions/reposition-collapse.js';

function updateSeparatorSpotCap() {
  const sep = document.querySelector('.separator');
  if (sep) sep.classList.toggle('is-spots-full', isAtSpotCap());
}

export function render() {
  resetInsertHoverSpread();
  resetRepositionCollapse();
  if (state.selectedDieId != null && isBarDieInactive(state.selectedDieId)) {
    state.selectedDieId = null;
  }
  if (state.selectedDealtTile && isDealtTileInactive()) {
    state.selectedDealtTile = false;
  }
  renderPlacementRow();
  renderHUD();
  renderActionBar();
  updateSeparatorSpotCap();
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
  if (state.selectedDealtTile && isDealtTileInactive()) {
    state.selectedDealtTile = false;
  }
  updatePlacementSelection();
  updateActionBarSelection();
  requestAnimationFrame(() => {
    positionEdgeGhosts();
    positionHints();
    positionStarMarkers();
  });
}
