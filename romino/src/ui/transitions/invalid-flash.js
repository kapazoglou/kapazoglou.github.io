import { spd } from '../../logic/settings.js';

const FLASH_MS = 280;

let flashing = false;

/** Brief full-viewport red flash when a placement zone is hit but rules block it. */
export function flashInvalidPlacement() {
  if (flashing) return;
  const viewport = document.querySelector('.viewport');
  if (!viewport) return;

  flashing = true;
  const ms = spd(FLASH_MS);
  viewport.style.setProperty('--invalid-flash-ms', `${ms}ms`);
  viewport.classList.add('is-invalid-flash');
  setTimeout(() => {
    viewport.classList.remove('is-invalid-flash');
    flashing = false;
  }, ms);
}
