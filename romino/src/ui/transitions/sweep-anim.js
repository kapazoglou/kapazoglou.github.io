import { state, clearScoreExitTimers } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { spawnCard } from '../../logic/cards.js';
import { drawFromCardDeck, nextComboForSlotCount } from '../../logic/dice.js';
import { lineExitKey, getGridLines, findScoringMatchOnLine, SCORING_RULE_LABELS, peekAnyScoringMatch } from '../../logic/sweeps.js';
import { addCoolOffSweepCards } from '../../logic/cool-off.js';
import { BEAT_MS, SWEEP_MS } from './timing.js';
// Circular: phase.js imports resolveAllScoringSets from here.
import { checkPhaseTransition, maybeOfferPostSweepCard } from '../../logic/phase.js';
import { render } from '../display/render.js';

export function startScoringExitAnimation(lineSlots, ruleId, cardIds) {
  clearScoreExitTimers();
  state.scoringExit = {
    lineSlots: [...lineSlots],
    cardIds:   [...cardIds],
    ruleId,
    lineKey:   lineExitKey(lineSlots),
    phase:     'wait',
  };
  document.getElementById('app')?.classList.add('is-scoring-exit');
  render();

  state.scoreExitBeatTimer = setTimeout(() => {
    state.scoreExitBeatTimer = null;
    if (!state.scoringExit) return;
    state.scoringExit.phase = 'run';
    render();
    state.scoreExitDoneTimer = setTimeout(() => {
      state.scoreExitDoneTimer = null;
      commitScoringExit();
    }, spd(SWEEP_MS));
  }, spd(BEAT_MS));
}

/** After one line sweep: record it, manage cross-line overlay, then drain queue. */
export function commitScoringExit() {
  clearScoreExitTimers();
  const se = state.scoringExit;
  if (!se) return;

  state.scoredSets.push({
    ruleId:      se.ruleId,
    label:       SCORING_RULE_LABELS[se.ruleId] || se.ruleId,
    cardIds:     [...se.cardIds],
    slotIndices: [...se.lineSlots],
  });
  addCoolOffSweepCards(se.cardIds);
  state.scoringExit = null;
  document.getElementById('app')?.classList.remove('is-scoring-exit');

  const stillNeeded = new Set(state.pendingLineSweeps.flatMap(p => p.lineSlots));

  for (let pos = 0; pos < se.lineSlots.length; pos++) {
    const slotIdx = se.lineSlots[pos];
    if (stillNeeded.has(slotIdx)) {
      state.sweepOverlay[slotIdx] = se.cardIds[pos];
    } else {
      delete state.sweepOverlay[slotIdx];
    }
    state.grid[slotIdx] = null;
  }

  if (state.pendingLineSweeps.length > 0) {
    const next = state.pendingLineSweeps.shift();
    startScoringExitAnimation(next.lineSlots, next.ruleId, next.cardIds);
    return;
  }

  state.sweepOverlay = {};

  resolveAllScoringSets();

  if (!state.scoringExit && !peekAnyScoringMatch()) {
    maybeOfferPostSweepCard();
    if (state.pendingPostSweepCards > 0) {
      state.phase = 'place-card';
      if (settings.diceDecks) {
        state.pendingCardSlotCount = drawFromCardDeck();
      }
      const slotCount = settings.diceDecks ? state.pendingCardSlotCount : 3;
      const nc1 = spawnCard(slotCount);
      state.actionBarCards = [nc1];
      state.newCards = new Set([nc1]);
      state.selectedCardId = nc1;
      state.selectedDieId  = null;
      if (state.pendingPostSweepCards > 1) {
        state.pendingSecondNewCard = spawnCard(slotCount);
      }
      state.pendingPostSweepCards = 0;
    } else {
      checkPhaseTransition();
      return;
    }
  }
  render();
}

export function resolveOneScoringSet() {
  if (state.scoringExit) return false;

  const allMatches = [];
  for (const line of getGridLines()) {
    const match = findScoringMatchOnLine(line);
    if (match) allMatches.push({
      lineSlots: match.filteredLineSlots,  // only non-empty positions (3 slots in 4×4 + emptyCards)
      lineKey:   lineExitKey(line),        // direction derived from the original full line
      ruleId:    match.ruleId,
      cardIds:   match.cardIds,
    });
  }
  if (!allMatches.length) return false;

  const [first, ...rest] = allMatches;
  state.pendingLineSweeps = rest;

  for (const pending of rest) {
    for (let i = 0; i < pending.lineSlots.length; i++) {
      const slotIdx = pending.lineSlots[i];
      if (state.grid[slotIdx] !== null) {
        state.sweepOverlay[slotIdx] = pending.cardIds[i];
      }
    }
  }

  startScoringExitAnimation(first.lineSlots, first.ruleId, first.cardIds);
  return true;
}

export function resolveAllScoringSets() {
  if (state.scoringExit) return;
  resolveOneScoringSet();
}
