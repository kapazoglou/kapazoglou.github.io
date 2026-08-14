import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { isOuterDieValue } from '../../logic/dice.js';
import { isBarDieInactive, isAtSpotCap } from '../../logic/row.js';
import { clearDominoChosenPair } from '../../logic/domino-roll.js';
import { renderHUD } from './hud-v2.js';
import { renderPlacementRow, updatePlacementSelection, positionHints, positionEdgeGhosts, positionStarMarkers, restorePinnedRowScroll } from './placement-row.js';
import { renderActionBar, updateActionBarSelection } from './action-bar.js';
import { renderDealtStrip } from './dealt-strip.js';
import { renderDominoSpotStrip, scheduleDominoSpotStripLayout, renderActionBarDeckBadge, renderDominoDiscardPile } from './domino-spot-strip.js';
import { syncAllRowDominoSpots } from '../../logic/domino-spots.js';
import { onRender as onTutorialRender } from './tutorial.js';
import { clearInsertHoverSpread, resetInsertHoverSpread } from '../transitions/placement-hover.js';
import { resetRepositionCollapse } from '../transitions/reposition-collapse.js';

function updateSeparatorSpotCap() {
  const sep = document.querySelector('.separator');
  if (sep) sep.classList.toggle('is-spots-full', isAtSpotCap());
}

function shouldClearSelectedDie(dieId) {
  if (!isBarDieInactive(dieId)) return false;
  if (!settings.rerollOuter || state.phase !== 'rolled') return true;
  const die = state.dice[dieId];
  return !die || !isOuterDieValue(die.value) || !state.actionBar.includes(dieId);
}

export function render() {
  resetInsertHoverSpread();
  resetRepositionCollapse();
  if (state.selectedDieId != null && shouldClearSelectedDie(state.selectedDieId)) {
    state.selectedDieId = null;
    clearDominoChosenPair();
  }
  renderPlacementRow();
  syncAllRowDominoSpots();
  renderDealtStrip();
  renderDominoSpotStrip();
  renderHUD();
  renderActionBar();
  renderActionBarDeckBadge();
  renderDominoDiscardPile();
  updateSeparatorSpotCap();
  requestAnimationFrame(() => {
    restorePinnedRowScroll();
    positionEdgeGhosts();
    positionHints();
    positionStarMarkers();
    scheduleDominoSpotStripLayout();
    onTutorialRender();
  });
}

/** Selection-only refresh — avoids rebuilding tiles when hint arrows appear. */
export function renderSelection() {
  clearInsertHoverSpread(false);
  if (state.selectedDieId != null && shouldClearSelectedDie(state.selectedDieId)) {
    state.selectedDieId = null;
    clearDominoChosenPair();
  }
  updatePlacementSelection();
  updateActionBarSelection();
  syncAllRowDominoSpots();
  renderDealtStrip();
  renderDominoSpotStrip();
  renderDominoDiscardPile();
  requestAnimationFrame(() => {
    positionEdgeGhosts();
    positionHints();
    positionStarMarkers();
    scheduleDominoSpotStripLayout();
  });
}
