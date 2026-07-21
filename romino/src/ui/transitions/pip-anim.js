import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { starSVG } from '../../logic/dice-visual.js';
import { renderHUD } from '../display/hud-v2.js';
import { CONVERT_FLY_MS } from './timing.js';

const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';
const HUD_STAR_PX = 32;

function viewportScale() {
  const root = document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function toDesignPx(screenPx, scale) {
  return screenPx / scale;
}

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

/** Rect centre in viewport-inner design px. */
function rectCenterInLayer(rect, layerRect, scale) {
  return {
    left: toDesignPx(rect.left + rect.width / 2 - layerRect.left, scale),
    top: toDesignPx(rect.top + rect.height / 2 - layerRect.top, scale),
  };
}

/** Convert-style star fly (no pop/stagger). */
function launchStarFlyer(start, end, layer, flyMs) {
  const half = HUD_STAR_PX / 2;
  const dx = end.left - start.left;
  const dy = end.top - start.top;
  const fadeMs = Math.round(flyMs * 0.55);
  const fadeDelay = Math.round(flyMs * 0.45);

  const flyer = document.createElement('div');
  flyer.className = 'star-flyer';
  flyer.innerHTML = starSVG(HUD_STAR_PX);
  Object.assign(flyer.style, {
    left: `${start.left - half}px`,
    top: `${start.top - half}px`,
    width: `${HUD_STAR_PX}px`,
    height: `${HUD_STAR_PX}px`,
    transform: 'translate(0, 0)',
  });
  layer.appendChild(flyer);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.transition =
        `transform ${flyMs}ms ${FLY_EASING}, opacity ${fadeMs}ms ease ${fadeDelay}ms`;
      flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.88)`;
      flyer.style.opacity = '0';
    });
  });

  setTimeout(() => flyer.remove(), flyMs);
}

function launchStarFlyers(fromCenters, end, layer, flyMs) {
  for (const start of fromCenters) {
    launchStarFlyer(start, end, layer, flyMs);
  }
}

/** Visual-only row → HUD after state.stars was already updated. All stars fly together. */
export function collectStarsToHUD(count, fromRects, onDone) {
  if (count <= 0) {
    onDone?.();
    return;
  }

  const starsEl = document.getElementById('hud-stars');
  const layer = flyLayer();
  if (!starsEl || !layer) {
    onDone?.();
    return;
  }

  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const end = rectCenterInLayer(starsEl.getBoundingClientRect(), layerRect, scale);
  const flyMs = spd(CONVERT_FLY_MS);
  const fromCenters = fromRects
    .filter(Boolean)
    .map(rect => rectCenterInLayer(rect, layerRect, scale));

  starsEl.textContent = String(state.stars - count);

  if (!fromCenters.length) {
    starsEl.textContent = String(state.stars);
    renderHUD();
    onDone?.();
    return;
  }

  launchStarFlyers(fromCenters, end, layer, flyMs);

  setTimeout(() => {
    starsEl.textContent = String(state.stars);
    renderHUD();
    onDone?.();
  }, flyMs);
}

/** Column centre in viewport-inner design px — star payment target. */
function convertColCenter(col, layerRect, scale) {
  const inner = document.querySelector('.placement-row-inner');
  const colNode = inner?.querySelector(`.placement-col[data-col="${col}"]`);
  if (!colNode) return null;
  return rectCenterInLayer(colNode.getBoundingClientRect(), layerRect, scale);
}

/** Visual-only HUD → ace/joker stack before convert (mirror of collectStarsToHUD). */
export function payStarForConvert(col, onDone) {
  const starsEl = document.getElementById('hud-stars');
  const layer = flyLayer();
  if (!starsEl || !layer || state.stars <= 0) {
    onDone?.();
    return;
  }

  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const start = rectCenterInLayer(starsEl.getBoundingClientRect(), layerRect, scale);
  const end = convertColCenter(col, layerRect, scale);
  const flyMs = spd(CONVERT_FLY_MS);

  if (!end) {
    onDone?.();
    return;
  }

  starsEl.textContent = String(state.stars - 1);
  launchStarFlyer(start, end, layer, flyMs);

  setTimeout(() => {
    onDone?.();
  }, flyMs);
}

/** Visual-only HUD stars → points after state was already updated. All stars fly together. */
export function bankStarsToPoints(count, onDone) {
  if (count <= 0) {
    onDone?.();
    return;
  }

  const starsEl = document.getElementById('hud-stars');
  const pointsEl = document.getElementById('hud-points');
  const layer = flyLayer();
  if (!starsEl || !pointsEl || !layer) {
    onDone?.();
    return;
  }

  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const start = rectCenterInLayer(starsEl.getBoundingClientRect(), layerRect, scale);
  const end = rectCenterInLayer(pointsEl.getBoundingClientRect(), layerRect, scale);
  const flyMs = spd(CONVERT_FLY_MS);

  starsEl.textContent = String(count);
  pointsEl.textContent = String(state.points - count);

  const fromCenters = Array.from({ length: count }, () => start);
  launchStarFlyers(fromCenters, end, layer, flyMs);

  setTimeout(() => {
    starsEl.textContent = String(state.stars);
    pointsEl.textContent = String(state.points);
    renderHUD();
    onDone?.();
  }, flyMs);
}
