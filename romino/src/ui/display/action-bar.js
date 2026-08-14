import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { dieSVG, rollButtonFaceSVG, DIE_OUTER, dieFaceBorderColor } from '../../logic/dice-visual.js';
import { canRoll, canConfirm, canEndGame, isRollPoolLow, isRollButtonWarningRedBorder, rollAffordanceRemaining, isDominoSpotAssignmentBlocked } from '../../logic/turn.js';
import { isBarDieInactive, isTrayStuck, rowHasThreeDiceStack } from '../../logic/row.js';
import { isOuterDieValue } from '../../logic/dice.js';
import {
  isDominoQuadRollActive,
  isDominoPairLocked,
  isDominoPairTraySeamless,
  canShowDominoPairReroll,
} from '../../logic/domino-roll.js';
import { isEndGamePromptArmed, syncEndGamePromptWithRollChrome } from './end-game-prompt.js';

function isTrayDieRerollable(dieId) {
  if (!settings.rerollOuter || state.phase !== 'rolled') return false;
  if (isDominoPairLocked(dieId)) return false;
  const die = state.dice[dieId];
  return die != null && isOuterDieValue(die.value) && state.actionBar.includes(dieId);
}

function isTrayDieDominoStarRerollable(dieId) {
  return canShowDominoPairReroll() && state.actionBar.includes(dieId);
}

function isTrayDieStarRerollable(dieId) {
  if (isTrayDieDominoStarRerollable(dieId)) return true;
  return isTrayDieRerollable(dieId);
}

function dieActionHTML(id, idx) {
  const die = state.dice[id];
  const inactive = isBarDieInactive(id);
  const dominoRerollable = isTrayDieDominoStarRerollable(id);
  const rerollable = isTrayDieStarRerollable(id);
  const sel = (!inactive || rerollable) && state.selectedDieId === id;
  const isNew = state.newTrayDieIds?.has(id);
  const styles = [`--die-border-fill:${dieFaceBorderColor(die.value)}`];
  if (isNew) styles.push(`animation-delay:${idx * 60}ms`);
  const styleAttr = ` style="${styles.join(';')}"`;
  return `<div class="die die--action${inactive ? ' die--action-inactive' : ''}${dominoRerollable ? ' die--domino-rerollable' : ''}${rerollable && !dominoRerollable ? ' die--rerollable' : ''}${sel ? ' die--action-selected' : ''}${isNew ? ' is-new' : ''}" data-die-id="${id}"${styleAttr}>${dieSVG(die.value, DIE_OUTER, { pipRotationDeg: 0 })}</div>`;
}

function trayDieOrder(ids) {
  return ids.slice().sort((a, b) => state.actionBar.indexOf(a) - state.actionBar.indexOf(b));
}

function buildDiceTrayHTML() {
  const visibleIds = state.actionBar.filter(id => id !== state.draggingDieId);

  if (isDominoQuadRollActive() && state.dominoPairGroups) {
    const [pairA, pairB] = state.dominoPairGroups;
    const inTray = id => state.actionBar.includes(id) && id !== state.draggingDieId;
    const pairAVisible = trayDieOrder(pairA.filter(inTray));
    const pairBVisible = trayDieOrder(pairB.filter(inTray));
    const pairAPlaced = pairA.some(id => !state.actionBar.includes(id));
    const pairBPlaced = pairB.some(id => !state.actionBar.includes(id));
    const pairADragging = state.draggingDieId != null && pairA.includes(state.draggingDieId);
    const pairBDragging = state.draggingDieId != null && pairB.includes(state.draggingDieId);
    const pairASlotClass = (pairAPlaced || pairADragging) && pairAVisible.length
      ? 'domino-pair-slot domino-pair-slot--left-toward-sep'
      : 'domino-pair-slot';
    const pairBSlotClass = (pairBPlaced || pairBDragging) && pairBVisible.length
      ? 'domino-pair-slot domino-pair-slot--right-toward-sep'
      : 'domino-pair-slot';
    let idx = 0;
    const pairAHTML = pairAVisible.map(id => dieActionHTML(id, idx++)).join('');
    const pairBHTML = pairBVisible.map(id => dieActionHTML(id, idx++)).join('');
    const sepHTML = `<span class="domino-pair-sep" aria-hidden="true">|</span>`;
    return `<div class="action-bar-dice action-bar-dice--domino-quad" id="action-bar-dice">
      <div class="${pairASlotClass}"><div class="domino-pair">${pairAHTML}</div></div>
      ${sepHTML}
      <div class="${pairBSlotClass}"><div class="domino-pair">${pairBHTML}</div></div>
    </div>`;
  }

  if (isDominoPairTraySeamless()) {
    const pairHTML = trayDieOrder(state.actionBar)
      .filter(id => id !== state.draggingDieId)
      .map((id, idx) => dieActionHTML(id, idx))
      .join('');
    return `<div class="action-bar-dice action-bar-dice--domino-pair" id="action-bar-dice">
      <div class="domino-pair">${pairHTML}</div>
    </div>`;
  }

  const diceHTML = visibleIds.map((id, idx) => dieActionHTML(id, idx)).join('');
  return `<div class="action-bar-dice" id="action-bar-dice">${diceHTML}</div>`;
}

/** Sync tray dice selection chrome without rebuilding the bar. */
export function updateActionBarSelection() {
  const bar = document.getElementById('action-bar');
  if (!bar) return;

  bar.querySelectorAll('.die--action').forEach(el => {
    const id = Number(el.dataset.dieId);
    const inactive = isBarDieInactive(id);
    const dominoRerollable = isTrayDieDominoStarRerollable(id);
    const rerollable = isTrayDieStarRerollable(id);
    el.classList.toggle('die--action-inactive', inactive);
    el.classList.toggle('die--domino-rerollable', dominoRerollable);
    el.classList.toggle('die--rerollable', rerollable && !dominoRerollable);
    const sel = (!inactive || rerollable) && state.selectedDieId === id && state.draggingDieId !== id;
    el.classList.toggle('die--action-selected', sel);
  });
}

export function renderActionBar() {
  syncEndGamePromptWithRollChrome(isRollButtonWarningRedBorder());

  const bar = document.getElementById('action-bar');
  if (!bar) return;

  const diceTrayHTML = buildDiceTrayHTML();

  state.newTrayDieIds?.clear();

  const confirm = canConfirm();
  const trayStuck = state.phase === 'rolled' && isTrayStuck();
  const spotBlocked = isDominoSpotAssignmentBlocked();
  const rollDisabled = state.phase === 'replay'
    || (!canRoll() && !confirm && !canEndGame() && !trayStuck && !spotBlocked);
  const rollLabel = rollAffordanceRemaining();
  const rollLow = isRollPoolLow();
  const rollAria = confirm ? 'Confirm placement' : trayStuck ? 'End game' : 'Roll dice';
  const hasFullStack = rowHasThreeDiceStack();
  const endgameArmed = isEndGamePromptArmed();
  const rollLabelDisplay = endgameArmed ? '&lt;' : String(rollLabel);
  const rollBtnClass = endgameArmed ? 'roll-btn roll-btn--back' : `roll-btn${rollLow ? ' roll-btn--low' : ''}`;
  const rollBtnAria = endgameArmed ? 'Cancel end game' : rollAria;
  const wrapClasses = [
    'roll-btn-wrap',
    confirm ? 'roll-btn-wrap--confirm' : '',
    trayStuck ? 'roll-btn-wrap--stuck' : '',
    hasFullStack ? 'roll-btn-wrap--has-full-stack' : '',
    endgameArmed ? 'roll-btn-wrap--endgame-armed' : '',
  ].filter(Boolean).join(' ');
  const wrapExpanded = endgameArmed ? ' aria-expanded="true"' : '';

  const rollBtnHTML = `<button type="button" class="${rollBtnClass}" id="roll-btn" ${rollDisabled ? 'disabled' : ''} aria-label="${rollBtnAria}">${rollLabelDisplay}</button>`;
  const koBtnHTML = endgameArmed
    ? `<div class="roll-btn-slot roll-btn-slot--ko">
        <div class="roll-btn-face roll-btn-face--ko" aria-hidden="true">${rollButtonFaceSVG(DIE_OUTER)}</div>
        <button type="button" class="roll-btn roll-btn--ko" id="roll-btn-endgame-confirm" aria-label="Confirm end game">KO</button>
      </div>`
    : '';

  const rollWrapHTML = endgameArmed
    ? `<div class="${wrapClasses}"${wrapExpanded}>
        <div class="roll-btn-slot roll-btn-slot--number">
          <div class="roll-btn-face" aria-hidden="true">${rollButtonFaceSVG(DIE_OUTER)}</div>
          ${rollBtnHTML}
        </div>
        ${koBtnHTML}
      </div>`
    : `<div class="${wrapClasses}"${wrapExpanded}>
        <div class="roll-btn-face" aria-hidden="true">${rollButtonFaceSVG(DIE_OUTER)}</div>
        ${rollBtnHTML}
      </div>`;

  bar.innerHTML = `
    ${diceTrayHTML}
    ${rollWrapHTML}
  `;
}
