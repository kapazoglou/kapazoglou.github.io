import { state, clearScoreExitTimers } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { collectScoringMatches, lineExitKey, SCORING_RULE_LABELS, peekAnyScoringMatch } from '../../logic/sweeps.js';
import { addCoolOffSweepCards } from '../../logic/cool-off.js';
import { bankScoreToSweptPoints } from './card-anim.js';
import { BEAT_MS, SWEEP_MS } from './timing.js';
// Circular: phase.js imports resolveAllScoringSets from here.
import { checkPhaseTransition, tryOfferCapacityCard } from '../../logic/phase.js';
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

  render();

  const finishSweepChain = () => {
    if (state.pendingLineSweeps.length > 0) {
      const next = state.pendingLineSweeps.shift();
      startScoringExitAnimation(next.lineSlots, next.ruleId, next.cardIds);
      return;
    }

    state.sweepOverlay = {};

    resolveAllScoringSets();
    if (state.scoringExit) return;

    bankScoreToSweptPoints(() => {
      if (!peekAnyScoringMatch()) {
        if (!tryOfferCapacityCard()) {
          checkPhaseTransition();
          return;
        }
      }
      render();
    });
  };

  finishSweepChain();
}

export function resolveOneScoringSet() {
  if (state.scoringExit) return false;

  const allMatches = collectScoringMatches().map(m => ({
    lineSlots: m.filteredLineSlots,
    lineKey:   m.lineKey,
    ruleId:    m.ruleId,
    cardIds:   m.cardIds,
  }));
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
