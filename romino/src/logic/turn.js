import { state, createInitialState, resetStateObject } from './state.js';
import { settings, clampSettings } from './settings.js';
import { spawnKnownDie, spawnRandomDie } from './dice.js';
import { isTrayStuck, countDiceInRow, rowHasThreeDiceStack } from './row.js';
import { initTileDeck, resolveCadenceDeal } from './tile-deck.js';
import { appendDealtStripTile } from './dealt-strip.js';
import { initFlankStacks, flankEndgamePending } from './deck-flank.js';
import { initDeckRemaining } from './deck-size.js';
import { resetGameLog } from './game-log.js';
import {
  initDominoPools,
  clearDominoTrayState,
  drawDominoRoll,
  settleDominoQuadRoll,
  tickDominoDeckOnRoll,
} from './domino-roll.js';

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
  initDeckRemaining();
  initDominoPools();
  clearDominoTrayState();
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

/** Mirrors action-bar.css face inset ring — warning red when enabled. */
export function isRollButtonWarningRedBorder() {
  if (state.phase === 'rolled' && isTrayStuck()) return true;
  if (isRollPoolLow() && !rowHasThreeDiceStack()) return true;
  return false;
}

/** Warning-red border tap → game over. Accent border → roll or confirm in handleRollButton. */
export function isRollButtonEndGameTap() {
  return isRollButtonWarningRedBorder();
}

export function canConfirm() {
  return state.phase === 'rolled'
    && state.placedThisTurn >= settings.nPlace;
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
    state.dealtStrip.length === 0
  );
}

/** @returns {string|null} reason string when a check fails */
export function evaluateGameOver(context) {
  clampSettings();
  if (context === 'idle-roll' && state.dicePool < settings.nRoll) {
    return 'dice pool exhausted';
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

/** Reason string for warning-red roll tap (eligibility unchanged — UI defers commit). */
export function getRollButtonEndGameReason() {
  return state.phase === 'rolled'
    ? 'no legal placements'
    : (evaluateGameOver('idle-roll') ?? 'dice pool exhausted');
}

/** Confirm KO tap — only roll-button paths use this; auto paths call enterGameOver directly. */
export function commitRollButtonGameOver(reason) {
  enterGameOver(reason);
}

/** After confirm animations: auto-roll or pool/stuck game over. */
export function tryContinueAfterConfirm() {
  state.phase = 'idle';
  const rollResult = rollDice();
  if (!rollResult) {
    enterGameOver(evaluateGameOver('idle-roll') ?? 'dice pool exhausted');
    return;
  }
  if (rollResult === 'well-done') {
    enterGameOver('well-done');
    return;
  }
  const stuckReason = evaluateGameOver('post-roll');
  if (stuckReason) enterGameOver(stuckReason);
}

/**
 * @returns {null | 'ok' | 'well-done'}
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
  clearDominoTrayState();

  const useDominoRoll = settings.dominoRoll && (count === 2 || count === 3 || count === 4);
  if (useDominoRoll) {
    const drawResult = drawDominoRoll(count);
    if (!drawResult) return null;
    const { values, pairGroups, pairComboKeys } = drawResult;
    for (const value of values) {
      const id = spawnKnownDie(value);
      state.actionBar.push(id);
      state.newTrayDieIds.add(id);
    }
    if (pairGroups) {
      state.dominoPairGroups = [
        [state.actionBar[0], state.actionBar[1]],
        [state.actionBar[2], state.actionBar[3]],
      ];
      state.dominoPairComboKeys = pairComboKeys ?? null;
    }
    tickDominoDeckOnRoll(count);
  } else {
    for (let i = 0; i < count; i++) {
      const id = spawnRandomDie();
      state.actionBar.push(id);
      state.newTrayDieIds.add(id);
    }
  }
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.selectedDieId = null;

  if (settings.tileDealtEvery > 0 && !settings.deckFlank && state.rollCount % settings.tileDealtEvery === 0) {
    const deal = resolveCadenceDeal();
    if (deal.deckDepleted) return 'well-done';
    if (deal.tile) appendDealtStripTile(deal.tile);
  }

  state.phase = 'rolled';
  return 'ok';
}

export function confirmTurn() {
  if (!canConfirm()) return false;

  settleDominoQuadRoll(state.placedDieIds);

  state.dicePool += state.actionBar.length;
  state.actionBar = [];
  state.starNewDieIds = new Set(state.placedDieIds);
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.selectedDieId = null;
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

/**
 * @returns {false | true | { pendingEndGame: string }}
 */
export function handleRollButton() {
  if (state.phase === 'animating' || state.phase === 'replay') return false;

  if (state.phase === 'rolled') {
    if (!confirmTurn()) return false;
    return true;
  }
  if (state.phase === 'idle') {
    if (canRoll()) {
      const rollResult = rollDice();
      if (rollResult === 'well-done') {
        return { pendingEndGame: 'well-done' };
      }
      const stuckReason = evaluateGameOver('post-roll');
      if (stuckReason) {
        return { pendingEndGame: stuckReason };
      }
      return true;
    }
  }
  return false;
}

export { createInitialState };
