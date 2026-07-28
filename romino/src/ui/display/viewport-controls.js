const TOUCH_PHONE = '(hover: none) and (pointer: coarse)';

let root = null;
let fullscreenBtn = null;

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
    <button type="button" class="viewport-controls-btn" id="viewport-fullscreen" aria-label="Enter full screen" aria-pressed="false">⛶</button>
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
