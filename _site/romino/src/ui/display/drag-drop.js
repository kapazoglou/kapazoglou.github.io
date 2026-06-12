import { state, forbiddenDieSlots } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { isSlotForbidden, dieSVG, diePipRotationDeg, updateSquareLayout } from '../../logic/cards.js';
import { cardIsGridRepositionable } from '../../logic/sweeps.js';
import { renderCardHTML } from './grid.js';
import { updateScorePreview } from '../../logic/scoring.js';
import { selectLeftmostTrayDie } from '../../logic/dice.js';
import { convertFilledCards, checkPhaseTransition, checkStuck } from '../../logic/phase.js';
import { resolveAllScoringSets } from '../transitions/sweep-anim.js';
import { render } from './render.js';
import { renderHUD } from './hud.js';
import { launchPip, launchPenaltyPip } from '../transitions/card-anim.js';

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
    e.preventDefault();
    const dieId      = parseInt(wrapper.dataset.dieId, 10);
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
      const slot = under?.closest('.grid-slot');
      if (slot) {
        const gi = parseInt(slot.dataset.gridSlot, 10);
        const empty  = state.grid[gi] === null;
        const origin = drag.fromGrid && drag.fromGridIndex === gi;
        if (empty || origin) slot.classList.add('drag-over');
      }
      return;
    }

    document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
    document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));

    const holderEl = under?.closest('.holder-dice');
    if (holderEl) {
      const slotKey = holderEl.dataset.slot;
      const [cidStr, siStr] = slotKey.split('-');
      const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
      const card = state.cards[cardId];
      const isLocked   = card && card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
      const isForbidden = holderEl.classList.contains('is-forbidden');
      const hardBlock   = isForbidden && (!settings.paidSlots || !settings.scoring);
      if (!isLocked && (!isForbidden || (!hardBlock && settings.scoring && state.score > 0))) holderEl.classList.add('drag-over');
    } else {
      const trayDie = under?.closest('.die-wrapper');
      if (trayDie && !trayDie.dataset.slot && parseInt(trayDie.dataset.dieId, 10) !== drag.dieId) {
        trayDie.classList.add('tray-swap-target');
      }
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
  });
}
