import { settings, SETTINGS_CONFIG, clampSettings, spd } from '../../logic/settings.js';
import { clearHighscores } from '../../logic/highscores.js';
import { renderLifetimeStatsView } from './lifetime-stats-view.js';
import { setFullscreenEnabled } from './viewport-controls.js';
import { playSfx } from '../transitions/sfx.js';
import { applyMusicTrack, applyMusicVolume, bootstrapMusic, ensureMusicPreload, getMusicSelectOptions, isMusicLoading, onMusicLoadChange, previewMusicTrack } from '../transitions/music.js';
import { applyBgDicierVfx } from './bg-dicier-vfx.js';

const STORAGE_KEY = 'romino-v2-settings';
export const TUTORIAL_DONE_KEY = 'romino-tutorial-done';

/** Pending edits while the panel is open; applied on close. */
let draftSettings = null;
let settingsLifetimeMatrixMode = 'converted';

/** Live-apply on change (no wait for panel close). */
const IMMEDIATE_APPLY_KEYS = new Set(['fullScreen', 'musicVolume', 'sfxVolume', 'vfxEnabled']);

const NO_RELOAD_KEYS = new Set(['fullScreen', 'musicTrack', 'musicVolume', 'sfxVolume', 'vfxEnabled']);

function applyImmediateSetting(key) {
  if (!draftSettings || !IMMEDIATE_APPLY_KEYS.has(key)) return;
  settings[key] = draftSettings[key];
  if (key === 'fullScreen') setFullscreenEnabled(settings.fullScreen);
  else if (key === 'musicVolume') applyMusicVolume();
  else if (key === 'vfxEnabled') applyBgDicierVfx();
  saveSettings();
}

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
    if (saved.starPowers && !('pushBelowCost' in saved)) {
      settings.pushBelowCost = 1;
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
  if (draftSettings.nPlace < 2) draftSettings.nPlace = 2;
  if (draftSettings.dominoRoll && draftSettings.nPlace > 2) draftSettings.nPlace = 2;
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
  if (draftSettings.startingStars < 0) draftSettings.startingStars = 0;
  if (draftSettings.startingStars > 52) draftSettings.startingStars = 52;
  if (draftSettings.startingDice < 0) draftSettings.startingDice = 0;
  const startingDiceCap = Math.min(draftSettings.nDice, draftSettings.nSpots * 2, 24);
  if (draftSettings.startingDice > startingDiceCap) draftSettings.startingDice = startingDiceCap;
  if (!draftSettings.starPowers) {
    draftSettings.pushBelowCost = 0;
    draftSettings.buggerSingles = false;
  }
  if (draftSettings.pushBelowCost < 0) draftSettings.pushBelowCost = 0;
  if (draftSettings.pushBelowCost > 5) draftSettings.pushBelowCost = 5;
  if (!draftSettings.pushBelowCost) draftSettings.buggerSingles = false;
  if (draftSettings.sweptLowSuitBonus < 0) draftSettings.sweptLowSuitBonus = 0;
  if (draftSettings.sweptLowSuitBonus > 10) draftSettings.sweptLowSuitBonus = 10;
  if (draftSettings.sweptDuplicatePenalty < 0) draftSettings.sweptDuplicatePenalty = 0;
  if (draftSettings.sweptDuplicatePenalty > 10) draftSettings.sweptDuplicatePenalty = 10;
  if (draftSettings.sfxVolume < 0) draftSettings.sfxVolume = 0;
  if (draftSettings.sfxVolume > 10) draftSettings.sfxVolume = 10;
  if (draftSettings.musicVolume < 0) draftSettings.musicVolume = 0;
  if (draftSettings.musicVolume > 10) draftSettings.musicVolume = 10;
}

function isDraftControlDisabled(item) {
  if (item.key === 'deckFlank') return draftSettings.tileDealtEvery > 0;
  if (item.key === 'tileDealtEvery') return draftSettings.deckFlank || draftSettings.dominoSpots;
  if (item.key === 'dominoSpots') return !draftSettings.dominoRoll || draftSettings.tileDealtEvery > 0;
  if (item.key === 'switcherJokers') return !draftSettings.tricolors || draftSettings.tricolorSevens;
  if (item.key === 'tricolorSevens') return draftSettings.switcherJokers;
  if (item.key === 'pushBelowCost') return !draftSettings.starPowers;
  if (item.key === 'buggerSingles') return !draftSettings.starPowers || draftSettings.pushBelowCost === 0;
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
    } else if (item.type === 'select') {
      const select = row.querySelector('select[data-key]');
      if (select) select.value = draftSettings[item.key];
    }
  });
  refreshSettingsLifetime();
}

/** @returns {boolean} true when settings changed and the page is reloading */
function applyDraftSettings() {
  if (!draftSettings) return false;

  const fullScreenChanged = draftSettings.fullScreen !== settings.fullScreen;
  const gameChanged = Object.keys(settings).some(
    key => !NO_RELOAD_KEYS.has(key) && draftSettings[key] !== settings[key]
  );

  if (!settings.tutoria && draftSettings.tutoria) {
    try { localStorage.removeItem(TUTORIAL_DONE_KEY); } catch { /* ignore */ }
  }

  for (const [key, value] of Object.entries(draftSettings)) {
    settings[key] = value;
  }
  clampSettings();
  saveSettings();
  draftSettings = null;

  if (fullScreenChanged) {
    setFullscreenEnabled(settings.fullScreen);
  }

  applyMusicTrack();
  applyMusicVolume();
  applyBgDicierVfx();

  if (!gameChanged) return false;

  location.reload();
  return true;
}

function appendAttribution(container, item) {
  if (!item.attribution) return;
  const credit = document.createElement('p');
  credit.className = 'settings-attribution';
  credit.textContent = item.attribution;
  container.appendChild(credit);
}

export function renderSettingsPanel() {
  const container = document.getElementById('settings-toggles');
  container.innerHTML = '';

  for (const group of SETTINGS_CONFIG.filter(g => g.group !== 'deprecated')) {
    const header = document.createElement('div');
    header.className = 'settings-group-label';
    header.textContent = group.label;
    container.appendChild(header);

    for (const item of group.items) {
      if (item.type === 'stepper') {
        container.appendChild(buildStepperRow(item));
      } else if (item.type === 'select') {
        if (item.key === 'musicTrack') {
          container.appendChild(buildMusicSelectBlock(item));
        } else {
          container.appendChild(buildSelectRow(item));
        }
      } else {
        container.appendChild(buildToggleRow(item));
      }
      appendAttribution(container, item);
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
    applyImmediateSetting(item.key);
    refreshSettingsPanelControls();
    playSfx('ui_tap');
  };

  minus.addEventListener('click', () => update(-1));
  plus.addEventListener('click', () => update(1));

  controls.append(minus, value, plus);
  row.append(label, controls);
  if (isDraftControlDisabled(item)) row.classList.add('settings-row--disabled');
  return row;
}

function populateMusicSelect(select) {
  const prev = draftSettings?.musicTrack ?? 'off';
  select.replaceChildren();
  for (const opt of getMusicSelectOptions()) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.disabled) option.disabled = true;
    select.appendChild(option);
  }

  const loading = isMusicLoading();
  const wrap = select.closest('.settings-select-wrap');
  wrap?.classList.toggle('is-loading', loading);
  select.disabled = loading;

  if (loading) {
    select.value = '__loading__';
    return;
  }

  select.value = prev;
  if (!select.querySelector(`option[value="${CSS.escape(select.value)}"]`)) {
    select.value = 'off';
    if (draftSettings) draftSettings.musicTrack = 'off';
  }
}

function refreshMusicSelectRow() {
  const block = document.querySelector('.settings-music-block');
  const select = block?.querySelector('select[data-key="musicTrack"]');
  const label = block?.querySelector('.settings-row-label');
  if (!select || !draftSettings) return;
  populateMusicSelect(select);
  const loading = isMusicLoading();
  block?.classList.toggle('is-loading', loading);
  if (label) label.textContent = loading ? 'Music · Loading…' : 'Music';
}

function buildMusicSelectBlock(item) {
  const block = document.createElement('div');
  block.className = 'settings-music-block';

  const row = document.createElement('div');
  row.className = 'settings-row settings-row--select settings-row--music';
  row.dataset.key = item.key;

  const label = document.createElement('span');
  label.className = 'settings-row-label';
  label.textContent = item.label;

  const wrap = document.createElement('div');
  wrap.className = 'settings-select-wrap';

  const select = document.createElement('select');
  select.className = 'settings-select';
  select.dataset.key = item.key;
  select.setAttribute('aria-label', item.label);
  populateMusicSelect(select);

  const spinner = document.createElement('span');
  spinner.className = 'settings-select-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const syncMusicUi = () => {
    const trackId = draftSettings?.musicTrack ?? 'off';
    ensureMusicPreload(trackId);
    previewMusicTrack(trackId);
    refreshMusicSelectRow();
  };
  select.addEventListener('focus', syncMusicUi);
  select.addEventListener('pointerdown', syncMusicUi);

  select.addEventListener('change', () => {
    if (select.value === '' || select.value === '__loading__' || select.value === '__error__') return;
    draftSettings[item.key] = select.value;
    playSfx('ui_tap');
    syncMusicUi();
  });

  wrap.append(select, spinner);
  row.append(label, wrap);
  block.appendChild(row);

  return block;
}

function buildSelectRow(item) {
  const row = document.createElement('div');
  row.className = 'settings-row settings-row--select';
  row.dataset.key = item.key;

  const label = document.createElement('span');
  label.className = 'settings-row-label';
  label.textContent = item.label;

  const wrap = document.createElement('div');
  wrap.className = 'settings-select-wrap';

  const select = document.createElement('select');
  select.className = 'settings-select';
  select.dataset.key = item.key;
  select.setAttribute('aria-label', item.label);

  for (const opt of item.options ?? []) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  }
  select.value = draftSettings[item.key];

  select.addEventListener('change', () => {
    draftSettings[item.key] = select.value;
    playSfx('ui_tap');
  });

  wrap.append(select);
  row.append(label, wrap);
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
    applyImmediateSetting(item.key);
    refreshSettingsPanelControls();
    playSfx('ui_tap');
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
  applyBgDicierVfx();
  bootstrapMusic();
  document.documentElement.classList.toggle('fast-anims', settings.fastAnimations);

  onMusicLoadChange(() => {
    if (!draftSettings) return;
    if (!document.getElementById('settings-panel')?.classList.contains('is-open')) return;
    refreshMusicSelectRow();
  });

  document.getElementById('app')?.addEventListener('pointerdown', () => {
    if (!draftSettings) return;
    if (!document.getElementById('settings-panel')?.classList.contains('is-open')) return;
    const trackId = draftSettings.musicTrack ?? 'off';
    ensureMusicPreload(trackId);
    previewMusicTrack(trackId);
    refreshMusicSelectRow();
  }, { passive: true });

  let tapCount = 0;
  let tapTimer = null;

  document.getElementById('app').addEventListener('click', e => {
    if (!e.target.closest('#hud-points')) return;
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { tapCount = 0; }, 600);
    if (tapCount >= 2) {
      tapCount = 0;
      draftSettings = { ...settings };
      settingsLifetimeMatrixMode = 'converted';
      renderSettingsPanel();
      const trackId = draftSettings.musicTrack ?? 'off';
      ensureMusicPreload(trackId);
      previewMusicTrack(trackId);
      refreshMusicSelectRow();
      resetClearHighscoresSlider();
      document.getElementById('settings-panel').classList.add('is-open');
      playSfx('ui_open');
    }
  });

  document.getElementById('settings-tile-matrix-seg')?.addEventListener('click', e => {
    const btn = e.target.closest('.go-tile-matrix-seg-btn[data-mode]');
    if (!btn || !draftSettings) return;
    if (btn.dataset.mode !== 'converted' && btn.dataset.mode !== 'swept') return;
    settingsLifetimeMatrixMode = btn.dataset.mode;
    refreshSettingsLifetime();
    playSfx('ui_tap');
  });

  document.getElementById('settings-back').addEventListener('click', () => {
    resetClearHighscoresSlider();
    const reloading = applyDraftSettings();
    if (!reloading) {
      document.getElementById('settings-panel').classList.remove('is-open');
      playSfx('ui_close');
    }
  });

  initClearHighscoresSlider();
}

const CLEAR_HS_THUMB_PAD = 4;
const CLEAR_HS_COMPLETE_RATIO = 0.98;
const CLEAR_HS_LABEL = 'Clear high scores';
const CLEAR_HS_DELETED_FLASH_MS = 520;

let clearHighscoresFlashTimer = null;

function resetClearHighscoresSlider() {
  const track = document.getElementById('settings-clear-highscores');
  const thumb = track?.querySelector('.settings-clear-highscores-thumb');
  const label = track?.querySelector('.settings-clear-highscores-label');
  if (!track || !thumb || !label) return;
  if (clearHighscoresFlashTimer != null) {
    clearTimeout(clearHighscoresFlashTimer);
    clearHighscoresFlashTimer = null;
  }
  track.classList.remove('is-armed', 'is-deleted-flash');
  track.style.pointerEvents = '';
  track.setAttribute('role', 'button');
  track.setAttribute('aria-label', CLEAR_HS_LABEL);
  track.removeAttribute('aria-valuemin');
  track.removeAttribute('aria-valuemax');
  track.removeAttribute('aria-valuenow');
  label.textContent = CLEAR_HS_LABEL;
  thumb.classList.remove('is-dragging');
  thumb.style.transform = 'translateY(-50%) translateX(0)';
}

function confirmClearHighscores() {
  const track = document.getElementById('settings-clear-highscores');
  const thumb = track?.querySelector('.settings-clear-highscores-thumb');
  const label = track?.querySelector('.settings-clear-highscores-label');
  if (!track || !thumb || !label) return;

  clearHighscores();
  track.classList.remove('is-armed');
  track.removeAttribute('aria-valuemin');
  track.removeAttribute('aria-valuemax');
  track.removeAttribute('aria-valuenow');
  track.setAttribute('role', 'status');
  track.setAttribute('aria-label', 'High scores deleted');
  thumb.classList.remove('is-dragging');
  thumb.style.transform = 'translateY(-50%) translateX(0)';
  label.textContent = 'DELETED';
  track.classList.add('is-deleted-flash');
  track.style.pointerEvents = 'none';
  playSfx('ui_confirm');

  clearHighscoresFlashTimer = window.setTimeout(() => {
    clearHighscoresFlashTimer = null;
    resetClearHighscoresSlider();
  }, spd(CLEAR_HS_DELETED_FLASH_MS));
}

function getClearHighscoresMaxTravel(track, thumb) {
  return Math.max(0, track.offsetWidth - thumb.offsetWidth - CLEAR_HS_THUMB_PAD * 2);
}

function initClearHighscoresSlider() {
  const track = document.getElementById('settings-clear-highscores');
  const thumb = track?.querySelector('.settings-clear-highscores-thumb');
  if (!track || !thumb) return;

  let dragging = false;
  let pointerId = null;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let currentOffset = 0;

  const thumbTransform = offset =>
    `translateY(-50%) translateX(${offset}px)`;

  const setThumbOffset = (offset, animate = false) => {
    const max = getClearHighscoresMaxTravel(track, thumb);
    currentOffset = Math.min(max, Math.max(0, offset));
    if (!animate) thumb.classList.add('is-dragging');
    else thumb.classList.remove('is-dragging');
    thumb.style.transform = thumbTransform(currentOffset);
    if (track.classList.contains('is-armed')) {
      track.setAttribute('aria-valuenow', String(Math.round(max ? (currentOffset / max) * 100 : 0)));
    }
  };

  const armSlider = () => {
    if (track.classList.contains('is-armed')) return;
    track.classList.add('is-armed');
    track.setAttribute('role', 'slider');
    track.setAttribute('aria-label', 'Slide to clear high scores');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    thumb.classList.remove('is-dragging');
    currentOffset = 0;
    thumb.style.transform = thumbTransform(0);
    track.setAttribute('aria-valuenow', '0');
  };

  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    thumb.classList.remove('is-dragging');
    if (pointerId != null) {
      try { thumb.releasePointerCapture(pointerId); } catch { /* ignore */ }
      pointerId = null;
    }

    const max = getClearHighscoresMaxTravel(track, thumb);
    if (max > 0 && currentOffset >= max * CLEAR_HS_COMPLETE_RATIO) {
      confirmClearHighscores();
      return;
    }
    setThumbOffset(0, true);
  };

  track.addEventListener('click', e => {
    if (track.classList.contains('is-armed')) return;
    e.preventDefault();
    armSlider();
  });

  track.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (!track.classList.contains('is-armed')) armSlider();
  });

  thumb.addEventListener('pointerdown', e => {
    if (!track.classList.contains('is-armed')) return;
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartOffset = currentOffset;
    thumb.classList.add('is-dragging');
    thumb.setPointerCapture(e.pointerId);
  });

  thumb.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pointerId) return;
    setThumbOffset(dragStartOffset + (e.clientX - dragStartX));
  });

  thumb.addEventListener('pointerup', e => {
    if (e.pointerId !== pointerId) return;
    finishDrag();
  });

  thumb.addEventListener('pointercancel', e => {
    if (e.pointerId !== pointerId) return;
    finishDrag();
  });
}
