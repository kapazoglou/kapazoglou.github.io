import { state } from '../../logic/state.js';
import { SUIT_COLOR } from '../../logic/dice-visual.js';
import { resetGame } from '../../logic/turn.js';
import { render } from './render.js';

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

export function showGameOver(reason = '') {
  const reasonEl = document.getElementById('game-over-reason');
  if (reasonEl) reasonEl.textContent = reason;

  const scoreEl = document.getElementById('go-score-value');
  if (scoreEl) scoreEl.textContent = String(state.points);

  const sweepsEl = document.getElementById('go-sweeps');
  if (sweepsEl) sweepsEl.innerHTML = sweepListHTML();

  const overlay = document.getElementById('game-over-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-minimized');
  overlay.classList.add('is-visible');
  overlay.setAttribute('aria-hidden', 'false');
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
}
