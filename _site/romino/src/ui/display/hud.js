import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { getDeckSize, getCardDeckSize } from '../../logic/dice.js';
import { DISCARD_RANKS, SUIT_COLOR, ndTranscribe } from '../../logic/cards.js';

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
