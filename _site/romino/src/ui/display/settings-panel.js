import { state } from '../../logic/state.js';
import { settings, SETTINGS_CONFIG } from '../../logic/settings.js';
import { resetGame } from '../../logic/phase.js';
import { render } from './render.js';

export function renderSettingsPanel() {
  const container = document.getElementById('settings-toggles');
  container.innerHTML = '';
  for (const group of SETTINGS_CONFIG) {
    const header = document.createElement('div');
    header.className = 'settings-group-label';
    header.textContent = group.label;
    container.appendChild(header);
    for (const item of group.items) {
      const row = document.createElement('label');
      row.className = 'settings-row';
      const span = document.createElement('span');
      span.className = 'settings-row-label';
      span.textContent = item.label;
      const track = document.createElement('span');
      track.className = 'settings-toggle';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.key = item.key;
      input.checked = settings[item.key];
      input.addEventListener('change', () => {
        settings[item.key] = input.checked;
        // Dependency: paidSlots requires forbiddenSlots.
        if (item.key === 'scoring') {
          settings.paidSlots = false;
          const paidInput = document.querySelector('input[data-key="paidSlots"]');
          if (paidInput) paidInput.checked = false;
        }
        if (item.key === 'paidSlots' && input.checked) {
          settings.scoring = true;
          const scoringInput = document.querySelector('input[data-key="scoring"]');
          if (scoringInput) scoringInput.checked = true;
          settings.forbiddenSlots = true;
          const forbiddenInput = document.querySelector('input[data-key="forbiddenSlots"]');
          if (forbiddenInput) forbiddenInput.checked = true;
        }
        if (item.key === 'forbiddenSlots' && !input.checked) {
          settings.paidSlots = false;
          const paidInput = document.querySelector('input[data-key="paidSlots"]');
          if (paidInput) paidInput.checked = false;
        }
        if (item.key === 'fastAnimations') {
          document.documentElement.classList.toggle('fast-anims', input.checked);
        }
        if (item.key === 'peekUnconvertedLayout' && !input.checked) {
          state.peekUnconvertedCards.clear();
        }
        if (item.key === 'square') {
          document.documentElement.classList.toggle('square-cards', input.checked);
          if (input.checked) {
            settings.diceDecks = false;
            const diceDecksInput = document.querySelector('input[data-key="diceDecks"]');
            if (diceDecksInput) diceDecksInput.checked = false;
          }
        }
        if (item.key === 'diceDecks' && input.checked) {
          settings.square = false;
          document.documentElement.classList.remove('square-cards');
          const squareInput = document.querySelector('input[data-key="square"]');
          if (squareInput) squareInput.checked = false;
        }
        if (['extendedGrid', 'extraStartCards', 'emptyCards', 'blankDie', 'filterExtremes', 'diceDecks', 'extendedCardDeck', 'deckDice', 'square'].includes(item.key)) {
          document.getElementById('settings-panel').classList.remove('is-open');
          resetGame();
        } else {
          render();
        }
      });
      track.appendChild(input);
      track.insertAdjacentHTML('beforeend', '<span class="settings-toggle-thumb"></span>');
      row.appendChild(span);
      row.appendChild(track);
      container.appendChild(row);
    }
  }
}

export function initSettingsPanel() {
  let _settingsTapCount = 0;
  let _settingsTapTimer = null;

  document.getElementById('card-count').addEventListener('click', () => {
    _settingsTapCount++;
    clearTimeout(_settingsTapTimer);
    _settingsTapTimer = setTimeout(() => { _settingsTapCount = 0; }, 2000);
    if (_settingsTapCount >= 4) {
      _settingsTapCount = 0;
      renderSettingsPanel();
      document.getElementById('settings-panel').classList.add('is-open');
    }
  });

  document.getElementById('settings-back').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.remove('is-open');
  });
}
