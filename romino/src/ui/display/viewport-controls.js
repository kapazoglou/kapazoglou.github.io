const TOUCH_PHONE = '(hover: none) and (pointer: coarse)';

let root = null;
let fullscreenBtn = null;

/** Enter full screen — square frame (corners outward). */
function squareFrameSVG(size = 24) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      d="M8 3H3v5 M16 3h5v5 M8 21H3v-5 M16 21h5v-5"/>
  </svg>`;
}

/** Exit full screen — reverse square frame (corners inward). */
function reverseSquareFrameSVG(size = 24) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      d="M3 8V3h5 M21 8V3h-5 M3 16v5h5 M21 16v5h-5"/>
  </svg>`;
}

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
  fullscreenBtn.innerHTML = on ? reverseSquareFrameSVG() : squareFrameSVG();
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

/** Full-screen toggle for touch phones (hidden on desktop). */
export function initViewportControls() {
  const app = document.getElementById('app');
  if (!app || document.getElementById('viewport-controls')) return;

  root = document.createElement('div');
  root.id = 'viewport-controls';
  root.className = 'viewport-controls';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <button type="button" class="viewport-controls-btn" id="viewport-fullscreen" aria-label="Enter full screen" aria-pressed="false">${squareFrameSVG()}</button>
  `;
  app.appendChild(root);

  fullscreenBtn = root.querySelector('#viewport-fullscreen');
  fullscreenBtn.addEventListener('click', () => { toggleFullscreen(); });

  document.addEventListener('fullscreenchange', () => {
    syncFullscreenClass();
    syncFullscreenButton();
  });
  document.addEventListener('webkitfullscreenchange', () => {
    syncFullscreenClass();
    syncFullscreenButton();
  });

  window.matchMedia(TOUCH_PHONE).addEventListener('change', syncVisibility);
  window.addEventListener('orientationchange', syncVisibility);
  window.addEventListener('resize', syncVisibility);

  syncVisibility();
  syncFullscreenButton();
}
