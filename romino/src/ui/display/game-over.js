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
import { applySweptSuitsEndBonus } from '../../logic/suit-tally.js';
import { disarmEndGamePrompt } from './end-game-prompt.js';
import { render } from './render.js';
import { renderLifetimeStatsView } from './lifetime-stats-view.js';

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

let lifetimeMatrixMode = 'converted';
let lastLifetimeRecord = null;

function renderLifetimeStats(record) {
  renderLifetimeStatsView({
    settingsObj: record.settings,
    summaryId: 'go-lifetime-summary',
    starsId: 'go-lifetime-stars',
    diceId: 'go-lifetime-dice',
    tilesId: 'go-lifetime-tiles',
    compareId: 'go-lifetime-compare',
    compareRecord: record,
    matrixMode: lifetimeMatrixMode,
    matrixSegId: 'go-tile-matrix-seg',
  });
}

function setLifetimeMatrixMode(mode) {
  if (mode !== 'converted' && mode !== 'swept') return;
  lifetimeMatrixMode = mode;
  if (lastLifetimeRecord) renderLifetimeStats(lastLifetimeRecord);
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

function scoreBreakdownHTML(sweptScore, breakdown) {
  const finalTotal = sweptScore + breakdown.total;
  const fmtSigned = (sign, n) => {
    if (n === 0) return '0';
    return sign === '−' ? `−${n}` : `+${n}`;
  };
  const rows = [
    { label: 'swept', text: String(sweptScore), neg: false },
    { label: 'unique', text: fmtSigned('+', breakdown.comboBonus), neg: false },
    { label: 'duplicates', text: fmtSigned('−', breakdown.dupPenalty), neg: breakdown.dupPenalty > 0 },
    { label: 'lowest suit', text: fmtSigned('+', breakdown.suitBonus), neg: false },
  ];
  const lineHTML = rows.map(({ label, text, neg }) => {
    const valueClass = neg ? ' go-breakdown-value--neg' : '';
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

function renderScoreBreakdown(sweptScore, breakdown) {
  const el = document.getElementById('go-score-breakdown');
  const statRow = document.getElementById('go-stat-row');
  if (!el) return;
  el.innerHTML = scoreBreakdownHTML(sweptScore, breakdown);
  el.hidden = false;
  if (statRow) statRow.hidden = true;
}

function hideScoreBreakdown() {
  const el = document.getElementById('go-score-breakdown');
  const statRow = document.getElementById('go-stat-row');
  if (el) {
    el.innerHTML = '';
    el.hidden = true;
  }
  if (statRow) statRow.hidden = false;
}

export function showGameOver(reason = '') {
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) {
    overlay.classList.remove('is-minimized');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  }

  const titleEl = document.getElementById('game-over-title');
  if (titleEl) {
    titleEl.textContent = reason === 'well-done' ? 'WELL DONE' : 'GAME OVER';
  }

  const reasonEl = document.getElementById('game-over-reason');
  if (reasonEl) reasonEl.textContent = reason === 'well-done' ? '' : reason;

  const sweptScore = state.points;
  if (settings.sweptSuits) {
    renderScoreBreakdown(sweptScore, applySweptSuitsEndBonus());
  } else {
    hideScoreBreakdown();
  }

  const score = state.points;
  const rolls = state.rollCount;
  const sweeps = state.sweepHistory.length;

  const record = buildGameRecord({ reason });
  appendGameRecord(record);
  updateLifetimeStats(record);

  const scoreEl = document.getElementById('go-score-value');
  if (scoreEl) scoreEl.textContent = String(score);

  const rollsEl = document.getElementById('go-rolls-value');
  if (rollsEl) rollsEl.textContent = String(rolls);

  const sweepsCountEl = document.getElementById('go-sweeps-count-value');
  if (sweepsCountEl) sweepsCountEl.textContent = String(sweeps);

  const sweepsEl = document.getElementById('go-sweeps');
  if (sweepsEl) sweepsEl.innerHTML = sweepListHTML();

  lifetimeMatrixMode = 'converted';
  lastLifetimeRecord = record;
  renderLifetimeStats(record);

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

  document.getElementById('go-tile-matrix-seg')?.addEventListener('click', e => {
    const btn = e.target.closest('.go-tile-matrix-seg-btn[data-mode]');
    if (!btn) return;
    setLifetimeMatrixMode(btn.dataset.mode);
  });
}
