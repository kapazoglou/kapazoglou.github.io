import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { isCoolOffActive } from '../../logic/cool-off.js';
import { getDeckSize, getCardDeckSize } from '../../logic/dice.js';
import { DISCARD_RANKS, SUIT_COLOR, DISPLAY_SUITS, ndTranscribe, buildGameOverFourSquareGrid, buildFillDiscoveryGrid, FILL_DISCOVERY_RANK_HEADERS, cardSuit } from '../../logic/cards.js';
import { renderCardHTML } from './grid.js';

let discoveryGridCount = -1;
let coolOffRowSig = '';
let sweepSuitSig = null;
const COOL_OFF_POP_MS = 340;

function coolOffRowHTML() {
  return state.coolOffCards.map(id =>
    `<div class="cool-off-card" data-cool-off-id="${id}">
      <div class="go-card-wrap">${renderCardHTML(id, false, false, { gameOver: true })}</div>
    </div>`
  ).join('');
}

function playCoolOffPop(cardId) {
  requestAnimationFrame(() => {
    const el = document.getElementById('cool-off-row')
      ?.querySelector(`.cool-off-card[data-cool-off-id="${cardId}"]`);
    if (!el) return;
    void el.offsetWidth;
    el.classList.add('is-popping');
  });
}

export function renderCoolOffRow() {
  const el = document.getElementById('cool-off-row');
  if (!el) return;
  const show = isCoolOffActive() && state.phase !== 'replay';
  el.hidden = !show || state.coolOffCards.length === 0;
  if (!show) {
    el.innerHTML = '';
    coolOffRowSig = '';
    return;
  }
  const sig = state.coolOffCards.join(',');
  if (sig === coolOffRowSig) return;
  coolOffRowSig = sig;
  el.innerHTML = coolOffRowHTML();
}

export function popCoolOffCard(animated = true) {
  if (!isCoolOffActive() || !state.coolOffCards.length) return;
  if (animated) {
    if (state.coolOffPopping !== null) return;
    const cardId = state.coolOffCards[0];
    state.coolOffPopping = cardId;
    coolOffRowSig = '';
    renderCoolOffRow();
    playCoolOffPop(cardId);
    setTimeout(() => {
      if (state.coolOffCards[0] === state.coolOffPopping) state.coolOffCards.shift();
      state.coolOffPopping = null;
      coolOffRowSig = '';
      renderCoolOffRow();
    }, spd(COOL_OFF_POP_MS));
    return;
  }
  state.coolOffCards.shift();
  state.coolOffPopping = null;
  coolOffRowSig = '';
  renderCoolOffRow();
}

function suitTileHTML(suit) {
  const bg = suit ? SUIT_COLOR[suit] : '#9A9FB6';
  const label = suit ?? '';
  return `<div class="discovery-fill-tile" style="background:${bg}">
    <span class="discovery-fill-tile__suit">${label}</span>
  </div>`;
}

function discoveryFillTileHTML(cardId) {
  return suitTileHTML(cardSuit(cardId));
}

function sweptSuitCounts() {
  const counts = {};
  for (const set of state.scoredSets) {
    for (const id of set.cardIds) {
      const suit = cardSuit(id);
      if (!suit) continue;
      counts[suit] = (counts[suit] || 0) + 1;
    }
  }
  return counts;
}

function sweepSuitTallyHTML() {
  const counts = sweptSuitCounts();
  const suits = counts.V ? [...DISPLAY_SUITS, 'V'] : DISPLAY_SUITS;
  return suits.map(suit =>
    `<div class="hud-suit-entry">
      <span class="hud-suit-entry__count">${counts[suit] || 0}</span>
      ${suitTileHTML(suit)}
    </div>`
  ).join('');
}

function discoveryFillGridHTML() {
  const grid = buildFillDiscoveryGrid(state.discoveredCards);
  const cells = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 13; col++) {
      const id = grid[row][col];
      cells.push(id != null
        ? `<div class="discovery-fill-cell">${discoveryFillTileHTML(id)}</div>`
        : '<div class="discovery-fill-cell discovery-fill-cell--empty"></div>');
    }
  }
  for (const label of FILL_DISCOVERY_RANK_HEADERS) {
    cells.push(`<div class="discovery-fill-header"><span class="discovery-fill-header__label">${ndTranscribe(label)}</span></div>`);
  }
  return cells.join('');
}

export function discoveryGridHTML() {
  if (settings.fillDiscovery) return discoveryFillGridHTML();
  const grid = buildGameOverFourSquareGrid(state.discoveredCards);
  return grid.flatMap(row => row.map(id =>
    id != null
      ? `<div class="go-card-wrap">${renderCardHTML(id, false, false, { gameOver: true })}</div>`
      : '<div class="go-card-wrap go-card-wrap--empty"></div>'
  )).join('');
}

export function sweepListHTML() {
  if (!state.scoredSets.length) {
    return '<div class="go-sweep-empty">no sweeps</div>';
  }
  const groups = state.scoredSets.map(s => {
    const cards = s.cardIds.map(id =>
      `<div class="go-card-wrap">${renderCardHTML(id, false, false, { gameOver: true })}</div>`
    ).join('');
    return `<div class="go-sweep-group">${cards}</div>`;
  });
  return `<div class="go-sweeps-inline">${groups.join('')}</div>`;
}

export function renderDiscoveryGrid() {
  const wrap = document.getElementById('discovery-grid-wrap');
  const el = document.getElementById('discovery-grid');
  if (!wrap || !el) return;

  const show = settings.fourSquare && settings.square;
  wrap.hidden = !show;
  if (!show) {
    el.innerHTML = '';
    discoveryGridCount = -1;
    return;
  }

  el.classList.toggle('go-cards-grid--fill-discovery', settings.fillDiscovery);
  el.classList.toggle('go-cards-grid--four-square', !settings.fillDiscovery);

  const count = state.discoveredCards.length;
  if (count === discoveryGridCount) return;
  discoveryGridCount = count;

  el.innerHTML = discoveryGridHTML();
}

export function renderHUD() {
  const countEl = document.getElementById('card-count');
  const scoreWrap = document.getElementById('hud-score');
  const scoreEl = document.getElementById('score-display');
  if (countEl) {
    if (!settings.diceDecks && !settings.deckDice) {
      countEl.textContent = '∞';
    } else {
      const total = settings.diceDecks ? getCardDeckSize() : getDeckSize();
      countEl.textContent = Math.max(0, total - state.cardsPlaced);
    }
  }
  if (scoreWrap) scoreWrap.hidden = !settings.scoring;
  if (scoreEl && settings.scoring) {
    scoreEl.textContent = `${state.score} 🪙`;
    const canFlip = settings.coinFlipDice && state.phase === 'place-dice' && state.score > 0;
    scoreEl.classList.toggle('is-coin-draggable', canFlip);
  } else if (scoreEl) {
    scoreEl.classList.remove('is-coin-draggable');
  }
  const tallyEl = document.getElementById('hud-tally');
  if (tallyEl) {
    const sig = state.scoredSets.map(s => s.cardIds.join(',')).join('|');
    if (sig !== sweepSuitSig) {
      sweepSuitSig = sig;
      tallyEl.innerHTML = sweepSuitTallyHTML();
    }
  }
  renderCoolOffRow();
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
