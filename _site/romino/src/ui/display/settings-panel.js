import { settings, SETTINGS_CONFIG, clampSettings } from '../../logic/settings.js';
import { resetGame } from '../../logic/turn.js';
import { render } from './render.js';

const STORAGE_KEY = 'romino-v2-settings';

/** Pending edits while the panel is open; applied on back. */
let draftSettings = null;

const RESET_KEYS = ['nDice', 'nRoll', 'nPlace', 'nPlaces', 'adjacentColumnsOnly', 'oneToOne', 'suitRestriction', 'consecutiveStars'];

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.nTiles != null && saved.nPlaces == null) {
      settings.nPlaces = saved.nTiles;
    }
    for (const [k, v] of Object.entries(saved)) {
      if (k in settings) settings[k] = v;
    }
    clampSettings();
  } catch { /* ignore */ }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }));
  } catch { /* ignore */ }
}

function clampDraft() {
  if (draftSettings.nPlaces > draftSettings.nDice) draftSettings.nPlaces = draftSettings.nDice;
  if (draftSettings.nPlace > draftSettings.nRoll) draftSettings.nPlace = draftSettings.nRoll;
  if (draftSettings.nRoll > draftSettings.nDice) draftSettings.nRoll = draftSettings.nDice;
}

function needsGameReset(before, after) {
  return RESET_KEYS.some(key => before[key] !== after[key]);
}

function applyDraftSettings() {
  if (!draftSettings) return;

  const previous = { ...settings };
  const changed = Object.keys(settings).some(key => draftSettings[key] !== settings[key]);

  for (const [key, value] of Object.entries(draftSettings)) {
    settings[key] = value;
  }
  clampSettings();
  saveSettings();
  document.documentElement.classList.toggle('fast-anims', settings.fastAnimations);
  draftSettings = null;

  if (!changed) return;

  if (needsGameReset(previous, settings)) {
    resetGame();
  } else {
    render();
  }
}

export function renderSettingsPanel() {
  const container = document.getElementById('settings-toggles');
  container.innerHTML = '';

  for (const group of SETTINGS_CONFIG) {
    const header = document.createElement('div');
    header.className = 'settings-group-label';
    header.textContent = group.label;
    container.appendChild(header);

    for (const item of group.items) {
      if (item.type === 'stepper') {
        container.appendChild(buildStepperRow(item));
      } else {
        container.appendChild(buildToggleRow(item));
      }
    }
  }
}

function buildStepperRow(item) {
  const row = document.createElement('div');
  row.className = 'settings-row settings-row--stepper';

  const label = document.createElement('span');
  label.className = 'settings-row-label';
  label.textContent = item.label;

  const controls = document.createElement('div');
  controls.className = 'settings-stepper';

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'settings-stepper-btn';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Decrease ${item.label}`);

  const value = document.createElement('span');
  value.className = 'settings-stepper-value';
  value.textContent = String(draftSettings[item.key]);

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'settings-stepper-btn';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Increase ${item.label}`);

  const update = delta => {
    const min = item.min ?? 1;
    let max = item.max ?? 99;
    if (item.key === 'nPlaces') max = Math.min(max, draftSettings.nDice);
    draftSettings[item.key] = Math.min(max, Math.max(min, draftSettings[item.key] + delta));
    clampDraft();
    value.textContent = String(draftSettings[item.key]);
  };

  minus.addEventListener('click', () => update(-1));
  plus.addEventListener('click', () => update(1));

  controls.append(minus, value, plus);
  row.append(label, controls);
  return row;
}

function buildToggleRow(item) {
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
  input.checked = draftSettings[item.key];

  input.addEventListener('change', () => {
    draftSettings[item.key] = input.checked;
  });

  track.appendChild(input);
  track.insertAdjacentHTML('beforeend', '<span class="settings-toggle-thumb"></span>');
  row.append(span, track);
  return row;
}

export function initSettingsPanel() {
  loadSettings();
  document.documentElement.classList.toggle('fast-anims', settings.fastAnimations);

  let tapCount = 0;
  let tapTimer = null;

  document.getElementById('app').addEventListener('click', e => {
    if (!e.target.closest('#hud-score-tap')) return;
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { tapCount = 0; }, 600);
    if (tapCount >= 3) {
      tapCount = 0;
      draftSettings = { ...settings };
      renderSettingsPanel();
      document.getElementById('settings-panel').classList.add('is-open');
    }
  });

  document.getElementById('settings-back').addEventListener('click', () => {
    applyDraftSettings();
    document.getElementById('settings-panel').classList.remove('is-open');
  });
}
