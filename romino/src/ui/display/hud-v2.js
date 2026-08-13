import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { showDeckInHud } from '../../logic/deck-size.js';
import { SWEPT_SUIT_ORDER, SUIT_COLOR, starSVG } from '../../logic/dice-visual.js';
import { isHudStarPayDraggable } from './star-reroll-input.js';

function sweptSuitHTML(letter) {
  const color = SUIT_COLOR[letter] ?? '#404A59';
  const count = state.suitTally[letter] ?? 0;
  return `<span class="hud-swept-suit" style="color:${color}" title="${letter}: ${count}">
    <span class="hud-swept-suit-count">${count}</span>
    <span class="hud-swept-suit-glyph">${letter}</span>
  </span>`;
}

export function renderHUD() {
  const hud = document.getElementById('hud');
  if (!hud) return;

  const starDraggable = isHudStarPayDraggable();
  const deckHTML = showDeckInHud()
    ? `<span class="hud-deck" id="hud-deck" aria-label="Deck remaining">${state.deckRemaining}</span>`
    : '';
  const suitBlockHTML = settings.sweptSuits
    ? `<span class="hud-suit-align"><span class="hud-suit-row" aria-label="Swept tiles by suit">${SWEPT_SUIT_ORDER.map(sweptSuitHTML).join('')}</span></span>`
    : '';

  hud.innerHTML = `
    <div class="hud-left">
      ${deckHTML}
    </div>
    <div class="hud-score" id="hud-score-tap">
      <span class="hud-points" id="hud-points">${state.points}</span>
      ${suitBlockHTML}
      <div class="hud-score-after">
        <span class="hud-stars" id="hud-stars">${state.stars}</span>
        <span class="hud-star-pay${starDraggable ? ' is-star-draggable' : ''}" id="hud-star-pay">
          ${starSVG(32)}
        </span>
      </div>
    </div>
  `;
}
