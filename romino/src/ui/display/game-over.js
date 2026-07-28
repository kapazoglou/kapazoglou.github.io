import { state } from '../../logic/state.js';
import { SUIT_COLOR, DISCARD_RANKS, JOKER_RANK } from '../../logic/dice-visual.js';
import { getHighscores, recordHighscore } from '../../logic/highscores.js';
import {
  buildGameRecord,
  appendGameRecord,
  updateLifetimeStats,
  getLifetimeStats,
  getLifetimeDerived,
} from '../../logic/game-log.js';
import { resetGame } from '../../logic/turn.js';
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

function formatAvg(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function sweepCountFromRecord(record) {
  return record.bankEvents.reduce((sum, e) => sum + e.sweeps.length, 0);
}

/** 13 rank rows: A + 2–12 + joker. */
const LIFETIME_TILE_RANKS = ['A', ...DISCARD_RANKS.slice(2, 13), JOKER_RANK];
/** Suit columns left → right: Z, X, Y, W. */
const LIFETIME_TILE_SUITS = ['Z', 'X', 'Y', 'W'];

let lifetimeMatrixMode = 'converted';
let lastLifetimeStats = null;

function updateMatrixSegUI(mode) {
  const seg = document.querySelector('.go-tile-matrix-seg');
  if (!seg) return;
  for (const btn of seg.querySelectorAll('.go-tile-matrix-seg-btn[data-mode]')) {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }
}

function renderLifetimeTileMatrix(lifetime, mode) {
  const counts = mode === 'swept' ? lifetime.sweepTileCounts : lifetime.tileCounts;
  const tilesEl = document.getElementById('go-lifetime-tiles');
  if (tilesEl) tilesEl.innerHTML = lifetimeTileMatrixHTML(counts);
  updateMatrixSegUI(mode);
}

function setLifetimeMatrixMode(mode) {
  if (mode !== 'converted' && mode !== 'swept') return;
  lifetimeMatrixMode = mode;
  if (lastLifetimeStats) renderLifetimeTileMatrix(lastLifetimeStats, mode);
}

function lifetimeTileMatrixHTML(tileCounts) {
  const headerCells = LIFETIME_TILE_SUITS.map(suit => {
    const color = SUIT_COLOR[suit] ?? 'var(--text-dim)';
    return `<th class="go-tile-matrix-suit" scope="col" style="color:${color}">${suit}</th>`;
  }).join('');

  const bodyRows = LIFETIME_TILE_RANKS.map(rank => {
    const cells = LIFETIME_TILE_SUITS.map(suit => {
      const count = tileCounts[`${suit}:${rank}`] ?? 0;
      const filled = count > 0 ? ' go-tile-matrix-cell--filled' : '';
      return `<td class="go-tile-matrix-cell${filled}">${count}</td>`;
    }).join('');
    return `<tr>
      <th class="go-tile-matrix-rank" scope="row">${rank}</th>
      ${cells}
    </tr>`;
  }).join('');

  return `<table class="go-tile-matrix">
    <thead>
      <tr>
        <th class="go-tile-matrix-corner" scope="col"></th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

function lifetimeDiceBarsHTML(dicePct) {
  const maxPct = Math.max(...Object.values(dicePct), 1);
  let bars = '';
  for (let n = 1; n <= 6; n++) {
    const pct = dicePct[n] ?? 0;
    const height = Math.max(4, Math.round((pct / maxPct) * 100));
    bars += `<div class="go-dice-bar-col">
      <div class="go-dice-bar" style="height:${height}%"></div>
      <span class="go-dice-bar-label">${n}</span>
    </div>`;
  }
  return `<div class="go-dice-bars">${bars}</div>`;
}

function renderLifetimeStats(record) {
  const lifetime = getLifetimeStats(record.settings);
  const derived = getLifetimeDerived(lifetime);
  const runSweeps = sweepCountFromRecord(record);

  const summaryEl = document.getElementById('go-lifetime-summary');
  if (summaryEl) {
    summaryEl.textContent = `${lifetime.gamesPlayed} games · avg ${formatAvg(derived.avgScore)} pts · ${lifetime.totalRolls} rolls`;
  }

  const starsEl = document.getElementById('go-lifetime-stars');
  if (starsEl) {
    starsEl.textContent = `⭐ ${lifetime.totalStarsEarned} earned · ${lifetime.totalStarsSpent} spent`;
  }

  const compareEl = document.getElementById('go-lifetime-compare');
  if (compareEl) {
    compareEl.innerHTML = `
      <div class="go-compare-row">
        <span class="go-compare-label">score</span>
        <span class="go-compare-run">${record.score}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgScore)} avg</span>
      </div>
      <div class="go-compare-row">
        <span class="go-compare-label">rolls</span>
        <span class="go-compare-run">${record.rolls}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgRolls)} avg</span>
      </div>
      <div class="go-compare-row">
        <span class="go-compare-label">sweeps</span>
        <span class="go-compare-run">${runSweeps}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgSweepRuns)} avg</span>
      </div>
      <div class="go-compare-row">
        <span class="go-compare-label">stars</span>
        <span class="go-compare-run">${record.starsEarned}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgStarsEarned)} avg</span>
      </div>`;
  }

  const diceEl = document.getElementById('go-lifetime-dice');
  if (diceEl) {
    diceEl.innerHTML = lifetimeDiceBarsHTML(derived.dicePct);
  }

  lastLifetimeStats = lifetime;
  lifetimeMatrixMode = 'converted';
  renderLifetimeTileMatrix(lifetime, lifetimeMatrixMode);
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
    resetGame();
    render();
  });

  document.querySelector('.go-tile-matrix-seg')?.addEventListener('click', e => {
    const btn = e.target.closest('.go-tile-matrix-seg-btn[data-mode]');
    if (!btn) return;
    setLifetimeMatrixMode(btn.dataset.mode);
  });
}
