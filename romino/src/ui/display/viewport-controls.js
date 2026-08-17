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

/** Match layout vars to the real fullscreen element box (vw/dvh can overshoot on desktop). */
function syncFullscreenMetrics() {
  const root = document.documentElement;
  const app = document.getElementById('app');
  if (!app || !isFullscreen()) {
    root.style.removeProperty('--fs-frame-w');
    root.style.removeProperty('--fs-frame-h');
    return;
  }
  root.style.setProperty('--fs-frame-w', `${app.clientWidth}px`);
  root.style.setProperty('--fs-frame-h', `${app.clientHeight}px`);
}

async function enterFullscreen() {
  const app = document.getElementById('app');
  if (!app || isFullscreen()) return;

  try {
    if (app.requestFullscreen) await app.requestFullscreen();
    else if (app.webkitRequestFullscreen) app.webkitRequestFullscreen();
  } catch { /* gesture or policy blocked */ }
  syncFullscreenClass();
  syncFullscreenMetrics();
}

async function exitFullscreen() {
  if (!isFullscreen()) return;

  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  } catch { /* ignore */ }
  syncFullscreenClass();
  syncFullscreenMetrics();
}

function onFullscreenChange() {
  syncFullscreenClass();
  syncFullscreenMetrics();
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

let metricsListenerBound = false;

function bindFullscreenMetricsListener() {
  if (metricsListenerBound) return;
  metricsListenerBound = true;
  window.addEventListener('resize', syncFullscreenMetrics);
}

/** Sync listeners; optional boot enter when saved pref is on (may fail without user gesture). */
export function initViewportControls() {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  bindFullscreenMetricsListener();

  syncFullscreenClass();
  syncFullscreenMetrics();

  if (settings.fullScreen && !isFullscreen()) {
    enterFullscreen();
  }
}
