import { settings } from '../../logic/settings.js';
import { SUIT_COLOR, SWEPT_SUIT_ORDER, JOKER_RANK } from '../../logic/dice-visual.js';
import {
  buildSessionSweepTiles,
  SWEEP_DISCOVERY_RANKS,
} from '../../logic/suit-tally.js';

function sweepTileCountKey(suit, rank) {
  return `${suit}:${rank}`;
}

function matrixRankLabel(rank) {
  return rank === JOKER_RANK ? 'V' : rank;
}

function groupTilesBySuitRank(tiles) {
  /** @type {Record<string, typeof tiles>} */
  const groups = {};
  for (const tile of tiles) {
    const key = sweepTileCountKey(tile.suit, tile.rank);
    (groups[key] ??= []).push(tile);
  }
  return groups;
}

function sessionSweepDiscoveryHTML(tiles) {
  const groups = groupTilesBySuitRank(tiles);

  const bodyRows = [...SWEEP_DISCOVERY_RANKS].reverse().map(rank => {
    const cells = SWEPT_SUIT_ORDER.map(suit => {
      const swept = groups[sweepTileCountKey(suit, rank)] ?? [];
      if (!swept.length) {
        return '<td class="go-tile-matrix-cell"></td>';
      }
      const color = SUIT_COLOR[suit] ?? 'var(--text-dim)';
      const stack = swept.map(() =>
        `<span class="suit-discovery-glyph" style="color:${color}">${suit}</span>`,
      ).join('');
      return `<td class="go-tile-matrix-cell go-tile-matrix-cell--filled">
        <div class="suit-discovery-stack">${stack}</div>
      </td>`;
    }).join('');
    return `<tr>
      <th class="go-tile-matrix-rank suit-discovery-matrix-rowhead" scope="row">${matrixRankLabel(rank)}</th>
      ${cells}
    </tr>`;
  }).join('');

  return `<table class="go-tile-matrix suit-discovery-matrix">
    <colgroup>
      <col class="suit-discovery-col-header">
      <col span="${SWEPT_SUIT_ORDER.length}">
    </colgroup>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

/** @type {HTMLElement | null} */
let overlay = null;
/** @type {HTMLElement | null} */
let gridEl = null;
/** @type {HTMLElement | null} */
let mountRoot = null;
/** @type {HTMLElement | null} */
let heldRow = null;
let holdActive = false;

function ensureMountRoot() {
  if (!mountRoot) mountRoot = document.querySelector('.viewport-inner');
  return mountRoot;
}

function mountOverlay() {
  if (overlay) return overlay;
  const root = ensureMountRoot();
  if (!root) return null;

  overlay = document.createElement('div');
  overlay.id = 'suit-discovery-overlay';
  overlay.className = 'suit-discovery-overlay is-visible';
  overlay.setAttribute('aria-hidden', 'false');
  overlay.innerHTML = `<div class="suit-discovery-panel" role="dialog" aria-label="Swept tiles by rank and suit">
    <div id="suit-discovery-grid"></div>
  </div>`;
  root.appendChild(overlay);
  gridEl = overlay.querySelector('#suit-discovery-grid');
  return overlay;
}

function unmountOverlay() {
  overlay?.remove();
  overlay = null;
  gridEl = null;
}

function showOverlay() {
  if (!settings.sweptSuits || holdActive) return;
  const el = mountOverlay();
  if (!el || !gridEl) return;
  gridEl.innerHTML = sessionSweepDiscoveryHTML(buildSessionSweepTiles());
  holdActive = true;
}

function endHold() {
  heldRow?.classList.remove('is-held');
  heldRow = null;
  holdActive = false;
  unmountOverlay();
}

function onHoldEnd() {
  endHold();
}

function onPointerDown(e) {
  if (!settings.sweptSuits || holdActive) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const row = e.target.closest('.hud-suit-row');
  if (!row) return;
  e.stopPropagation();
  heldRow = row;
  row.classList.add('is-held');
  showOverlay();
  document.addEventListener('pointerup', onHoldEnd, { once: true });
  document.addEventListener('pointercancel', onHoldEnd, { once: true });
}

export function initSuitDiscoveryOverlay() {
  const hud = document.getElementById('hud');
  if (!hud) return;

  hud.addEventListener('pointerdown', onPointerDown);
  hud.addEventListener('click', e => {
    if (e.target.closest('.hud-suit-row')) e.stopPropagation();
  });
  window.addEventListener('blur', endHold);
}
