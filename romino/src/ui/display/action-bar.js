import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { dieSVG, rollButtonFaceSVG, DIE_OUTER, dieFaceBorderColor, tileHTML } from '../../logic/dice-visual.js';
import { canRoll, canConfirm, canEndGame } from '../../logic/turn.js';
import { countDiceInRow, isBarDieInactive, isDealtTileInactive } from '../../logic/row.js';

function dealtTileHTML(tile, { discarding = false, selected = false, isNew = false, inactive = false } = {}) {
  const classExtra = [
    discarding ? 'placement-tile--discarding' : '',
    discarding ? 'placement-tile--sweep-pending' : '',
    inactive ? 'placement-tile--inactive' : '',
    selected ? 'placement-tile--selected' : '',
  ].filter(Boolean).join(' ');
  return tileHTML(tile, { classExtra, isNew, attrs: ' data-dealt-tile="1"' });
}

/** Sync tray dice + dealt tile selection chrome without rebuilding the bar. */
export function updateActionBarSelection() {
  const bar = document.getElementById('action-bar');
  if (!bar) return;

  bar.querySelectorAll('.die--action').forEach(el => {
    const id = Number(el.dataset.dieId);
    const inactive = isBarDieInactive(id);
    el.classList.toggle('die--action-inactive', inactive);
    const sel = !inactive && state.selectedDieId === id && state.draggingDieId !== id;
    el.classList.toggle('die--action-selected', sel);
  });

  const tile = bar.querySelector('.action-bar-tile-slot .placement-tile[data-dealt-tile]:not(.placement-tile--discarding)');
  if (tile) {
    const inactive = isDealtTileInactive();
    tile.classList.toggle('placement-tile--inactive', inactive);
    tile.classList.toggle('placement-tile--selected', !inactive && state.selectedDealtTile);
  }
}

export function renderActionBar() {
  const bar = document.getElementById('action-bar');
  if (!bar) return;

  let dealtTileSlot = '';
  if (state.dealingDiscardTile) {
    dealtTileSlot = dealtTileHTML(state.dealingDiscardTile, { discarding: true });
  } else if (state.dealtTile && !state.draggingDealtTile) {
    const inactive = isDealtTileInactive();
    dealtTileSlot = dealtTileHTML(state.dealtTile, {
      inactive,
      selected: !inactive && state.selectedDealtTile,
      isNew: state.newDealtTile,
    });
  }
  state.newDealtTile = false;

  const diceHTML = state.actionBar
    .filter(id => id !== state.draggingDieId)
    .map((id, idx) => {
    const die = state.dice[id];
    const inactive = isBarDieInactive(id);
    const sel = !inactive && state.selectedDieId === id;
    const isNew = state.newTrayDieIds?.has(id);
    const styles = [`--die-border-fill:${dieFaceBorderColor(die.value)}`];
    if (isNew) styles.push(`animation-delay:${idx * 60}ms`);
    const styleAttr = ` style="${styles.join(';')}"`;
    return `<div class="die die--action${inactive ? ' die--action-inactive' : ''}${sel ? ' die--action-selected' : ''}${isNew ? ' is-new' : ''}" data-die-id="${id}"${styleAttr}>${dieSVG(die.value, DIE_OUTER)}</div>`;
  }).join('');

  state.newTrayDieIds?.clear();

  const confirm = canConfirm();
  const rollDisabled = !canRoll() && !confirm && !canEndGame();
  const rollLabel = settings.nDice - countDiceInRow();
  const rollLow = rollLabel < settings.nRoll;

  bar.innerHTML = `
    ${dealtTileSlot ? `<div class="action-bar-tile-slot">${dealtTileSlot}</div>` : ''}
    <div class="action-bar-dice" id="action-bar-dice">${diceHTML}</div>
    <div class="roll-btn-wrap${confirm ? ' roll-btn-wrap--confirm' : ''}">
      <div class="roll-btn-face" aria-hidden="true">${rollButtonFaceSVG(DIE_OUTER)}</div>
      <button type="button" class="roll-btn${rollLow ? ' roll-btn--low' : ''}" id="roll-btn" ${rollDisabled ? 'disabled' : ''} aria-label="${confirm ? 'Confirm placement' : 'Roll dice'}">${rollLabel}</button>
    </div>
  `;
}
