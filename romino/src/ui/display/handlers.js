import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { returnDieToBar, getValidSlotsForDie, slotFromHintDataset, isSwapRefundableDie, isReturnablePlacedDie, findDieColumn } from '../../logic/row.js';
import {
  handleRollButton,
  scheduleRender,
  isRollButtonEndGameTap,
  getRollButtonEndGameReason,
  commitRollButtonGameOver,
} from '../../logic/turn.js';
import {
  armEndGamePrompt,
  disarmEndGamePrompt,
  getPendingEndGameReason,
  isEndGamePromptArmed,
} from './end-game-prompt.js';
import { placeDieWithAnim } from '../transitions/placement-anim.js';
import { render, renderSelection } from './render.js';
import { attemptPlacementAtPoint, attemptPushBelowOnBottomDie } from './placement-input.js';
import { consumeRowClickBlock } from './drag-drop.js';
import { tryRefundSwapStack } from '../transitions/stack-swap-anim.js';
import { startPairSweepAnimation } from './dealt-strip.js';
import { stripTileHasRowDuplicate } from '../../logic/dealt-strip.js';
import { toggleDominoSpotsVisibility } from './domino-spot-strip.js';
import { isDominoHandMode, isDominoHandLocked, previewHandDomino } from '../../logic/domino-roll.js';

export function initHandlers() {
  document.getElementById('app').addEventListener('click', e => {
    if (e.target.closest('#action-bar-deck')) {
      toggleDominoSpotsVisibility();
      return;
    }

    if (state.phase === 'animating' || state.phase === 'replay') return;

    const handStack = e.target.closest('[data-hand-index]');
    if (handStack && isDominoHandMode() && !isDominoHandLocked()) {
      const i = Number(handStack.dataset.handIndex);
      if (!Number.isNaN(i) && previewHandDomino(i)) {
        render();
      }
      return;
    }

    // A tap that already acted on a die (return / swap-refund) swallows its trailing click,
    // so it can't re-trigger push-below or placement on the same target.
    if (consumeRowClickBlock()) return;

    const placedDie = e.target.closest('.die--placed');

    if (
      placedDie
      && state.selectedDieId != null
      && state.actionBar.includes(state.selectedDieId)
      && state.phase === 'rolled'
    ) {
      const pushResult = attemptPushBelowOnBottomDie(state.selectedDieId, placedDie);
      if (pushResult !== 'none') return;
    }

    if (placedDie && state.phase === 'rolled') {
      const placedDieId = Number(placedDie.dataset.dieId);
      if (
        !Number.isNaN(placedDieId)
        && isSwapRefundableDie(placedDieId)
        && !isReturnablePlacedDie(placedDieId)
      ) {
        const loc = findDieColumn(placedDieId);
        if (loc && tryRefundSwapStack(loc.col)) return;
      }
    }

    const stripTile = e.target.closest('.dealt-strip-tile--accent[data-strip-id]');
    if (stripTile) {
      const stripId = Number(stripTile.dataset.stripId);
      if (stripTileHasRowDuplicate(stripId)) {
        startPairSweepAnimation(stripId);
      }
      return;
    }

    const rollWrap = e.target.closest('.roll-btn-wrap');
    if (rollWrap) {
      const koBtn = e.target.closest('#roll-btn-endgame-confirm');
      if (koBtn && isEndGamePromptArmed()) {
        const reason = getPendingEndGameReason();
        disarmEndGamePrompt();
        commitRollButtonGameOver(reason);
        return;
      }

      const rollBtn = rollWrap.querySelector('#roll-btn');
      if (rollBtn && !rollBtn.disabled) {
        if (isEndGamePromptArmed()) {
          disarmEndGamePrompt();
          scheduleRender(render);
          return;
        }
        if (isRollButtonEndGameTap()) {
          armEndGamePrompt(getRollButtonEndGameReason());
          scheduleRender(render);
          return;
        }
        const result = handleRollButton();
        if (result && typeof result === 'object' && result.pendingEndGame) {
          armEndGamePrompt(result.pendingEndGame, 'pending-roll');
        }
        if (result && (result === true || (typeof result === 'object' && result.pendingEndGame))) {
          if (state.phase !== 'replay') scheduleRender(render);
        }
        return;
      }
    }

    if (settings.directPlacement) {
      if (e.target.closest('#placement-row') && !e.target.closest('.die--placed, .placement-tile--returnable')) {
        if (state.selectedDieId != null) {
          const result = attemptPlacementAtPoint(state.selectedDieId, e.clientX, e.clientY);
          if (result === 'placed' || result === 'invalid') return;
        }
        state.selectedDieId = null;
        renderSelection();
        return;
      }
      return;
    }

    const hint = e.target.closest('.placement-hint');
    if (hint && state.selectedDieId != null) {
      placeDieWithAnim(state.selectedDieId, slotFromHintDataset(hint.dataset));
      return;
    }

    const ghostEdge = e.target.closest('.placement-col--ghost-edge');
    if (ghostEdge && state.selectedDieId != null) {
      const edge = ghostEdge.dataset.edge;
      const slot = getValidSlotsForDie(state.selectedDieId).find(
        s => s.kind === 'insert' && (edge === 'left' ? s.leftCol === null : s.rightCol === null),
      );
      if (slot) {
        placeDieWithAnim(state.selectedDieId, slot);
        return;
      }
    }

    const ghostFirst = e.target.closest('.placement-col--ghost-first');
    if (ghostFirst && state.selectedDieId != null) {
      const slot = getValidSlotsForDie(state.selectedDieId).find(s => s.kind === 'new-column');
      if (slot) {
        placeDieWithAnim(state.selectedDieId, slot);
        return;
      }
    }

    if (e.target.closest('#placement-row') && !e.target.closest('.die--placed, .placement-tile--returnable')) {
      state.selectedDieId = null;
      renderSelection();
    }
  });
}
