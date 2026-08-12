import { settings, SETTINGS_CONFIG, clampSettings } from '../../logic/settings.js';
import { renderLifetimeStatsView } from './lifetime-stats-view.js';

const STORAGE_KEY = 'romino-v2-settings';
export const TUTORIAL_DONE_KEY = 'romino-tutorial-done';

/** Pending edits while the panel is open; applied on back. */
let draftSettings = null;
let settingsLifetimeMatrixMode = 'converted';

function refreshSettingsLifetime() {
  if (!draftSettings) return;
  renderLifetimeStatsView({
    settingsObj: draftSettings,
    summaryId: 'settings-lifetime-summary',
    starsId: 'settings-lifetime-stars',
    diceId: 'settings-lifetime-dice',
    tilesId: 'settings-lifetime-tiles',
    matrixMode: settingsLifetimeMatrixMode,
    matrixSegId: 'settings-tile-matrix-seg',
  });
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.nTiles != null && saved.nSpots == null && saved.nPlaces == null) {
      settings.nSpots = saved.nTiles;
    }
    if (saved.nPlaces != null && saved.nSpots == null) {
      settings.nSpots = saved.nPlaces;
    }
    for (const [k, v] of Object.entries(saved)) {
      if (k in settings) settings[k] = v;
    }
    if (typeof settings.nineCubes === 'boolean') {
      settings.nineCubes = settings.nineCubes ? 1 : 0;
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
  if (draftSettings.nPlace > draftSettings.nRoll) draftSettings.nPlace = draftSettings.nRoll;
  if (draftSettings.nRoll > draftSettings.nDice) draftSettings.nRoll = draftSettings.nDice;
  if (draftSettings.deckFlank) draftSettings.tileDealtEvery = 0;
  if (draftSettings.tileDealtEvery > 0) draftSettings.deckFlank = false;
  if (!draftSettings.dominoRoll) draftSettings.dominoSpots = false;
  if (draftSettings.dominoSpots) draftSettings.tileDealtEvery = 0;
  if (draftSettings.tileDealtEvery > 0) draftSettings.dominoSpots = false;
  if (draftSettings.nineCubes < 0) draftSettings.nineCubes = 0;
  if (draftSettings.nineCubes > 2) draftSettings.nineCubes = 2;
  if (draftSettings.diceAndCubes) draftSettings.tileDiceHold = true;
  if (!draftSettings.tileDiceHold) draftSettings.diceAndCubes = false;
  if (!draftSettings.tricolors) draftSettings.switcherJokers = false;
  if (draftSettings.switcherJokers) draftSettings.tricolorSevens = false;
  if (draftSettings.tricolorSevens) draftSettings.switcherJokers = false;
  if (draftSettings.startingDice < 0) draftSettings.startingDice = 0;
  const startingDiceCap = Math.min(draftSettings.nDice, draftSettings.nSpots * 2, 24);
  if (draftSettings.startingDice > startingDiceCap) draftSettings.startingDice = startingDiceCap;
}

function isDraftControlDisabled(item) {
  if (item.key === 'deckFlank') return draftSettings.tileDealtEvery > 0;
  if (item.key === 'tileDealtEvery') return draftSettings.deckFlank || draftSettings.dominoSpots;
  if (item.key === 'dominoSpots') return !draftSettings.dominoRoll || draftSettings.tileDealtEvery > 0;
  if (item.key === 'switcherJokers') return !draftSettings.tricolors || draftSettings.tricolorSevens;
  if (item.key === 'tricolorSevens') return draftSettings.switcherJokers;
  return false;
}

function refreshSettingsPanelControls() {
  const container = document.getElementById('settings-toggles');
  if (!container || !draftSettings) return;
  container.querySelectorAll('.settings-row').forEach(row => {
    const key = row.dataset.key ?? row.querySelector('input[data-key]')?.dataset.key;
    if (!key) return;
    const item = SETTINGS_CONFIG.flatMap(g => g.items).find(i => i.key === key);
    if (!item) return;
    const disabled = isDraftControlDisabled(item);
    row.classList.toggle('settings-row--disabled', disabled);
    if (item.type === 'toggle') {
      const input = row.querySelector('input[data-key]');
      if (input) {
        input.checked = draftSettings[item.key];
        input.disabled = disabled;
      }
    } else if (item.type === 'stepper') {
      const value = row.querySelector('.settings-stepper-value');
      if (value) value.textContent = String(draftSettings[item.key]);
      row.querySelectorAll('.settings-stepper-btn').forEach(btn => { btn.disabled = disabled; });
    }
  });
  refreshSettingsLifetime();
}

/** @returns {boolean} true when settings changed and the page is reloading */
function applyDraftSettings() {
  if (!draftSettings) return false;

  const changed = Object.keys(settings).some(key => draftSettings[key] !== settings[key]);

  if (!settings.tutoria && draftSettings.tutoria) {
    try { localStorage.removeItem(TUTORIAL_DONE_KEY); } catch { /* ignore */ }
  }

  for (const [key, value] of Object.entries(draftSettings)) {
    settings[key] = value;
  }
  clampSettings();
  saveSettings();
  draftSettings = null;

  if (!changed) return false;

  location.reload();
  return true;
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
  refreshSettingsLifetime();
}

function buildStepperRow(item) {
  const row = document.createElement('div');
  row.className = 'settings-row settings-row--stepper';
  row.dataset.key = item.key;

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
    if (isDraftControlDisabled(item)) return;
    const min = item.min ?? 1;
    const max = item.max ?? 99;
    draftSettings[item.key] = Math.min(max, Math.max(min, draftSettings[item.key] + delta));
    clampDraft();
    value.textContent = String(draftSettings[item.key]);
    refreshSettingsPanelControls();
  };

  minus.addEventListener('click', () => update(-1));
  plus.addEventListener('click', () => update(1));

  controls.append(minus, value, plus);
  row.append(label, controls);
  if (isDraftControlDisabled(item)) row.classList.add('settings-row--disabled');
  return row;
}

function buildToggleRow(item) {
  const row = document.createElement('label');
  row.className = 'settings-row';
  row.dataset.key = item.key;

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
    if (isDraftControlDisabled(item)) {
      input.checked = draftSettings[item.key];
      return;
    }
    draftSettings[item.key] = input.checked;
    clampDraft();
    if (item.key === 'deckFlank') input.checked = draftSettings.deckFlank;
    refreshSettingsPanelControls();
  });

  track.appendChild(input);
  track.insertAdjacentHTML('beforeend', '<span class="settings-toggle-thumb"></span>');
  row.append(span, track);
  if (isDraftControlDisabled(item)) {
    row.classList.add('settings-row--disabled');
    input.disabled = true;
  }
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
      settingsLifetimeMatrixMode = 'converted';
      renderSettingsPanel();
      document.getElementById('settings-panel').classList.add('is-open');
    }
  });

  document.getElementById('settings-tile-matrix-seg')?.addEventListener('click', e => {
    const btn = e.target.closest('.go-tile-matrix-seg-btn[data-mode]');
    if (!btn || !draftSettings) return;
    if (btn.dataset.mode !== 'converted' && btn.dataset.mode !== 'swept') return;
    settingsLifetimeMatrixMode = btn.dataset.mode;
    refreshSettingsLifetime();
  });

  document.getElementById('settings-back').addEventListener('click', () => {
    const reloading = applyDraftSettings();
    if (!reloading) {
      document.getElementById('settings-panel').classList.remove('is-open');
    }
  });
}
