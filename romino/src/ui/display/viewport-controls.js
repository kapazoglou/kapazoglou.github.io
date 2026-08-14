import { settings } from '../../logic/settings.js';

const SETTINGS_STORAGE_KEY = 'romino-v2-settings';

function persistFullScreenPref() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...saved, fullScreen: settings.fullScreen }));
  } catch { /* ignore */ }
}

function fullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function isFullscreen() {
  return fullscreenElement() === document.getElementById('app');
}

function syncFullscreenClass() {
  document.documentElement.classList.toggle('is-browser-fullscreen', isFullscreen());
}

async function enterFullscreen() {
  const app = document.getElementById('app');
  if (!app || isFullscreen()) return;

  try {
    if (app.requestFullscreen) await app.requestFullscreen();
    else if (app.webkitRequestFullscreen) app.webkitRequestFullscreen();
  } catch { /* gesture or policy blocked */ }
  syncFullscreenClass();
}

async function exitFullscreen() {
  if (!isFullscreen()) return;

  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  } catch { /* ignore */ }
  syncFullscreenClass();
}

function onFullscreenChange() {
  syncFullscreenClass();
  const on = isFullscreen();
  if (settings.fullScreen === on) return;
  settings.fullScreen = on;
  persistFullScreenPref();
}

/** Enter or exit browser full screen on `#app` (Fullscreen API + layout class). */
export async function setFullscreenEnabled(want) {
  if (want) await enterFullscreen();
  else await exitFullscreen();
}

/** Sync listeners; optional boot enter when saved pref is on (may fail without user gesture). */
export function initViewportControls() {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  syncFullscreenClass();

  if (settings.fullScreen && !isFullscreen()) {
    enterFullscreen();
  }
}
