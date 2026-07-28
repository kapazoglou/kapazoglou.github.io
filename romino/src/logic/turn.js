import { state, createInitialState, resetStateObject } from './state.js';
import { settings, clampSettings } from './settings.js';
import { spawnRandomDie } from './dice.js';
import { isTrayStuck, hasAnyLegalPlacementForDealtTile, clearDealtThisTurnFlags, countDiceInRow } from './row.js';
import { initTileDeck, resolveCadenceDeal } from './tile-deck.js';
import { initFlankStacks, flankEndgamePending } from './deck-flank.js';
import { resetGameLog } from './game-log.js';

/** Starting star balance for a fresh game (rerollOuter seeds N-place). */
export function initialStarCount() {
  return settings.rerollOuter ? settings.nPlace : 0;
}

export function resetGame() {
  resetStateObject();
  resetGameLog();
  clampSettings();
  state.dicePool = settings.nDice;
  state.stars = initialStarCount();
  state.phase = 'idle';
  initTileDeck();
  initFlankStacks();
}

export function canRoll() {
  if (state.phase !== 'idle') return false;
  if (state.dicePool >= settings.nRoll) return true;
  return flankEndgamePending();
}

export function canEndGame() {
  return state.phase === 'idle' && state.dicePool < settings.nRoll;
}

/** Remaining dice below N-roll — drives `.roll-btn--low` warning-red chrome. */
export function isRollPoolLow() {
  clampSettings();
  return settings.nDice - countDiceInRow() < settings.nRoll;
}

/** Warning-red tap → game over: matches `.roll-btn--low` and `.roll-btn-wrap--stuck` chrome. */
export function isRollButtonEndGameTap() {
  if (isRollPoolLow()) return true;
  if (state.phase === 'rolled' && isTrayStuck()) return true;
  return false;
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

/** @type {((reason: string) => void) | null} */
let gameOverHandler = null;

/** Wire once from main — async confirm/sweep paths may not carry an inline callback. */
export function setGameOverHandler(fn) {
  gameOverHandler = fn;
}

export function triggerGameOver(reason, onGameOver) {
  state.phase = 'replay';
  const cb = onGameOver ?? gameOverHandler;
  cb?.(reason ?? '');
}

/** Schedule UI sync after the current click/pointer handler finishes. */
export function scheduleRender(renderFn) {
  requestAnimationFrame(() => renderFn());
}

function enterGameOver(reason) {
  triggerGameOver(reason);
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
export function finishRollAfterDiscard() {
  if (state.pendingDealtTile) {
    state.dealtTile = state.pendingDealtTile;
    state.pendingDealtTile = null;
    state.newDealtTile = true;
  }
  state.dealingDiscardTile = null;
  state.dealingDiscardQueue = [];
  state.phase = 'rolled';
  const stuckReason = evaluateGameOver('post-roll');
  if (stuckReason) enterGameOver(stuckReason);
}

/** After confirm animations: auto-roll or pool/stuck game over. */
export function tryContinueAfterConfirm() {
  state.phase = 'idle';
  const rollResult = rollDice();
  if (!rollResult) {
    enterGameOver(evaluateGameOver('idle-roll') ?? 'dice pool exhausted');
    return;
  }
  if (rollResult === 'deck-depleted') {
    enterGameOver('deck depleted');
    return;
  }
  if (rollResult === 'discard-anim') {
    import('../ui/transitions/deal-discard-anim.js').then(({ runDealDiscardAnimations }) => {
      runDealDiscardAnimations(() => {
        finishRollAfterDiscard();
        import('../ui/display/render.js').then(({ render }) => render());
      });
    });
    return;
  }
  const stuckReason = evaluateGameOver('post-roll');
  if (stuckReason) enterGameOver(stuckReason);
}

/**
 * @returns {null | 'ok' | 'deck-depleted' | 'discard-anim'}
 */
export function rollDice() {
  if (!canRoll()) return null;
  clampSettings();
  const count = settings.nRoll;

  if (flankEndgamePending() && state.dicePool < count) {
    state.dicePool = count;
  }

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

  if (settings.tileDealtEvery > 0 && !settings.deckFlank && state.rollCount % settings.tileDealtEvery === 0) {
    const deal = resolveCadenceDeal({ chainDraw: settings.tileDealtChainDraw });
    const dealResult = applyCadenceDealResult(deal);
    if (dealResult !== 'ok') return dealResult;
  }

  state.phase = 'rolled';
  return 'ok';
}

export function confirmTurn() {
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
    runConfirmAnimations(result => {
      if (result === 'well-done') {
        enterGameOver('well-done');
        return;
      }
      tryContinueAfterConfirm();
    });
  });
  return true;
}

export function handleRollButton() {
  if (state.phase === 'animating' || state.phase === 'replay') return false;

  if (isRollButtonEndGameTap()) {
    const reason = state.phase === 'rolled'
      ? 'no legal placements'
      : (evaluateGameOver('idle-roll') ?? 'dice pool exhausted');
    enterGameOver(reason);
    return true;
  }

  if (state.phase === 'rolled') {
    if (!confirmTurn()) return false;
    return true;
  }
  if (state.phase === 'idle') {
    if (canRoll()) {
      const rollResult = rollDice();
      if (rollResult === 'deck-depleted') {
        enterGameOver('deck depleted');
        return true;
      }
      if (rollResult === 'discard-anim') {
        import('../ui/transitions/deal-discard-anim.js').then(({ runDealDiscardAnimations }) => {
          runDealDiscardAnimations(() => {
            finishRollAfterDiscard();
            import('../ui/display/render.js').then(({ render }) => render());
          });
        });
        return true;
      }
      const stuckReason = evaluateGameOver('post-roll');
      if (stuckReason) {
        enterGameOver(stuckReason);
        return true;
      }
      return true;
    }
  }
  return false;
}

export { createInitialState };
