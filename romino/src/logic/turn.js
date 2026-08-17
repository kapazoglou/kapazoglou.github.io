import { state, createInitialState, resetStateObject } from './state.js';
import { settings, clampSettings } from './settings.js';
import { spawnKnownDie, spawnRandomDie } from './dice.js';
import { isTrayStuck, countDiceInRow, countTilesInRow, rowHasThreeDiceStack } from './row.js';
import { initTileDeck, resolveCadenceDeal } from './tile-deck.js';
import { appendDealtStripTile } from './dealt-strip.js';
import { initFlankStacks, flankEndgamePending } from './deck-flank.js';
import { initDeckRemaining } from './deck-size.js';
import { resetGameLog } from './game-log.js';
import { seedStartingDice } from './starting-dice.js';
import {
  initDominoPools,
  clearDominoTrayState,
  drawDominoRoll,
  canDrawDominoRoll,
  settleDominoQuadRoll,
  settleDominoRollOnConfirm,
  setCurrentRollOfferedKeys,
  canShowDominoPairReroll,
  canApplyDominoPairReroll,
  discardOfferedDominoKeys,
  isDominoPairRollTray,
  isDominoHandMode,
  dominoHandBothDicePlaced,
  isDominoHandAndPoolExhausted,
  lockHandDomino,
  refillDominoHandOne,
  clearHandPreviewState,
} from './domino-roll.js';
import {
  setDominoOfferedKeys,
  clearAllDominoSpotBindings,
  seedStartingDominoSpots,
  settleDominoSpotsOnConfirm,
  isDominoSpotsActive,
  dominoSpotAssignmentGameOverReason,
} from './domino-spots.js';
import { discoveryWinGameOverReason, suitTallyGameOverReason } from './suit-tally.js';
import { getStarEligibleDieIds } from './stars.js';
import { playSfx } from '../ui/transitions/sfx.js';
import { resetStarCreatedSfxKeys } from '../ui/display/placement-row.js';

/** Starting star balance — `startingStars` plus rerollOuter / domino-pair seed (N-place each). */
export function initialStarCount() {
  let count = settings.startingStars;
  if (settings.dominoRoll && settings.nRoll === 2 && settings.nPlace === 2) count += settings.nPlace;
  else if (settings.dominoRoll && settings.nRoll === 1) count += 1;
  else if (settings.rerollOuter) count += settings.nPlace;
  return count;
}

export function resetGame() {
  resetStateObject();
  resetStarCreatedSfxKeys();
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
  clearAllDominoSpotBindings();
  seedStartingDice();
  if (isDominoHandMode() && state.dominoHandKeys.length === 0) {
    triggerGameOver('domino pool exhausted');
    return;
  }
  if (!seedStartingDominoSpots()) {
    triggerGameOver('domino pool exhausted');
  }
}

/** nRoll=4 + dominoRoll: only N-place dice consumed net (unused pair returns on confirm). */
function isDominoQuadRoll() {
  return settings.dominoRoll && settings.nRoll === 4;
}

/** Domino Roll: active pool cannot satisfy next draw (Spots ON: empty pool; Spots OFF: no reshuffles left). */
function isDominoPoolRollBlocked() {
  if (!settings.dominoRoll) return false;
  if (isDominoHandMode()) return isDominoHandAndPoolExhausted();
  if (settings.nRoll !== 2 && settings.nRoll !== 3 && settings.nRoll !== 4) return false;
  return !canDrawDominoRoll();
}

/** Dice not on row — matches roll-button label. */
export function rollAffordanceRemaining() {
  const withheld = settings.tileDiceHold ? state.diceWithheld : 0;
  return settings.nDice - countDiceInRow() - withheld;
}

/** Pool-low / endgame threshold (N-place for nRoll=4 + dominoRoll; else N-roll). */
function rollPoolLowThreshold() {
  if (isDominoQuadRoll()) {
    return settings.nPlace;
  }
  return settings.nRoll;
}

/** dicePool debit per roll (N-place for nRoll=4 + dominoRoll; else N-roll). */
function rollDicePoolCost() {
  return rollPoolLowThreshold();
}

export function canRoll() {
  if (isDominoHandMode()) return false;
  if (state.phase !== 'idle') return false;
  clampSettings();
  if (isDominoPoolRollBlocked()) return flankEndgamePending();
  if (isDominoQuadRoll()) {
    if (rollAffordanceRemaining() >= settings.nPlace) return true;
  } else if (state.dicePool >= settings.nRoll) {
    return true;
  }
  return flankEndgamePending();
}

export function canEndGame() {
  if (state.phase !== 'idle') return false;
  clampSettings();
  if (isDominoSpotAssignmentBlocked()) return true;
  if (isDominoPoolRollBlocked()) return true;
  if (isDominoHandMode()) return false;
  if (isDominoQuadRoll()) {
    return rollAffordanceRemaining() < settings.nPlace;
  }
  return state.dicePool < settings.nRoll;
}

/** Remaining dice below pool-low threshold — warning-red number, border, KO tap. */
export function isRollPoolLow() {
  clampSettings();
  return rollAffordanceRemaining() < rollPoolLowThreshold();
}

/** @deprecated alias — same as isRollPoolLow */
export function isRollPoolNumberLow() {
  return isRollPoolLow();
}

/** Mirrors action-bar.css face inset ring — warning red when enabled. */
export function isRollButtonWarningRedBorder() {
  if (isDominoSpotAssignmentBlocked()) return true;
  if (state.phase === 'rolled' && isTrayStuck()) return true;
  if ((isRollPoolLow() || isDominoPoolRollBlocked()) && !rowHasThreeDiceStack()) return true;
  return false;
}

/** Warning-red border tap → game over. Accent border → roll or confirm in handleRollButton. */
export function isRollButtonEndGameTap() {
  return isRollButtonWarningRedBorder();
}

export function canConfirm() {
  if (state.phase !== 'rolled') return false;
  if (isDominoHandMode()) return dominoHandBothDicePlaced();
  return state.placedThisTurn >= settings.nPlace;
}

/** True when leaving the page would discard an in-progress session (not fresh reset / game over). */
export function shouldWarnOnLeave() {
  if (state.phase === 'replay') return false;
  clampSettings();
  const seeded = settings.startingDice;
  return !(
    state.phase === 'idle' &&
    state.rollCount === 0 &&
    state.dicePool === settings.nDice - seeded &&
    countDiceInRow() === seeded &&
    countTilesInRow() === 0 &&
    state.points === 0 &&
    state.stars === initialStarCount() &&
    state.actionBar.length === 0 &&
    state.dealtStrip.length === 0
  );
}

/** Row column lacks a seam domino — loss state; KO via roll button only. */
export function isDominoSpotAssignmentBlocked() {
  return dominoSpotAssignmentGameOverReason() != null;
}

/** @returns {string|null} reason string when a check fails */
export function evaluateGameOver(context) {
  clampSettings();
  if (context === 'idle-roll' || context === 'post-roll') {
    const spotReason = dominoSpotAssignmentGameOverReason();
    if (spotReason) return spotReason;
  }
  const winContexts = context === 'post-confirm' || context === 'post-roll' || context === 'idle-roll';
  const discoveryReason = discoveryWinGameOverReason();
  if (discoveryReason && winContexts) return discoveryReason;
  const suitCapReason = suitTallyGameOverReason();
  if (suitCapReason && winContexts) return suitCapReason;
  if (context === 'idle-roll') {
    if (isDominoPoolRollBlocked()) return 'domino pool exhausted';
    if (isDominoQuadRoll()) {
      if (rollAffordanceRemaining() < settings.nPlace) return 'dice pool exhausted';
    } else if (!isDominoHandMode() && state.dicePool < settings.nRoll) {
      return 'dice pool exhausted';
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
  if (state.phase === 'replay') return;
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
  const spotReason = dominoSpotAssignmentGameOverReason();
  if (spotReason) return spotReason;
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
  const suitCapReason = evaluateGameOver('post-confirm');
  if (suitCapReason) {
    enterGameOver(suitCapReason);
    return;
  }
  if (isDominoHandMode()) {
    const blockedReason = evaluateGameOver('idle-roll');
    if (blockedReason) enterGameOver(blockedReason);
    return;
  }
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
  const poolCost = rollDicePoolCost();

  if (flankEndgamePending() && state.dicePool < poolCost) {
    state.dicePool = poolCost;
  }

  state.rollCount += 1;
  state.dicePool -= poolCost;
  state.actionBar = [];
  state.newTrayDieIds = new Set();
  clearDominoTrayState();

  const useDominoRoll = settings.dominoRoll && (count === 2 || count === 3 || count === 4);
  if (useDominoRoll) {
    const drawResult = drawDominoRoll(count);
    if (!drawResult) {
      state.dicePool += poolCost;
      state.rollCount -= 1;
      return null;
    }
    const { values, pairGroups, pairComboKeys, comboKeys } = drawResult;
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
    const offeredKeys = comboKeys ?? pairComboKeys ?? [];
    if (isDominoSpotsActive()) {
      setDominoOfferedKeys(offeredKeys);
    } else {
      setCurrentRollOfferedKeys(offeredKeys);
    }
  } else {
    for (let i = 0; i < count; i++) {
      const id = spawnRandomDie();
      state.actionBar.push(id);
      state.newTrayDieIds.add(id);
    }
  }
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.pushBelowDieIds.clear();
  state.swapStackCols.clear();
  state.pushReminderCols.clear();
  state.swapReminderCols.clear();
  state.flippedDieIds.clear();
  state.selectedDieId = null;

  if (settings.tileDealtEvery > 0 && !settings.deckFlank && state.rollCount % settings.tileDealtEvery === 0) {
    const deal = resolveCadenceDeal();
    if (deal.deckDepleted) return 'well-done';
    if (deal.tile) {
      appendDealtStripTile(deal.tile);
      playSfx('tile_place');
    }
  }

  if (settings.dominoRoll && count === 2) {
    state.dominoPairRerollAvailable = true;
  }

  state.phase = 'rolled';
  playSfx('dice_roll');
  return 'ok';
}

/** nRoll=2 domino pair — star-pay: discard offer, random tray dice (no pool draw; counter unchanged). */
export function rerollDominoPairOffer() {
  if (!canApplyDominoPairReroll()) return null;

  for (const id of state.actionBar) delete state.dice[id];
  state.actionBar = [];
  state.selectedDieId = null;

  discardOfferedDominoKeys();
  state.dominoPairRerollAvailable = false;

  if (isDominoHandMode()) {
    state.dominoHandLocked = true;
    state.dominoHandPreviewKey = null;
    state.dominoHandSelectedIndex = null;
    state.dominoHandPreviewDieIds = [];
  }

  state.newTrayDieIds = new Set();
  for (let i = 0; i < 2; i++) {
    const id = spawnRandomDie();
    state.actionBar.push(id);
    state.newTrayDieIds.add(id);
    if (isDominoHandMode()) state.dominoHandPreviewDieIds.push(id);
  }

  return 'ok';
}

export function confirmTurn() {
  if (!canConfirm()) return false;

  if (isDominoHandMode()) {
    if (state.dicePool < settings.nRoll) return false;
    if (!state.dominoHandLocked) {
      lockHandDomino();
      state.rollCount += 1;
      state.dicePool -= settings.nRoll;
    }
  }

  if (isDominoSpotsActive()) {
    settleDominoSpotsOnConfirm(state.placedDieIds);
  } else {
    settleDominoRollOnConfirm();
    settleDominoQuadRoll(state.placedDieIds);
  }

  if (isDominoHandMode()) {
    refillDominoHandOne();
    clearHandPreviewState();
    state.dominoHandCommittedKey = null;
  }

  state.dicePool += state.actionBar.length;
  state.actionBar = [];
  state.starNewDieIds = getStarEligibleDieIds();
  state.placedThisTurn = 0;
  state.placedDieIds = new Set();
  state.pushBelowDieIds.clear();
  state.swapStackCols.clear();
  state.pushReminderCols.clear();
  state.swapReminderCols.clear();
  state.flippedDieIds.clear();
  state.selectedDieId = null;
  state.phase = 'animating';

  import('../ui/transitions/confirm-anim.js').then(({ runConfirmAnimations }) => {
    runConfirmAnimations(result => {
      if (result === 'well-done') {
        enterGameOver('well-done');
        return;
      }
      const reason = evaluateGameOver('post-confirm');
      if (reason) {
        enterGameOver(reason);
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
