import { state } from '../../logic/state.js';
import { SUIT_COLOR } from '../../logic/dice-visual.js';
import { getHighscores, recordHighscore } from '../../logic/highscores.js';
import {
  buildGameRecord,
  appendGameRecord,
  updateLifetimeStats,
} from '../../logic/game-log.js';
import { resetGame } from '../../logic/turn.js';
import { settings } from '../../logic/settings.js';
import {
  computeSweptSuitsEndBonus,
  discoveryWinMultiplierBonus,
  DISCOVERY_FLAWLESS_REASON,
  DISCOVERY_WIN_REASON,
} from '../../logic/suit-tally.js';
import { fullSweepScoreMultiplier } from '../../logic/sweeps-row.js';
import { disarmEndGamePrompt } from './end-game-prompt.js';
import { render } from './render.js';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function miniTileHTML(tile) {
  const color = SUIT_COLOR[tile.suit] ?? '#404A59';
  return `<div class="go-tile-wrap">
    <div class="go-tile" style="color:${color}">
      <span class="go-tile-rank">${tile.rank}</span>
      <span class="go-tile-suit">${tile.suit}</span>
    </div>
  </div>`;
}

export function sweepListHTML() {
  if (!state.sweepHistory.length) {
    return '<div class="go-sweep-empty">no sweeps</div>';
  }
  const groups = state.sweepHistory.map(run => {
    const tiles = run.map(tile => miniTileHTML(tile)).join('');
    return `<div class="go-sweep-group">${tiles}</div>`;
  });
  return `<div class="go-sweeps-inline">${groups.join('')}</div>`;
}

export function leaderboardHTML(currentId = null) {
  const entries = getHighscores();
  if (!entries.length) {
    return '<div class="go-lb-empty">no scores yet</div>';
  }
  return entries.map(entry => {
    const currentClass = entry.id === currentId ? ' go-lb-row--current' : '';
    const date = dateFormatter.format(new Date(entry.at));
    return `<div class="go-lb-row${currentClass}">
      <span class="go-lb-date">${date}</span>
      <span class="go-lb-num">${entry.rolls}</span>
      <span class="go-lb-num">${entry.sweeps}</span>
      <span class="go-lb-num go-lb-score">${entry.score}</span>
    </div>`;
  }).join('');
}

function scoreBreakdownHTML(sweptScore, breakdown, fullSweepMult, discoveryBonus) {
  const subtotal = sweptScore + breakdown.total;
  const finalTotal = subtotal * fullSweepMult;
  const fmtSigned = (sign, n) => {
    if (n === 0) return '0';
    return sign === '−' ? `−${n}` : `+${n}`;
  };
  const rows = [
    { label: 'swept', text: String(sweptScore), neg: false },
  ];
  if (settings.sweptSuits) {
    rows.push(
      { label: 'unique', text: fmtSigned('+', breakdown.comboBonus), neg: false },
      { label: 'duplicates', text: fmtSigned('−', breakdown.dupPenalty), neg: breakdown.dupPenalty > 0 },
      { label: 'lowest suit', text: fmtSigned('+', breakdown.suitBonus), neg: false },
    );
  }
  if (fullSweepMult > 1) {
    const multLabel = discoveryBonus > 0 ? 'multiplier' : 'full sweeps';
    rows.push({ label: multLabel, text: `×${fullSweepMult}`, neg: false, accent: true });
  }
  const lineHTML = rows.map(({ label, text, neg, accent }) => {
    let valueClass = neg ? ' go-breakdown-value--neg' : '';
    if (accent) valueClass += ' go-breakdown-value--accent';
    return `<div class="go-breakdown-row">
      <span class="go-breakdown-label">${label}</span>
      <span class="go-breakdown-value${valueClass}">${text}</span>
    </div>`;
  }).join('');
  return `${lineHTML}
    <div class="go-breakdown-row go-breakdown-row--total">
      <span class="go-breakdown-label">total</span>
      <span class="go-breakdown-value">${finalTotal}</span>
    </div>`;
}

function renderScoreBreakdown(sweptScore, breakdown, fullSweepMult, discoveryBonus) {
  const el = document.getElementById('go-score-breakdown');
  if (!el) return;
  el.innerHTML = scoreBreakdownHTML(sweptScore, breakdown, fullSweepMult, discoveryBonus);
  el.hidden = false;
}

function hideScoreBreakdown() {
  const el = document.getElementById('go-score-breakdown');
  if (!el) return;
  el.innerHTML = '';
  el.hidden = true;
}

export function showGameOver(reason = '') {
  const overlay = document.getElementById('game-over-overlay');
  if (overlay?.classList.contains('is-visible')) return;
  if (overlay) {
    overlay.classList.remove('is-minimized');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  }

  const titleEl = document.getElementById('game-over-title');
  if (titleEl) {
    if (reason === 'well-done') titleEl.textContent = 'WELL DONE';
    else if (reason === DISCOVERY_FLAWLESS_REASON) titleEl.textContent = 'FLAWLESS DECK';
    else if (reason === DISCOVERY_WIN_REASON) titleEl.textContent = 'FULL DECK';
    else titleEl.textContent = 'GAME OVER';
  }

  const reasonEl = document.getElementById('game-over-reason');
  if (reasonEl) {
    const winReason = reason === 'well-done'
      || reason === DISCOVERY_WIN_REASON
      || reason === DISCOVERY_FLAWLESS_REASON;
    reasonEl.textContent = winReason ? '' : reason;
  }

  const sweptScore = state.points;
  const breakdown = settings.sweptSuits ? computeSweptSuitsEndBonus() : { total: 0 };
  const discoveryBonus = discoveryWinMultiplierBonus(reason);
  const fullSweepMult = fullSweepScoreMultiplier() + discoveryBonus;
  state.points = (sweptScore + breakdown.total) * fullSweepMult;

  if (settings.sweptSuits || fullSweepMult > 1) {
    renderScoreBreakdown(sweptScore, breakdown, fullSweepMult, discoveryBonus);
  } else {
    hideScoreBreakdown();
  }

  const score = state.points;
  const rolls = state.rollCount;
  const sweeps = state.sweepHistory.length;

  const record = buildGameRecord({ reason });
  appendGameRecord(record);
  updateLifetimeStats(record);

  const rollsEl = document.getElementById('go-rolls-value');
  if (rollsEl) rollsEl.textContent = String(rolls);

  const sweepsCountEl = document.getElementById('go-sweeps-count-value');
  if (sweepsCountEl) sweepsCountEl.textContent = String(sweeps);

  const sweepsEl = document.getElementById('go-sweeps');
  if (sweepsEl) sweepsEl.innerHTML = sweepListHTML();

  const { entry } = recordHighscore({ score, rolls, sweeps });
  const leaderboardEl = document.getElementById('go-leaderboard');
  if (leaderboardEl) leaderboardEl.innerHTML = leaderboardHTML(entry.id);
}

export function hideGameOver() {
  const overlay = document.getElementById('game-over-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-visible', 'is-minimized');
  overlay.setAttribute('aria-hidden', 'true');
}

export function initGameOver() {
  document.getElementById('go-handle')?.addEventListener('click', e => {
    if (e.target.closest('#game-over-restart')) return;
    document.getElementById('game-over-overlay')?.classList.toggle('is-minimized');
  });

  document.getElementById('game-over-restart')?.addEventListener('click', () => {
    hideGameOver();
    disarmEndGamePrompt();
    resetGame();
    render();
  });
}
