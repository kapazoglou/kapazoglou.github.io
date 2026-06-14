import { state, forbiddenDieSlots } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { isSlotForbidden, dieInCard, updateSquareLayout, isDieSelectable } from '../../logic/cards.js';
import { updateScorePreview } from '../../logic/scoring.js';
import { selectLeftmostTrayDie } from '../../logic/dice.js';
import { cardIsGridRepositionable } from '../../logic/sweeps.js';
// Circular: phase.js imports autoplayCardStep from here.
import { convertFilledCards, checkPhaseTransition, checkStuck } from '../../logic/phase.js';
import { resolveAllScoringSets } from '../transitions/sweep-anim.js';
import { render } from './render.js';
import { renderHUD } from './hud.js';
import { launchPip, launchPenaltyPip } from '../transitions/card-anim.js';
import { clearForbiddenHolders } from './drag-drop.js';

function collectGridCoins() {
  if (!settings.square || !settings.scoring || !state.gridCoins.size) return;
  const gridEl  = document.getElementById('grid-container');
  const scoreEl = document.getElementById('score-display');
  if (!gridEl || !scoreEl) return;
  const gridRect = gridEl.getBoundingClientRect();
  const toRect   = scoreEl.getBoundingClientRect();
  const CELL = 119, PAD = 14;
  const size = settings.extendedGrid ? 4 : 3;
  for (const key of state.gridCoins) {
    const [aStr, bStr] = key.split(':');
    const a = parseInt(aStr, 10), b = parseInt(bStr, 10);
    const ra = Math.floor(a / size), ca = a % size;
    const cx = b === a + 1
      ? gridRect.left + PAD + ca * CELL + 117.5
      : gridRect.left + PAD + ca * CELL + 84;
    const cy = b === a + 1
      ? gridRect.top  + PAD + ra * CELL + 32
      : gridRect.top  + PAD + ra * CELL + 117.5;
    launchPip({ left: cx - 12, top: cy - 12, width: 24, height: 24 },
      toRect, () => { state.score++; renderHUD(); }, () => {});
  }
  state.gridCoins = new Set();
}

/* ── Autoplay ── */

function flyAutoplay(fromEl, toEl, type, onLand) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect   = toEl.getBoundingClientRect();

  const clone = fromEl.cloneNode(true);
  Object.assign(clone.style, {
    position:      'fixed',
    width:         fromRect.width  + 'px',
    height:        fromRect.height + 'px',
    left:          (fromRect.left + fromRect.width  / 2) + 'px',
    top:           (fromRect.top  + fromRect.height / 2) + 'px',
    transform:     'translate(-50%, -50%)',
    margin:        '0',
    pointerEvents: 'none',
    zIndex:        '9998',
    transition:    'none',
    animationName: 'none',
    opacity:       '1',
  });
  fromEl.style.opacity = '0';
  document.body.appendChild(clone);
  clone.getBoundingClientRect();

  const tx  = (toRect.left + toRect.width  / 2) - (fromRect.left + fromRect.width  / 2);
  const ty  = (toRect.top  + toRect.height / 2) - (fromRect.top  + fromRect.height / 2);
  const dur = type === 'card' ? spd(300) : spd(220);

  clone.style.transition = `transform ${dur}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  clone.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;

  setTimeout(() => {
    clone.remove();
    fromEl.style.opacity = '';
    onLand?.();
  }, dur);
}

export function autoplayCardStep(onDone) {
  if (state.phase !== 'place-card') { onDone?.(); return; }
  if (state.actionBarCards.length === 0) { onDone?.(); return; }
  const emptySlots = state.grid.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
  if (emptySlots.length === 0) { onDone?.(); return; }

  const targetSlotIdx = emptySlots[Math.floor(Math.random() * emptySlots.length)];
  const cardId = state.actionBarCards[0];

  const doPlace = () => {
    state.actionBarCards = state.actionBarCards.filter(id => id !== cardId);
    if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
    state.cardsPlaced++;
    state.grid[targetSlotIdx] = cardId;
    state.lastPlacedCardSlotCount = state.cards[cardId]?.slotCount ?? 3;
    state.diceAccentActive = false;
    state.selectedCardId = null;
    collectGridCoins();
    render();
    setTimeout(() => {
      convertFilledCards(() => {
        resolveAllScoringSets();
        render();
        checkPhaseTransition();
        setTimeout(() => onDone?.(), spd(380));
      });
    }, spd(220));
  };

  const sourceEl = document.querySelector(`.converter-card[data-card-id="${cardId}"]`);
  const targetEl = document.querySelector(`.grid-slot[data-grid-slot="${targetSlotIdx}"]`);
  if (sourceEl && targetEl) flyAutoplay(sourceEl, targetEl, 'card', doPlace);
  else doPlace();
}

export function autoplayDiceStep(onDone) {
  if (state.phase !== 'place-dice') { onDone?.(); return; }
  const trayDice = state.trayOrder.filter(id => dieInCard(id) === null);
  if (trayDice.length === 0) { onDone?.(); return; }

  function placeNext(remaining) {
    if (remaining.length === 0) {
      checkPhaseTransition();
      checkStuck();
      setTimeout(() => onDone?.(), spd(380));
      return;
    }
    const dieId = remaining[0];
    const valid = [];
    for (const cardId of state.grid) {
      if (cardId === null) continue;
      const card = state.cards[cardId];
      if (!card) continue;
      for (let si = 0; si < card.slots.length; si++) {
        if (card.slots[si] !== null) continue;
        if (!isSlotForbidden(cardId, si, dieId)) valid.push({ cardId, si });
      }
    }

    if (valid.length > 0) {
      const { cardId, si } = valid[Math.floor(Math.random() * valid.length)];
      const dieEl    = document.querySelector(`.die-wrapper[data-die-id="${dieId}"]`);
      const holderEl = document.querySelector(`.holder-dice[data-slot="${cardId}-${si}"]`);

      const doPlaceDie = () => {
        state.cards[cardId].slots[si] = dieId;
        updateScorePreview(cardId);
        render();
        setTimeout(() => placeNext(remaining.slice(1)), spd(60));
      };

      if (dieEl && holderEl) flyAutoplay(dieEl, holderEl, 'die', doPlaceDie);
      else doPlaceDie();
    } else {
      setTimeout(() => placeNext(remaining.slice(1)), spd(60));
    }
  }

  placeNext(trayDice);
}

export function autoplayStep(onDone) {
  if (state.phase === 'place-card') autoplayCardStep(onDone);
  else if (state.phase === 'place-dice') autoplayDiceStep(onDone);
  else onDone?.();
}

/* ── Long-press autoplay on action bar ── */
export function initAutoplay() {
  let _lpTimer         = null;
  let _longPressActive = false;

  function _stopLongPress() {
    _longPressActive = false;
    if (_lpTimer !== null) { clearTimeout(_lpTimer); _lpTimer = null; }
  }

  function _autoplayLoop() {
    if (!_longPressActive) return;
    if (state.phase === 'replay') { _stopLongPress(); return; }
    autoplayStep(() => {
      if (_longPressActive) setTimeout(_autoplayLoop, spd(120));
    });
  }

  const actionBar = document.getElementById('action-bar');

  actionBar.addEventListener('pointerdown', () => {
    if (!settings.autoplayLongPress) return;
    if (state.phase === 'replay') return;
    _lpTimer = setTimeout(() => {
      _lpTimer = null;
      _longPressActive = true;
      _autoplayLoop();
    }, 600);
  });

  actionBar.addEventListener('pointerup',     _stopLongPress);
  actionBar.addEventListener('pointercancel', _stopLongPress);
  actionBar.addEventListener('pointermove', e => {
    if (_lpTimer !== null && (Math.abs(e.movementX) + Math.abs(e.movementY)) > 8) _stopLongPress();
  });
}

/* ── Click/tap handlers ── */
export function initHandlers() {
  document.addEventListener('click', e => {

    const dieWrapper = e.target.closest('.die-wrapper');
    if (dieWrapper && !dieWrapper.dataset.locked) {
      const dieId = parseInt(dieWrapper.dataset.dieId, 10);
      if (!isNaN(dieId)) {
        state.selectedCardId = null;
        if (state.selectedDieId === dieId) {
          state.selectedDieId = null;
        } else if (state.selectedDieId !== null) {
          const slotA = dieInCard(state.selectedDieId);
          const slotB = dieInCard(dieId);
          if (settings.swapDice && slotA && slotB) {
            const [acStr, asStr] = slotA.split('-');
            const [bcStr, bsStr] = slotB.split('-');
            const ac = parseInt(acStr, 10), as_ = parseInt(asStr, 10);
            const bc = parseInt(bcStr, 10), bs  = parseInt(bsStr, 10);
            state.cards[ac].slots[as_] = dieId;
            state.cards[bc].slots[bs]  = state.selectedDieId;
            state.selectedDieId = null;
            updateScorePreview(ac);
            if (bc !== ac) updateScorePreview(bc);
          } else if (isDieSelectable(dieId)) {
            state.selectedDieId = dieId;
          }
        } else if (isDieSelectable(dieId)) {
          state.selectedDieId = dieId;
        }
        render();
        return;
      }
    }

    const holderEl = e.target.closest('.holder-dice');
    if (holderEl && holderEl.dataset.slot) {
      if (state.selectedDieId !== null) {
        const slotKey = holderEl.dataset.slot;
        const [cidStr, siStr] = slotKey.split('-');
        const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
        const card = state.cards[cardId];
        const forbidden = card && card.slots[si] === null && isSlotForbidden(cardId, si, state.selectedDieId);
        const hardBlock = forbidden && (!settings.paidSlots || !settings.scoring);
        const canPlace  = card && card.slots[si] === null && (!forbidden || (!hardBlock && settings.scoring && state.score > 0));
        if (canPlace) {
          const inGrid = state.grid.includes(cardId);
          if (forbidden) {
            state.score--;
            renderHUD();
            if (inGrid) launchPenaltyPip(holderEl.getBoundingClientRect());
            forbiddenDieSlots.add(state.selectedDieId);
          }
          const prevSlotKey = dieInCard(state.selectedDieId);
          const fromTray = !prevSlotKey;
          if (prevSlotKey) {
            if (settings.refundOnMove && forbiddenDieSlots.has(state.selectedDieId)) {
              forbiddenDieSlots.delete(state.selectedDieId);
              const prevCardId   = parseInt(prevSlotKey.split('-')[0], 10);
              const prevHolderEl = document.querySelector(`[data-slot="${prevSlotKey}"]`);
              const scoreEl      = document.getElementById('score-display');
              if (state.grid.includes(prevCardId) && prevHolderEl && scoreEl) {
                launchPip(prevHolderEl.getBoundingClientRect(), scoreEl.getBoundingClientRect(),
                  () => { state.score++; renderHUD(); }, () => {});
              } else {
                state.score++; renderHUD();
              }
            }
            const [pcStr, psStr] = prevSlotKey.split('-');
            state.cards[parseInt(pcStr, 10)].slots[parseInt(psStr, 10)] = null;
          }
          card.slots[si] = state.selectedDieId;
          if (settings.square) updateSquareLayout(cardId);
          state.selectedDieId = null;
          updateScorePreview(cardId);
          selectLeftmostTrayDie();
          render();
          if (fromTray) { checkPhaseTransition(); checkStuck(); }
        }
        return;
      }
    }

    if (settings.peekUnconvertedLayout) {
      const peekEl = e.target.closest('.grid-slot.is-filled .converter-card');
      if (peekEl && !e.target.closest('.die-wrapper')) {
        const cardId = parseInt(peekEl.dataset.cardId, 10);
        const card = state.cards[cardId];
        if (!isNaN(cardId) && card?.filled && state.grid.includes(cardId)) {
          if (state.peekUnconvertedCards.has(cardId)) state.peekUnconvertedCards.delete(cardId);
          else state.peekUnconvertedCards.add(cardId);
          render();
          return;
        }
      }
    }

    const cardEl = e.target.closest('.converter-card.in-tray');
    if (cardEl) {
      const cardId = parseInt(cardEl.dataset.cardId, 10);
      if (!isNaN(cardId)) {
        state.selectedDieId = null;
        state.selectedCardId = state.selectedCardId === cardId ? null : cardId;
        render();
        return;
      }
    }

    const gridCardEl = e.target.closest('.converter-card.converter-card--grid-draggable');
    if (gridCardEl) {
      const cardId = parseInt(gridCardEl.dataset.cardId, 10);
      if (!isNaN(cardId) && cardIsGridRepositionable(cardId)) {
        if (state.selectedDieId !== null && e.target.closest('.card-dice')) return;
        state.selectedDieId = null;
        state.selectedCardId = state.selectedCardId === cardId ? null : cardId;
        render();
        return;
      }
    }

    const gridSlotEl = e.target.closest('.grid-slot');
    if (gridSlotEl && state.selectedCardId !== null) {
      const i = parseInt(gridSlotEl.dataset.gridSlot, 10);
      if (!isNaN(i)) {
        const placedCardId = state.selectedCardId;
        const fromGridIndex = state.grid.indexOf(placedCardId);
        const fromGrid = fromGridIndex !== -1;

        if (fromGrid && fromGridIndex === i) {
          state.selectedCardId = null;
          render();
          return;
        }

        if (state.grid[i] === null) {
          if (fromGrid) {
            state.grid[fromGridIndex] = null;
            state.grid[i] = placedCardId;
            state.selectedCardId = null;
            render();
          } else {
            state.actionBarCards = state.actionBarCards.filter(id => id !== placedCardId);
            if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
            state.cardsPlaced++;
            state.grid[i] = placedCardId;
            state.lastPlacedCardSlotCount = state.cards[placedCardId]?.slotCount ?? 3;
            state.diceAccentActive = false;
            state.selectedCardId = null;
            collectGridCoins();
            render();
            setTimeout(() => {
              convertFilledCards(() => {
                resolveAllScoringSets();
                render();
                checkPhaseTransition();
              });
            }, spd(220));
          }
          return;
        }
      }
      return;
    }
  });
}
