import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { renderHUD } from './hud.js';
import { launchPip } from '../transitions/card-anim.js';

/** Matches #hud font-size — static grid coins use the same emoji size. */
export const HUD_COIN_FONT_PX = 28;

const CELL = 119;
const PAD = 14;

/** Centre of a die slot within a 116×116 square card (grid-local px). */
function slotCenterInCard(si) {
  if (si === 0) return { x: 32, y: 32 };
  if (si === 1) return { x: 84, y: 32 };
  return { x: 84, y: 84 };
}

/** Parse coin key "gridA:gridB:slotA:slotB". */
export function gridCoinEdgeSlots(key) {
  const parts = key.split(':').map(Number);
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return null;
  return { gridA: parts[0], gridB: parts[1], slotA: parts[2], slotB: parts[3] };
}

/** Grid-local centre (px) for a coin key — fallback when DOM dice are unavailable. */
export function gridCoinCenterPx(key) {
  const edge = gridCoinEdgeSlots(key);
  if (!edge) return { cx: 0, cy: 0 };
  const size = settings.extendedGrid ? 4 : 3;
  const ra = Math.floor(edge.gridA / size);
  const ca = edge.gridA % size;
  const rb = Math.floor(edge.gridB / size);
  const cb = edge.gridB % size;
  const posA = slotCenterInCard(edge.slotA);
  const posB = slotCenterInCard(edge.slotB);
  return {
    cx: (PAD + ca * CELL + posA.x + PAD + cb * CELL + posB.x) / 2,
    cy: (PAD + ra * CELL + posA.y + PAD + rb * CELL + posB.y) / 2,
  };
}

function dieMidpointPx(key, gridEl) {
  const edge = gridCoinEdgeSlots(key);
  if (!edge) return null;
  const idA = state.grid[edge.gridA];
  const idB = state.grid[edge.gridB];
  if (idA == null || idB == null) return null;

  const elA = gridEl.querySelector(`[data-slot="${idA}-${edge.slotA}"] .die-wrapper`);
  const elB = gridEl.querySelector(`[data-slot="${idB}-${edge.slotB}"] .die-wrapper`);
  if (!elA || !elB) return null;

  const gridRect = gridEl.getBoundingClientRect();
  const rA = elA.getBoundingClientRect();
  const rB = elB.getBoundingClientRect();
  return {
    cx: (rA.left + rA.width / 2 + rB.left + rB.width / 2) / 2 - gridRect.left,
    cy: (rA.top + rA.height / 2 + rB.top + rB.height / 2) / 2 - gridRect.top,
  };
}

function gridCoinFromRect(key, gridEl) {
  const midpoint = dieMidpointPx(key, gridEl);
  const gridRect = gridEl.getBoundingClientRect();
  const half = HUD_COIN_FONT_PX / 2;
  if (midpoint) {
    return {
      left:   gridRect.left + midpoint.cx - half,
      top:    gridRect.top + midpoint.cy - half,
      width:  HUD_COIN_FONT_PX,
      height: HUD_COIN_FONT_PX,
    };
  }
  const { cx, cy } = gridCoinCenterPx(key);
  return {
    left:   gridRect.left + cx - half,
    top:    gridRect.top + cy - half,
    width:  HUD_COIN_FONT_PX,
    height: HUD_COIN_FONT_PX,
  };
}

/** After render, centre each coin on the midpoint of its matching dice pair. */
export function syncGridCoinPositions() {
  const gridEl = document.getElementById('grid-container');
  if (!gridEl) return;
  for (const key of state.gridCoins) {
    const coinEl = gridEl.querySelector(`[data-coin-key="${key}"]`);
    if (!coinEl) continue;
    const midpoint = dieMidpointPx(key, gridEl);
    const { cx, cy } = midpoint ?? gridCoinCenterPx(key);
    coinEl.style.left = `${cx}px`;
    coinEl.style.top = `${cy}px`;
  }
}

/** Fly every visible grid coin to the HUD score counter at once (tray → grid placement). */
export function collectGridCoins() {
  if (!settings.square || !settings.scoring || !state.gridCoins.size) return;
  const gridEl = document.getElementById('grid-container');
  const scoreEl = document.getElementById('score-display');
  if (!gridEl || !scoreEl) return;

  const toRect = scoreEl.getBoundingClientRect();
  const keys = [...state.gridCoins];
  for (const key of keys) state.collectedGridCoins.add(key);
  state.gridCoins = new Set();

  for (const key of keys) {
    const fromRect = gridCoinFromRect(key, gridEl);
    launchPip(
      fromRect,
      toRect,
      () => { state.score++; renderHUD(); },
      () => {},
      HUD_COIN_FONT_PX,
    );
  }
}
