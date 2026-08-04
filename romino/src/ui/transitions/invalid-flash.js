import { spd } from '../../logic/settings.js';
import { state } from '../../logic/state.js';
import { getStripTileForIdentity, getRowColForIdentity } from '../../logic/dealt-strip.js';

const FLASH_MS = 280;
const WARNING_BORDER_MS = 3000;

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

function flashHudStarsWarning(ms) {
  const starsEl = document.getElementById('hud-stars');
  if (!starsEl) return;
  starsEl.classList.add('is-star-warning');
  setTimeout(() => starsEl.classList.remove('is-star-warning'), ms);
}

/** Red viewport flash plus warning-red star count when ace/joker blocked with zero stars. */
export function flashStarShortagePlacement() {
  flashInvalidPlacement();
  if (state.stars !== 0) return;
  flashHudStarsWarning(spd(FLASH_MS));
}

/**
 * Duplicate convert blocked — viewport flash + warning border on strip or row tile for 3s.
 * @param {string} suit
 * @param {string} rank
 */
export function flashDuplicateBlocked(suit, rank) {
  flashInvalidPlacement();

  const stripTile = getStripTileForIdentity(suit, rank);
  const rowCol = getRowColForIdentity(suit, rank);

  if (stripTile) state.dealtStripWarningIds.add(stripTile.stripId);
  if (rowCol != null) state.rowTileWarningCols.add(rowCol);

  import('../display/render.js').then(({ render }) => render());

  const ms = spd(WARNING_BORDER_MS);
  setTimeout(() => {
    if (stripTile) state.dealtStripWarningIds.delete(stripTile.stripId);
    if (rowCol != null) state.rowTileWarningCols.delete(rowCol);
    import('../display/render.js').then(({ render }) => render());
  }, ms);
}

/**
 * Nine-cubes lock blocked — viewport flash + 3s warning border on the locking row tile.
 * @param {number} lockCol
 */
export function flashCubeBlocked(lockCol) {
  flashInvalidPlacement();
  if (lockCol == null) return;

  state.rowTileWarningCols.add(lockCol);

  import('../display/render.js').then(({ render }) => render());

  const ms = spd(WARNING_BORDER_MS);
  setTimeout(() => {
    state.rowTileWarningCols.delete(lockCol);
    import('../display/render.js').then(({ render }) => render());
  }, ms);
}
