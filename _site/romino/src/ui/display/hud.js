import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { getDeckSize, getCardDeckSize } from '../../logic/dice.js';
import { DISCARD_RANKS, SUIT_COLOR, ndTranscribe, buildGameOverFourSquareGrid } from '../../logic/cards.js';
import { renderCardHTML } from './grid.js';

let discoveryGridCount = -1;

export function discoveryGridHTML() {
  const grid = buildGameOverFourSquareGrid(state.discoveredCards);
  return grid.flatMap(row => row.map(id =>
    id != null
      ? `<div class="go-card-wrap">${renderCardHTML(id, false, false, { gameOver: true })}</div>`
      : '<div class="go-card-wrap go-card-wrap--empty"></div>'
  )).join('');
}

export function renderDiscoveryGrid() {
  const wrap = document.getElementById('discovery-grid-wrap');
  const el = document.getElementById('discovery-grid');
  if (!wrap || !el) return;

  const show = settings.fourSquare && settings.square && state.phase !== 'replay';
  wrap.hidden = !show;
  if (!show) {
    el.innerHTML = '';
    discoveryGridCount = -1;
    return;
  }

  const count = state.discoveredCards.length;
  if (count === discoveryGridCount) return;
  discoveryGridCount = count;

  el.innerHTML = discoveryGridHTML();
}

export function renderHUD() {
  const countEl = document.getElementById('card-count');
  const scoreEl = document.getElementById('score-display');
  if (countEl) {
    if (!settings.diceDecks && !settings.deckDice) {
      countEl.textContent = '∞';
    } else {
      const total = settings.diceDecks ? getCardDeckSize() : getDeckSize();
      countEl.textContent = Math.max(0, total - state.cardsPlaced);
    }
  }
  if (scoreEl) {
    scoreEl.hidden = !settings.scoring;
    if (settings.scoring) scoreEl.textContent = `${state.score} 🪙`;
  }
}

export function renderDiscards() {
  const stacks = document.getElementById('discard-stacks');
  if (!stacks) return;
  stacks.innerHTML = DISCARD_RANKS.map((rank, i) => {
    const used = new Set(state.discards[i] || []);
    const entriesHTML = i === 0
      ? Array(4).fill(0).map((_, j) => {
          const converted = j < Math.min(used.size, 4);
          return `<span class="discard-entry${converted ? '' : ' is-dim'}" style="color:${SUIT_COLOR['V']}">V</span>`;
        }).join('')
      : ['Z','X','Y','W'].map(suit => {
          const converted = used.has(suit);
          return `<span class="discard-entry${converted ? '' : ' is-dim'}" style="color:${SUIT_COLOR[suit]}">${suit}</span>`;
        }).join('');
    return `<div class="discard-suit">${entriesHTML}</div>`;
  }).join('');
}

export function initDiscards() {
  const labels = document.getElementById('discard-labels');
  if (!labels) return;
  labels.innerHTML = ['V','A','2','3','4','5','6','7','8','9','10','aa','ab','ac']
    .map(l => `<div class="discard-label">${ndTranscribe(l)}</div>`).join('');
  renderDiscards();
}
