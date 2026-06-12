import { resetGame } from '../../logic/phase.js';

export function initGameOver() {
  document.getElementById('go-handle').addEventListener('click', e => {
    if (e.target.closest('#game-over-restart')) return;
    document.getElementById('game-over-overlay').classList.toggle('is-minimized');
  });

  document.getElementById('game-over-restart').addEventListener('click', () => {
    const overlay = document.getElementById('game-over-overlay');
    overlay.classList.remove('is-visible', 'is-minimized');
    resetGame();
  });
}
