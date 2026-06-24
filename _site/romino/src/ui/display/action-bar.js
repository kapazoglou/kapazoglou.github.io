import { state } from '../../logic/state.js';
import { settings, getInitialStartCardCount } from '../../logic/settings.js';
import { dieSVG, diePipRotationDeg, isDieSelectable } from '../../logic/cards.js';
import { nextComboForDisplay } from '../../logic/dice.js';
import { renderCardHTML } from './grid.js';

/** Build ghost card HTML for the upcoming-card indicator in the action bar.
 *  When diceDecks is ON: only the slot-count indicator squares are shown.
 *  When diceDecks is OFF: the classic 3-slot skeleton is shown. */
export function ghostCardHTML(slotCount) {
  if (settings.square) {
    if (settings.fourSquare) {
      return `<div class="converter-card converter-card--square converter-card--four-square" style="color:#9A9FB6">
        <div class="square-wrapper">
          <div class="square-tiles square-tiles--four">
            <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
            <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
            <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
            <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
          </div>
        </div>
      </div>`;
    }
    return `<div class="converter-card converter-card--square" style="color:#9A9FB6">
      <div class="square-wrapper">
        <div class="square-tiles">
          <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
          <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
          <div class="square-tile square-tile--bordered"><div class="holder-dice"></div></div>
        </div>
      </div>
      <div class="card-index card-index--square">&nbsp;</div>
    </div>`;
  }
  if (settings.diceDecks) {
    const n = slotCount ?? 3;
    const squares = Array(n).fill('<span></span>').join('');
    return `<div class="converter-card converter-card--ghost-indicator">
      <div class="card-slot-indicator">${squares}</div>
    </div>`;
  }
  if (slotCount === 2) {
    return `<div class="converter-card" style="color:#CCB400">
      <div class="card-index"><span class="card-rank"></span></div>
      <div class="card-dice">
        <div class="dice-tile dice-tile--bottom dice-tile--v-suit"><div class="holder-dice"></div><div class="holder-dice"></div></div>
      </div>
    </div>`;
  }
  if (slotCount === 1) {
    return `<div class="converter-card" style="color:#D3D6E5">
      <div class="card-dice card-dice--center">
        <div class="dice-tile dice-tile--center"><div class="holder-dice"></div></div>
      </div>
    </div>`;
  }
  return `<div class="converter-card" style="color:#D3D6E5">
    <div class="card-index"><span class="card-rank"></span></div>
    <div class="card-dice">
      <div class="dice-tile dice-tile--top"><div class="holder-dice"></div></div>
      <div class="dice-tile dice-tile--bottom"><div class="holder-dice"></div><div class="holder-dice"></div></div>
    </div>
  </div>`;
}

export function gameOverCardHTML() {
  return `<div class="converter-card converter-card--game-over" data-game-over-card="true">
    <span class="converter-card--game-over-label">game over</span>
  </div>`;
}

export function renderActionBar() {
  const bar = document.getElementById('action-bar');
  bar.innerHTML = '';

  const cardAfterPreview = !!state.newCardAfterPreview;
  const previewAfterCard = !!state.newPreviewInCard;
  state.newCardAfterPreview = false;
  state.newPreviewInCard = false;

  if (state.phase === 'place-card') {
    bar.classList.remove('mode-dice');
    let newIdx = 0;
    state.actionBarCards.forEach(cardId => {
      const div = document.createElement('div');
      div.innerHTML = renderCardHTML(cardId, true);
      const el = div.firstElementChild;
      if (state.newCards?.has(cardId)) {
        el.classList.add('is-new');
        const prevLen = state.previewOrder.length || 3;
        el.style.animationDelay = cardAfterPreview ? `${(prevLen - 1) * 60 + 320 + 40}ms` : `${newIdx * 80}ms`;
        newIdx++;
      }
      bar.appendChild(el);
    });
    state.newCards?.clear();
  } else {
    bar.classList.add('mode-dice');
    const tray = document.createElement('div');
    tray.className = 'dice-tray';
    let newIdx = 0;
    state.trayOrder.forEach(dieId => {
      // Only render dice that are still in the tray (not in a card slot)
      let inCard = false;
      for (const card of state.cards) {
        for (let si = 0; si < card.slots.length; si++) {
          if (card.slots[si] === dieId) { inCard = true; break; }
        }
        if (inCard) break;
      }
      if (!inCard) {
        const w = document.createElement('div');
        w.className = 'die-wrapper';
        if (state.newDice?.has(dieId)) {
          w.classList.add('is-new');
          w.style.animationDelay = `${newIdx * 60}ms`;
          newIdx++;
        }
        w.dataset.name  = 'dice_filled_pips';
        w.dataset.dieId = dieId;
        if (state.phase === 'place-dice' && !isDieSelectable(dieId)) {
          w.classList.add('is-locked');
          w.dataset.locked = 'true';
        }
        if (state.selectedDieId === dieId) w.classList.add('is-selected');
        w.innerHTML = dieSVG(state.dice[dieId].value, 40, diePipRotationDeg(null, state.dice[dieId].value));
        tray.appendChild(w);
      }
    });
    bar.appendChild(tray);
    state.newDice?.clear();

    const isNewPreview = !!state.newPreview;
    state.newPreview = false;
    const playableCount = state.trayOrder.filter(id => {
      for (const card of state.cards) {
        for (let si = 0; si < card.slots.length; si++) {
          if (card.slots[si] === id) return false;
        }
      }
      return true;
    }).length;
    const basePreviewDelay = isNewPreview ? (Math.max(playableCount, 1) - 1) * 60 + 320 : 0;

    const combo = state.previewOrder.length ? state.previewOrder : nextComboForDisplay();
    const preview = document.createElement('div');
    preview.className = 'upcoming-preview';
    preview.innerHTML = combo.map((v, idx) => {
      const cls   = `die-wrapper${isNewPreview ? ' preview-is-new' : ''}`;
      const style = `pointer-events:none${isNewPreview ? `;animation-delay:${basePreviewDelay + idx * 60}ms` : ''}`;
      return `<div class="${cls}" style="${style}">${dieSVG(v, 40, diePipRotationDeg(null, v))}</div>`;
    }).join('');
    bar.appendChild(preview);

    const ghostReverse = !!state.ghostReverseIn;
    state.ghostReverseIn = false;
    const isGameOverGhost = state.showGameOverCard;
    const animateGhost = !isGameOverGhost && ((isNewPreview && !state.suppressGhostAnimation) || ghostReverse);
    const animateGameOverGhost = isGameOverGhost && state.newGameOverCard;
    state.suppressGhostAnimation = false;
    const lastDieIdx = Math.max(combo.length - 1, 0);
    const cardGhostDelay = animateGhost && isNewPreview ? basePreviewDelay + lastDieIdx * 60 + 320 + 40 : 0;
    const cardGhostEl = document.createElement('div');
    cardGhostEl.className = `action-bar-card-ghost${
      isGameOverGhost ? ' action-bar-card-ghost--game-over' : ''
    }${animateGhost || animateGameOverGhost ? ' is-new' : ''}`;
    if (animateGhost) cardGhostEl.style.animationDelay = `${cardGhostDelay}ms`;
    cardGhostEl.innerHTML = isGameOverGhost
      ? gameOverCardHTML()
      : ghostCardHTML(state.pendingCardSlotCount);
    if (animateGameOverGhost) state.newGameOverCard = false;
    bar.appendChild(cardGhostEl);
    return;
  }

  // Upcoming dice preview — place-card phase.
  const hideOpeningPreview = settings.extraStartCards && (
    state.cardsPlaced < getInitialStartCardCount()
    || (state.cardsPlaced === getInitialStartCardCount()
        && state.actionBarCards.length === 0
        && !cardAfterPreview
        && !previewAfterCard)
  );
  if (state.phase !== 'replay' &&
      !state.suppressPreviewDice &&
      !hideOpeningPreview &&
      (state.actionBarCards.length > 0 && state.cardsPlaced > 0 ||
       state.currentRoll.length > 0 ||
       state.cardsPlaced > 1)) {
    const isAnimated = cardAfterPreview || previewAfterCard;
    const previewBaseDelay = cardAfterPreview ? 0 : 320;
    const combo = state.previewOrder.length ? state.previewOrder : nextComboForDisplay();
    const preview = document.createElement('div');
    preview.className = 'upcoming-preview';
    preview.innerHTML = combo.map((v, idx) => {
      const cls   = `die-wrapper${isAnimated ? ' preview-is-new' : ''}`;
      const style = `pointer-events:none${isAnimated ? `;animation-delay:${previewBaseDelay + idx * 60}ms` : ''}`;
      return `<div class="${cls}" style="${style}">${dieSVG(v, 40, diePipRotationDeg(null, v))}</div>`;
    }).join('');
    bar.appendChild(preview);
  }
}
