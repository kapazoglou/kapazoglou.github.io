import { state } from '../../logic/state.js';
import { isDieSelectable } from '../../logic/cards.js';
import { renderGrid } from './grid.js';
import { renderActionBar } from './action-bar.js';
import { renderHUD, renderDiscards } from './hud.js';

export function render() {
  if (state.selectedDieId !== null && !isDieSelectable(state.selectedDieId)) {
    state.selectedDieId = null;
  }
  renderGrid();
  // During game over leave the action bar exactly as it was — the sheet overlays it.
  if (state.phase !== 'replay') renderActionBar();
  renderDiscards();
  renderHUD();
}
