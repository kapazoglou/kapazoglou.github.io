import { state, createInitialState, resetStateObject } from './state.js';
import { settings, clampSettings } from './settings.js';
import { spawnRandomDie } from './dice.js';
import { countTilesInRow, hasAnyLegalPlacementForTray } from './row.js';

export function resetGame() {
  resetStateObject();
  clampSettings();
  state.dicePool = settings.nDice;
  state.phase = 'idle';
}

export function canRoll() {
  return state.phase === 'idle' && state.dicePool >= settings.nRoll;
}

export function canEndGame() {
  return state.phase === 'idle' && state.dicePool < settings.nRoll;
}

export function canConfirm() {
  return state.phase === 'rolled' && state.placedThisTurn >= settings.nPlace;
}

/** @returns {string|null} reason string when a check fails */
export function evaluateGameOver(context) {
  clampSettings();
  if (context === 'idle-roll' && state.dicePool < settings.nRoll) {
    return 'dice pool exhausted';
  }
  if (context === 'post-sweeps' && countTilesInRow() > settings.nTiles) {
    return 'too many tiles on row';
  }
  if (context === 'post-roll' && state.actionBar.length > 0 && !hasAnyLegalPlacementForTray()) {
    return 'no legal placements';
  }
  return null;
}

function enterGameOver(reason, onGameOver) {
  state.phase = 'replay';
  onGameOver?.(reason ?? '');
}

/** After confirm animations: tile cap, then auto-roll or pool/stuck game over. */
export function tryContinueAfterConfirm(onGameOver) {
  const tileReason = evaluateGameOver('post-sweeps');
  if (tileReason) {
    enterGameOver(tileReason, onGameOver);
    return;
  }
  state.phase = 'idle';
  if (!rollDice()) {
    enterGameOver(evaluateGameOver('idle-roll') ?? 'dice pool exhausted', onGameOver);
    return;
  }
  const stuckReason = evaluateGameOver('post-roll');
  if (stuckReason) enterGameOver(stuckReason, onGameOver);
}

export function rollDice() {
  if (!canRoll()) return false;
  clampSettings();
  const count = settings.nRoll;

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
  state.placementOrderThisTurn = [];
  state.selectedDieId = null;
  state.phase = 'rolled';
  return true;
}

export function confirmTurn(onGameOver) {
  if (!canConfirm()) return false;

  state.dicePool += state.actionBar.length;
  state.actionBar = [];
  state.starNewDieIds = new Set(state.placedDieIds);
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.placementOrderThisTurn = [];
  state.selectedDieId = null;
  state.phase = 'animating';

  import('../ui/transitions/confirm-anim.js').then(({ runConfirmAnimations }) => {
    runConfirmAnimations(() => tryContinueAfterConfirm(onGameOver));
  });
  return true;
}

export function handleRollButton(onGameOver) {
  if (state.phase === 'animating' || state.phase === 'replay') return false;
  if (state.phase === 'rolled') {
    if (!confirmTurn(onGameOver)) return false;
    return true;
  }
  if (state.phase === 'idle') {
    if (canRoll()) {
      rollDice();
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
