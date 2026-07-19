import { state, createInitialState, resetStateObject } from './state.js';
import { settings, clampSettings } from './settings.js';
import { spawnRandomDie } from './dice.js';

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

export function confirmTurn(onDone) {
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
    runConfirmAnimations(() => {
      state.phase = 'idle';
      onDone?.();
    });
  });
  return true;
}

export function handleRollButton(onGameOver) {
  if (state.phase === 'animating' || state.phase === 'replay') return false;
  if (state.phase === 'rolled') {
    if (!confirmTurn(() => {
      if (!rollDice()) {
        state.phase = 'replay';
        onGameOver?.();
      }
    })) return false;
    return true;
  }
  if (state.phase === 'idle') {
    if (canRoll()) return rollDice();
    if (canEndGame()) {
      state.phase = 'replay';
      onGameOver?.();
      return true;
    }
  }
  return false;
}

export { createInitialState };
