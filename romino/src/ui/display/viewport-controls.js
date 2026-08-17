import { settings } from '../../logic/settings.js';

const SETTINGS_STORAGE_KEY = 'romino-v2-settings';
/** Must match `:root { --design-height }` in base.css */
const DESIGN_HEIGHT = 412;
const DESIGN_WIDTH_MIN = DESIGN_HEIGHT * (16 / 9);

const FS_VARS = [
  '--fs-frame-w',
  '--fs-frame-h',
  '--fs-viewport-scale',
  '--fs-design-w',
  '--fs-design-h',
];

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

/** Width-first fullscreen layout; extend design height (or width on ultrawide). */
function computeFullscreenLayout(frameW, frameH) {
  const scaleW = frameW / DESIGN_WIDTH_MIN;
  const designHAtW = frameH / scaleW;

  if (designHAtW >= DESIGN_HEIGHT) {
    return { scale: scaleW, designW: DESIGN_WIDTH_MIN, designH: designHAtW };
  }

  const scale = frameH / DESIGN_HEIGHT;
  return { scale, designW: frameW / scale, designH: DESIGN_HEIGHT };
}

/** Match layout vars to the real fullscreen element box (vw/dvh can overshoot on desktop). */
function syncFullscreenMetrics() {
  const root = document.documentElement;
  const app = document.getElementById('app');
  if (!app || !isFullscreen()) {
    for (const key of FS_VARS) root.style.removeProperty(key);
    return;
  }

  const frameW = app.clientWidth;
  const frameH = app.clientHeight;
  const { scale, designW, designH } = computeFullscreenLayout(frameW, frameH);

  root.style.setProperty('--fs-frame-w', `${frameW}px`);
  root.style.setProperty('--fs-frame-h', `${frameH}px`);
  root.style.setProperty('--fs-viewport-scale', String(scale));
  root.style.setProperty('--fs-design-w', `${designW}px`);
  root.style.setProperty('--fs-design-h', `${designH}px`);
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
