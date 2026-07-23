import { state, createInitialState, resetStateObject } from './state.js';
import { settings, clampSettings } from './settings.js';
import { spawnRandomDie } from './dice.js';
import { isTrayStuck, hasAnyLegalPlacementForDealtTile, clearDealtThisTurnFlags } from './row.js';
import { initTileDeck, resolveCadenceDeal } from './tile-deck.js';

/** Starting star balance for a fresh game (rerollOuter seeds N-place). */
export function initialStarCount() {
  return settings.rerollOuter ? settings.nPlace : 0;
}

export function resetGame() {
  resetStateObject();
  clampSettings();
  state.dicePool = settings.nDice;
  state.stars = initialStarCount();
  state.phase = 'idle';
  initTileDeck();
}

export function canRoll() {
  return state.phase === 'idle' && state.dicePool >= settings.nRoll;
}

export function canEndGame() {
  return state.phase === 'idle' && state.dicePool < settings.nRoll;
}

export function canConfirm() {
  return state.phase === 'rolled'
    && state.placedThisTurn >= settings.nPlace
    && !state.dealtTile;
}

/** True when leaving the page would discard an in-progress session (not fresh reset / game over). */
export function shouldWarnOnLeave() {
  if (state.phase === 'replay') return false;
  return !(
    state.phase === 'idle' &&
    state.dicePool === settings.nDice &&
    Object.keys(state.row).length === 0 &&
    state.points === 0 &&
    state.stars === initialStarCount() &&
    state.actionBar.length === 0 &&
    !state.dealtTile
  );
}

/** @returns {string|null} reason string when a check fails */
export function evaluateGameOver(context) {
  clampSettings();
  if (context === 'idle-roll' && state.dicePool < settings.nRoll) {
    return 'dice pool exhausted';
  }
  if (context === 'post-roll') {
    if (state.dealtTile && state.placedThisTurn >= settings.nPlace && !hasAnyLegalPlacementForDealtTile()) {
      return 'no legal placements';
    }
  }
  return null;
}

function enterGameOver(reason, onGameOver) {
  state.phase = 'replay';
  onGameOver?.(reason ?? '');
}

function applyCadenceDealResult(deal) {
  state.pendingDealtTile = null;
  state.dealingDiscardQueue = [];
  state.dealingDiscardTile = null;

  if (deal.deckDepleted) return 'deck-depleted';

  if (deal.discardedTiles.length) {
    state.dealingDiscardQueue = deal.discardedTiles.slice(1);
    state.dealingDiscardTile = deal.discardedTiles[0];
    state.pendingDealtTile = deal.dealtTile;
    state.phase = 'animating';
    return 'discard-anim';
  }

  if (deal.dealtTile) {
    state.dealtTile = deal.dealtTile;
    state.newDealtTile = true;
  }
  return 'ok';
}

/** After discard animations on roll: reveal pending tile and check stuck state. */
export function finishRollAfterDiscard(onGameOver) {
  if (state.pendingDealtTile) {
    state.dealtTile = state.pendingDealtTile;
    state.pendingDealtTile = null;
    state.newDealtTile = true;
  }
  state.dealingDiscardTile = null;
  state.dealingDiscardQueue = [];
  state.phase = 'rolled';
  const stuckReason = evaluateGameOver('post-roll');
  if (stuckReason) enterGameOver(stuckReason, onGameOver);
}

/** After confirm animations: auto-roll or pool/stuck game over. */
export function tryContinueAfterConfirm(onGameOver) {
  state.phase = 'idle';
  const rollResult = rollDice();
  if (!rollResult) {
    enterGameOver(evaluateGameOver('idle-roll') ?? 'dice pool exhausted', onGameOver);
    return;
  }
  if (rollResult === 'deck-depleted') {
    enterGameOver('deck depleted', onGameOver);
    return;
  }
  if (rollResult === 'discard-anim') {
    import('../ui/transitions/deal-discard-anim.js').then(({ runDealDiscardAnimations }) => {
      runDealDiscardAnimations(() => {
        finishRollAfterDiscard(onGameOver);
        import('../ui/display/render.js').then(({ render }) => render());
      });
    });
    return;
  }
  const stuckReason = evaluateGameOver('post-roll');
  if (stuckReason) enterGameOver(stuckReason, onGameOver);
}

/**
 * @returns {null | 'ok' | 'deck-depleted' | 'discard-anim'}
 */
export function rollDice() {
  if (!canRoll()) return null;
  clampSettings();
  const count = settings.nRoll;

  state.rollCount += 1;
  state.dicePool -= count;
  state.actionBar = [];
  state.newTrayDieIds = new Set();
  for (let i = 0; i < count; i++) {
    const id = spawnRandomDie();
    state.actionBar.push(id);
    state.newTrayDieIds.add(id);
  }
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.selectedDieId = null;
  state.selectedDealtTile = false;
  clearDealtThisTurnFlags();
  state.dealtTile = null;
  state.pendingDealtTile = null;
  state.dealingDiscardQueue = [];
  state.dealingDiscardTile = null;

  if (settings.tileDealtEvery > 0 && state.rollCount % settings.tileDealtEvery === 0) {
    const deal = resolveCadenceDeal({ chainDraw: settings.tileDealtChainDraw });
    const dealResult = applyCadenceDealResult(deal);
    if (dealResult !== 'ok') return dealResult;
  }

  state.phase = 'rolled';
  return 'ok';
}

export function confirmTurn(onGameOver) {
  if (!canConfirm()) return false;

  state.dicePool += state.actionBar.length;
  state.actionBar = [];
  state.starNewDieIds = new Set(state.placedDieIds);
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.selectedDieId = null;
  state.selectedDealtTile = false;
  clearDealtThisTurnFlags();
  state.dealtTile = null;
  state.phase = 'animating';

  import('../ui/transitions/confirm-anim.js').then(({ runConfirmAnimations }) => {
    runConfirmAnimations(() => tryContinueAfterConfirm(onGameOver));
  });
  return true;
}

export function handleRollButton(onGameOver) {
  if (state.phase === 'animating' || state.phase === 'replay') return false;
  if (state.phase === 'rolled') {
    if (isTrayStuck()) {
      enterGameOver('no legal placements', onGameOver);
      return true;
    }
    if (!confirmTurn(onGameOver)) return false;
    return true;
  }
  if (state.phase === 'idle') {
    if (canRoll()) {
      const rollResult = rollDice();
      if (rollResult === 'deck-depleted') {
        enterGameOver('deck depleted', onGameOver);
        return true;
      }
      if (rollResult === 'discard-anim') {
        import('../ui/transitions/deal-discard-anim.js').then(({ runDealDiscardAnimations }) => {
          runDealDiscardAnimations(() => {
            finishRollAfterDiscard(onGameOver);
            import('../ui/display/render.js').then(({ render }) => render());
          });
        });
        return true;
      }
      const stuckReason = evaluateGameOver('post-roll');
      if (stuckReason) {
        enterGameOver(stuckReason, onGameOver);
        return true;
      }
      return true;
    }
    if (canEndGame()) {
      enterGameOver(evaluateGameOver('idle-roll') ?? 'dice pool exhausted', onGameOver);
      return true;
    }
  }
  return false;
}

export { createInitialState };
