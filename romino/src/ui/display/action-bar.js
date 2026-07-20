import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { dieSVG, rollButtonFaceSVG, DIE_OUTER, dieFaceBorderColor } from '../../logic/dice-visual.js';
import { canRoll, canConfirm, canEndGame } from '../../logic/turn.js';
import { countDiceInRow, isBarDieInactive } from '../../logic/row.js';

export function renderActionBar() {
  const bar = document.getElementById('action-bar');
  if (!bar) return;

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
    <div class="action-bar-dice" id="action-bar-dice">${diceHTML}</div>
    <div class="roll-btn-wrap${confirm ? ' roll-btn-wrap--confirm' : ''}">
      <div class="roll-btn-face" aria-hidden="true">${rollButtonFaceSVG(DIE_OUTER)}</div>
      <button type="button" class="roll-btn${rollLow ? ' roll-btn--low' : ''}" id="roll-btn" ${rollDisabled ? 'disabled' : ''} aria-label="${confirm ? 'Confirm placement' : 'Roll dice'}">${rollLabel}</button>
    </div>
  `;
}
