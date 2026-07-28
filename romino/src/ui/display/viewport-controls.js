const ZOOM_MIN = 0.75;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.05;

const TOUCH_PHONE = '(hover: none) and (pointer: coarse)';

let root = null;
let zoomOutBtn = null;
let zoomInBtn = null;
let fullscreenBtn = null;
let userZoom = 1;

function isTouchPhone() {
  return window.matchMedia(TOUCH_PHONE).matches;
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

function applyZoom() {
  document.documentElement.style.setProperty('--user-zoom', String(userZoom));
  if (zoomOutBtn) zoomOutBtn.disabled = userZoom <= ZOOM_MIN + 0.001;
  if (zoomInBtn) zoomInBtn.disabled = userZoom >= ZOOM_MAX - 0.001;
}

function setZoom(next) {
  userZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
  applyZoom();
}

function syncVisibility() {
  if (!root) return;
  const show = isTouchPhone();
  root.hidden = !show;
  root.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function syncFullscreenButton() {
  if (!fullscreenBtn) return;
  const on = isFullscreen();
  fullscreenBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  fullscreenBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Enter full screen');
  fullscreenBtn.textContent = on ? '⤡' : '⛶';
}

async function toggleFullscreen() {
  const app = document.getElementById('app');
  if (!app) return;

  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else if (app.requestFullscreen) {
      await app.requestFullscreen();
    } else if (app.webkitRequestFullscreen) {
      app.webkitRequestFullscreen();
    }
  } catch { /* gesture or policy blocked */ }
  syncFullscreenClass();
  syncFullscreenButton();
}

function onMediaChange() {
  syncVisibility();
}

/** Zoom +/- and full-screen for touch phones (hidden on desktop). */
export function initViewportControls() {
  const app = document.getElementById('app');
  if (!app || document.getElementById('viewport-controls')) return;

  root = document.createElement('div');
  root.id = 'viewport-controls';
  root.className = 'viewport-controls';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <button type="button" class="viewport-controls-btn" id="viewport-zoom-out" aria-label="Zoom out">−</button>
    <button type="button" class="viewport-controls-btn" id="viewport-zoom-in" aria-label="Zoom in">+</button>
    <button type="button" class="viewport-controls-btn viewport-controls-btn--wide" id="viewport-fullscreen" aria-label="Enter full screen" aria-pressed="false">⛶</button>
  `;
  app.appendChild(root);

  zoomOutBtn = root.querySelector('#viewport-zoom-out');
  zoomInBtn = root.querySelector('#viewport-zoom-in');
  fullscreenBtn = root.querySelector('#viewport-fullscreen');

  zoomOutBtn.addEventListener('click', () => setZoom(userZoom - ZOOM_STEP));
  zoomInBtn.addEventListener('click', () => setZoom(userZoom + ZOOM_STEP));
  fullscreenBtn.addEventListener('click', () => { toggleFullscreen(); });

  document.addEventListener('fullscreenchange', () => {
    syncFullscreenClass();
    syncFullscreenButton();
  });
  document.addEventListener('webkitfullscreenchange', () => {
    syncFullscreenClass();
    syncFullscreenButton();
  });

  window.matchMedia(TOUCH_PHONE).addEventListener('change', onMediaChange);
  window.addEventListener('orientationchange', syncVisibility);
  window.addEventListener('resize', syncVisibility);

  applyZoom();
  syncVisibility();
  syncFullscreenButton();
}
