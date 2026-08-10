import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { showDeckInHud } from '../../logic/deck-size.js';
import { SUIT_BADGE_ORDER, SUIT_COLOR, starSVG } from '../../logic/dice-visual.js';
import { isHudStarPayDraggable } from './star-reroll-input.js';

function suitBadgeHTML(letter) {
  const bg = SUIT_COLOR[letter] ?? '#404A59';
  const count = state.suitTally[letter] ?? 0;
  const title = count ? `${letter}: ${count}` : letter;
  return `<span class="hud-suit-badge" style="background:${bg}" title="${title}">${letter}</span>`;
}

export function renderHUD() {
  const hud = document.getElementById('hud');
  if (!hud) return;

  const badges = SUIT_BADGE_ORDER.map(letter => suitBadgeHTML(letter)).join('');
  const starDraggable = isHudStarPayDraggable();
  const deckHTML = showDeckInHud()
    ? `<span class="hud-deck" id="hud-deck" aria-label="Deck remaining">${state.deckRemaining}</span>`
    : '';

  hud.innerHTML = `
    ${deckHTML}
    <div class="hud-center">
      <div class="hud-score" id="hud-score-tap">
        <span class="hud-stars" id="hud-stars">${state.stars}</span>
        <span class="hud-star-pay${starDraggable ? ' is-star-draggable' : ''}" id="hud-star-pay">
          ${starSVG(32)}
        </span>
        <span class="hud-score-sep" aria-hidden="true">|</span>
        <span class="hud-points" id="hud-points">${state.points}</span>
      </div>
      <div class="hud-suit-row" aria-hidden="true">${badges}</div>
    </div>
  `;
}
