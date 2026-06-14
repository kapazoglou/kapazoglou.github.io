import { state, forbiddenDieSlots } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { isSlotForbidden, dieSVG, diePipRotationDeg, updateSquareLayout, dieInCard, isDieSelectable } from '../../logic/cards.js';
import { cardIsGridRepositionable } from '../../logic/sweeps.js';
import { renderCardHTML } from './grid.js';
import { updateScorePreview } from '../../logic/scoring.js';
import { selectLeftmostTrayDie, prependReturnedDieToTrayOrder } from '../../logic/dice.js';
import { convertFilledCards, checkPhaseTransition, checkStuck, revertPostDiceCardPhase } from '../../logic/phase.js';
import { resolveAllScoringSets } from '../transitions/sweep-anim.js';
import { render } from './render.js';
import { renderHUD } from './hud.js';
import { collectGridCoins } from './grid-coins.js';
import { launchPip, launchPenaltyPip } from '../transitions/card-anim.js';
import { vibrateSlotHover, vibrateActionBarHover } from '../transitions/haptics.js';
import { ghostCardHTML } from './action-bar.js';

function countTrayDice() {
  return state.currentRoll.filter(id => dieInCard(id) === null).length;
}

function canReturnDieToTray(drag) {
  if (drag.type !== 'die') return false;
  if (state.phase === 'place-dice') return true;
  if (state.phase === 'place-card' && state.awaitingPostDiceGridPlace
      && drag.originSlot && countTrayDice() === 0) return true;
  return false;
}

function isOverActionBar(clientX, clientY) {
  const bar = document.getElementById('action-bar');
  if (!bar) return false;
  const r = bar.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

function shouldPreviewCardAsGhost() {
  return state.phase === 'place-card'
    && state.awaitingPostDiceGridPlace
    && state.actionBarCards.length > 0;
}

function clearCardGhostPreview(bar, drag) {
  if (!bar) return;
  bar.querySelector('.action-bar-card-ghost.is-tray-return-preview')?.remove();
  bar.querySelector('.converter-card.in-tray.is-tray-return-hidden')?.classList.remove('is-tray-return-hidden');
  if (state.phase === 'place-card') bar.classList.remove('mode-dice');
  if (drag?.cardGhostPreviewActive) {
    state.selectedCardId = drag.savedSelectedCardId ?? null;
    const cardId = state.selectedCardId;
    if (cardId != null) {
      bar.querySelector(`.converter-card.in-tray[data-card-id="${cardId}"]`)?.classList.add('is-selected');
    }
    drag.cardGhostPreviewActive = false;
    drag.savedSelectedCardId = undefined;
  }
}

function showCardGhostPreview(bar, drag) {
  if (!shouldPreviewCardAsGhost()) return;

  if (!drag.cardGhostPreviewActive) {
    drag.savedSelectedCardId = state.selectedCardId;
    state.selectedCardId = null;
    drag.cardGhostPreviewActive = true;
  }

  const cardId = state.actionBarCards[0];
  const inTray = bar.querySelector(`.converter-card.in-tray[data-card-id="${cardId}"]`)
    ?? bar.querySelector('.converter-card.in-tray');
  inTray?.classList.add('is-tray-return-hidden');
  inTray?.classList.remove('is-selected');

  const slotCount = state.cards[cardId]?.slotCount ?? 3;
  let ghostWrap = bar.querySelector('.action-bar-card-ghost.is-tray-return-preview');
  if (!ghostWrap) {
    ghostWrap = document.createElement('div');
    ghostWrap.className = 'action-bar-card-ghost is-tray-return-preview';
    ghostWrap.innerHTML = ghostCardHTML(slotCount);
    bar.appendChild(ghostWrap);
  }

  bar.classList.add('mode-dice');
}

function clearTrayReturnPreview(drag) {
  const bar = document.getElementById('action-bar');
  clearCardGhostPreview(bar, drag);
  document.querySelectorAll('.die-wrapper.is-tray-return-preview').forEach(el => el.remove());
  document.querySelectorAll('.dice-tray.tray-return-preview-host').forEach(el => el.remove());
  if (drag?.originEl?.isConnected && !drag.originSlot && drag.trayPreviewActive) {
    drag.originEl.classList.add('is-dragging');
    drag.originEl.classList.remove('is-selected');
  }
  if (drag) drag.trayPreviewActive = false;
}

function getOrCreatePreviewTray(bar) {
  return bar.querySelector('.dice-tray:not(.tray-return-preview-host)')
    ?? bar.querySelector('.dice-tray.tray-return-preview-host')
    ?? (() => {
      const tray = document.createElement('div');
      tray.className = 'dice-tray tray-return-preview-host';
      bar.insertBefore(tray, bar.firstChild);
      return tray;
    })();
}

function applyTrayPreviewSelection(selectedEl) {
  document.querySelectorAll('#action-bar .die-wrapper.is-selected').forEach(el => {
    if (el !== selectedEl) el.classList.remove('is-selected');
  });
  selectedEl?.classList.add('is-selected');
}

function showTrayReturnPreview(drag) {
  const bar = document.getElementById('action-bar');

  if (!drag.originSlot) {
    drag.originEl?.classList.remove('is-dragging');
    applyTrayPreviewSelection(drag.originEl);
    showCardGhostPreview(bar, drag);
    drag.trayPreviewActive = true;
    return;
  }

  if (!bar) return;

  const tray = getOrCreatePreviewTray(bar);

  bar.querySelectorAll('.dice-tray.tray-return-preview-host').forEach(host => {
    if (host !== tray) host.remove();
  });

  let preview = bar.querySelector('.die-wrapper.is-tray-return-preview');
  bar.querySelectorAll('.die-wrapper.is-tray-return-preview').forEach(el => {
    if (el !== preview) el.remove();
  });

  if (!preview) {
    const dieId = drag.dieId;
    const value = state.dice[dieId].value;
    preview = document.createElement('div');
    preview.className = 'die-wrapper is-tray-return-preview is-selected';
    preview.dataset.dieId = dieId;
    preview.innerHTML = dieSVG(value, 40, diePipRotationDeg(null, value));
  }

  const siblings = [...tray.querySelectorAll('.die-wrapper:not(.is-tray-return-preview)')];
  tray.insertBefore(preview, siblings[0] ?? null);

  applyTrayPreviewSelection(preview);
  showCardGhostPreview(bar, drag);
  drag.trayPreviewActive = true;
}

function clearDieFromOriginSlot(originSlot, dieId) {
  const originCardId = parseInt(originSlot.split('-')[0], 10);
  const si = parseInt(originSlot.split('-')[1], 10);

  if (settings.refundOnMove && forbiddenDieSlots.has(dieId)) {
    forbiddenDieSlots.delete(dieId);
    const prevHolderEl = document.querySelector(`[data-slot="${originSlot}"]`);
    const scoreEl      = document.getElementById('score-display');
    if (state.grid.includes(originCardId) && prevHolderEl && scoreEl) {
      launchPip(prevHolderEl.getBoundingClientRect(), scoreEl.getBoundingClientRect(),
        () => { state.score++; renderHUD(); }, () => {});
    } else {
      state.score++;
      renderHUD();
    }
  } else {
    forbiddenDieSlots.delete(dieId);
  }

  state.cards[originCardId].slots[si] = null;
  if (settings.square) updateSquareLayout(originCardId);
  return originCardId;
}

function returnDieToTray(drag, shouldRevertPhase) {
  if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');

  if (!drag.originSlot) {
    state.selectedDieId = drag.dieId;
    render();
    return;
  }

  const originCardId = clearDieFromOriginSlot(drag.originSlot, drag.dieId);
  prependReturnedDieToTrayOrder(drag.dieId);
  updateScorePreview(originCardId);
  state.selectedDieId = drag.dieId;

  if (shouldRevertPhase) {
    revertPostDiceCardPhase();
  }

  render();
  checkStuck();
}

export function markForbiddenHolders(dieId) {
  document.querySelectorAll('.holder-dice[data-slot]').forEach(el => {
    const slotKey = el.dataset.slot;
    if (!slotKey) return;
    const [cidStr, siStr] = slotKey.split('-');
    const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
    if (!state.grid.includes(cardId)) return;
    const card = state.cards[cardId];
    if (!card || card.slots[si] !== null) return;
    const forbidden = isSlotForbidden(cardId, si, dieId);
    el.classList.toggle('is-forbidden',      forbidden);
    el.classList.toggle('is-hard-forbidden', forbidden && (!settings.paidSlots || !settings.scoring));
  });
}

export function clearForbiddenHolders() {
  document.querySelectorAll('.holder-dice.is-forbidden').forEach(el => {
    el.classList.remove('is-forbidden', 'is-hard-forbidden');
  });
}

export function initDragDrop() {
  const ghost = document.getElementById('drag-ghost');
  let drag = null;
  let dragStartX = 0, dragStartY = 0, dragCommitted = false;
  const DRAG_THRESHOLD = 6;

  document.addEventListener('pointerdown', e => {
    const cardEl = e.target.closest('.converter-card.in-tray')
      || e.target.closest('.converter-card.converter-card--grid-draggable');
    if (cardEl) {
      const tapDieEl = e.target.closest('.die-wrapper');
      if (tapDieEl && !tapDieEl.dataset.locked) return;
      if (state.selectedDieId !== null
          && cardEl.classList.contains('converter-card--grid-draggable')
          && e.target.closest('.holder-dice')?.dataset.slot) {
        return;
      }
      e.preventDefault();
      const cardId = parseInt(cardEl.dataset.cardId, 10);
      const fromGrid = cardEl.classList.contains('converter-card--grid-draggable');
      const slotEl = fromGrid ? cardEl.closest('.grid-slot') : null;
      const fromGridIndex = slotEl ? parseInt(slotEl.dataset.gridSlot, 10) : null;
      if (fromGrid) {
        if (fromGridIndex === null || Number.isNaN(fromGridIndex)
            || state.grid[fromGridIndex] !== cardId || !cardIsGridRepositionable(cardId)) {
          return;
        }
      }
      drag = { type: 'card', cardId, originEl: cardEl, fromGrid, fromGridIndex };
      dragStartX = e.clientX; dragStartY = e.clientY; dragCommitted = false;
      cardEl.setPointerCapture(e.pointerId);
      return;
    }

    const wrapper = e.target.closest('.die-wrapper');
    if (!wrapper || wrapper.dataset.locked) return;
    const dieId = parseInt(wrapper.dataset.dieId, 10);
    if (isNaN(dieId) || !isDieSelectable(dieId)) return;
    if (isNaN(dieId) || !isDieSelectable(dieId)) return;
    e.preventDefault();
    const originSlot = wrapper.dataset.slot || null;
    drag = { type: 'die', dieId, originSlot, originEl: wrapper };
    dragStartX = e.clientX; dragStartY = e.clientY; dragCommitted = false;
    wrapper.setPointerCapture(e.pointerId);
  }, { passive: false });

  document.addEventListener('pointermove', e => {
    if (!drag) return;

    if (!dragCommitted) {
      const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      dragCommitted = true;
      state.selectedDieId = null;
      state.selectedCardId = null;
      if (drag.type === 'card') {
        ghost.classList.remove('die-drag');
        ghost.innerHTML = renderCardHTML(drag.cardId);
        drag.originEl.classList.add('is-dragging');
        drag.hoverTarget = null;
      } else {
        ghost.classList.add('die-drag');
        const value = state.dice[drag.dieId].value;
        let slotIdx = null;
        let cardId = null;
        if (drag.originSlot) {
          const parts = drag.originSlot.split('-');
          cardId = parseInt(parts[0], 10);
          slotIdx = parseInt(parts[1], 10);
        }
        ghost.innerHTML = dieSVG(value, 40, diePipRotationDeg(slotIdx, value, cardId));
        drag.originEl.classList.add('is-dragging');
        drag.hoverTarget = null;
        markForbiddenHolders(drag.dieId);
      }
      ghost.style.left = e.clientX + 'px';
      ghost.style.top  = e.clientY + 'px';
      ghost.classList.add('is-visible');
    }

    ghost.style.left = e.clientX + 'px';
    ghost.style.top  = e.clientY + 'px';

    ghost.classList.remove('is-visible');
    if (drag.type === 'card') ghost.classList.remove('die-drag');
    const under = document.elementFromPoint(e.clientX, e.clientY);
    ghost.classList.add('is-visible');
    if (drag.type === 'die') ghost.classList.add('die-drag');

    if (drag.type === 'card') {
      document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
      let validGridIndex = null;
      const slot = under?.closest('.grid-slot');
      if (slot) {
        const gi = parseInt(slot.dataset.gridSlot, 10);
        const empty  = state.grid[gi] === null;
        const origin = drag.fromGrid && drag.fromGridIndex === gi;
        if (empty || origin) slot.classList.add('drag-over');
        if (empty) validGridIndex = gi;
      }
      const hoverTarget = validGridIndex !== null ? `grid:${validGridIndex}` : null;
      if (hoverTarget !== drag.hoverTarget) {
        drag.hoverTarget = hoverTarget;
        if (hoverTarget) vibrateSlotHover();
      }
      return;
    }

    document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
    document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));

    let validSlotKey = null;
    const holderEl = under?.closest('.holder-dice');
    if (holderEl) {
      const slotKey = holderEl.dataset.slot;
      const [cidStr, siStr] = slotKey.split('-');
      const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
      const card = state.cards[cardId];
      const isLocked   = card && card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
      const isForbidden = holderEl.classList.contains('is-forbidden');
      const hardBlock   = isForbidden && (!settings.paidSlots || !settings.scoring);
      const isValidDrop = !isLocked && (!isForbidden || (!hardBlock && settings.scoring && state.score > 0));
      if (isValidDrop) {
        holderEl.classList.add('drag-over');
        validSlotKey = slotKey;
      }
    } else {
      const trayDie = under?.closest('.die-wrapper');
      if (trayDie && !trayDie.dataset.slot && parseInt(trayDie.dataset.dieId, 10) !== drag.dieId) {
        trayDie.classList.add('tray-swap-target');
      }
    }

    const overBar = isOverActionBar(e.clientX, e.clientY);
    const trayPreview = overBar && canReturnDieToTray(drag);
    if (trayPreview) {
      showTrayReturnPreview(drag);
      ghost.classList.remove('is-visible');
      document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));
    } else {
      clearTrayReturnPreview(drag);
    }

    const hoverTarget = trayPreview ? 'actionBar' : validSlotKey;
    if (hoverTarget !== drag.hoverTarget) {
      drag.hoverTarget = hoverTarget;
      if (hoverTarget === 'actionBar') vibrateActionBarHover();
      else if (hoverTarget) vibrateSlotHover();
    }
  }, { passive: true });

  document.addEventListener('pointerup', e => {
    if (!drag) return;

    if (!dragCommitted) {
      drag = null;
      return;
    }

    clearForbiddenHolders();
    ghost.classList.remove('is-visible');
    const under = document.elementFromPoint(e.clientX, e.clientY);
    ghost.classList.remove('is-visible');

    if (drag.type === 'card') {
      document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
      const slot = under?.closest('.grid-slot');
      if (slot) {
        const i = parseInt(slot.dataset.gridSlot, 10);
        if (drag.fromGrid && drag.fromGridIndex === i) {
          if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
          drag = null;
          return;
        }
        if (state.grid[i] === null) {
          const fromGrid = drag.fromGrid;
          if (fromGrid) state.grid[drag.fromGridIndex] = null;
          else {
            state.actionBarCards = state.actionBarCards.filter(id => id !== drag.cardId);
            if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
            state.cardsPlaced++;
          }
          state.grid[i] = drag.cardId;
          drag = null;
          if (!fromGrid) {
            state.diceAccentActive = false;
            collectGridCoins();
          }
          render();
          setTimeout(() => {
            convertFilledCards(() => {
              resolveAllScoringSets();
              render();
              checkPhaseTransition();
            });
          }, spd(220));
          return;
        }
      }
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
      drag = null;
      return;
    }

    document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
    document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));
    clearTrayReturnPreview(drag);

    const shouldRevertPhase = drag.originSlot && countTrayDice() === 0
      && state.phase === 'place-card' && state.awaitingPostDiceGridPlace
      && state.actionBarCards.length > 0;

    if (isOverActionBar(e.clientX, e.clientY) && canReturnDieToTray(drag)) {
      returnDieToTray(drag, shouldRevertPhase);
      drag = null;
      return;
    }

    const holderEl   = under?.closest('.holder-dice');
    const trayDieEl  = !holderEl ? under?.closest('.die-wrapper') : null;
    const targetTrayId = trayDieEl && !trayDieEl.dataset.slot
      ? parseInt(trayDieEl.dataset.dieId, 10) : null;

    if (holderEl) {
      const slotKey = holderEl.dataset.slot;
      const [cidStr, siStr] = slotKey.split('-');
      const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
      const card = state.cards[cardId];
      if (!card) { drag = null; return; }

      if (card.slots[si] !== null) {
        if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
        drag = null;
        return;
      }

      const isLocked = card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
      if (isLocked) {
        if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
        drag = null;
        return;
      }

      const inGrid    = state.grid.includes(cardId);
      const forbidden = isSlotForbidden(cardId, si, drag.dieId);
      if (forbidden) {
        const hardBlock = !settings.paidSlots || !settings.scoring;
        const canPay    = !hardBlock && state.score > 0;
        if (hardBlock || !canPay) {
          if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
          drag = null;
          return;
        }
        state.score--;
        renderHUD();
        if (inGrid) launchPenaltyPip(holderEl.getBoundingClientRect());
        forbiddenDieSlots.add(drag.dieId);
      }

      if (drag.originSlot) {
        if (settings.refundOnMove && forbiddenDieSlots.has(drag.dieId)) {
          forbiddenDieSlots.delete(drag.dieId);
          const prevCardId   = parseInt(drag.originSlot.split('-')[0], 10);
          const prevHolderEl = document.querySelector(`[data-slot="${drag.originSlot}"]`);
          const scoreEl      = document.getElementById('score-display');
          if (state.grid.includes(prevCardId) && prevHolderEl && scoreEl) {
            launchPip(prevHolderEl.getBoundingClientRect(), scoreEl.getBoundingClientRect(),
              () => { state.score++; renderHUD(); }, () => {});
          } else {
            state.score++; renderHUD();
          }
        }
        const [ocStr, osiStr] = drag.originSlot.split('-');
        state.cards[parseInt(ocStr, 10)].slots[parseInt(osiStr, 10)] = null;
      }

      const originCardId = drag.originSlot ? parseInt(drag.originSlot.split('-')[0], 10) : null;
      const fromTray = !drag.originSlot;
      card.slots[si] = drag.dieId;
      if (settings.square) updateSquareLayout(cardId);
      drag = null;

      updateScorePreview(cardId);
      if (originCardId !== null && originCardId !== cardId) updateScorePreview(originCardId);
      selectLeftmostTrayDie();
      render();
      if (fromTray) { checkPhaseTransition(); checkStuck(); }

    } else if (targetTrayId !== null && targetTrayId !== drag.dieId) {
      const ia = state.trayOrder.indexOf(drag.dieId);
      const ib = state.trayOrder.indexOf(targetTrayId);
      if (ia !== -1 && ib !== -1) {
        [state.trayOrder[ia], state.trayOrder[ib]] = [state.trayOrder[ib], state.trayOrder[ia]];
      }
      if (drag.originSlot) {
        const [ocStr, osiStr] = drag.originSlot.split('-');
        state.cards[parseInt(ocStr, 10)].slots[parseInt(osiStr, 10)] = null;
      }
      render();
    } else {
      if (drag.originSlot) {
        render();
      } else {
        if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
      }
    }

    drag = null;
  });

  document.addEventListener('pointercancel', () => {
    if (!drag) return;
    if (dragCommitted && drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
    clearForbiddenHolders();
    ghost.classList.remove('is-visible');
    ghost.classList.remove('die-drag');
    drag = null;
    document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
    document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));
    document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
    clearTrayReturnPreview(drag);
  });
}
