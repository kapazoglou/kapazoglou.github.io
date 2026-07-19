import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { findStarMatches } from '../../logic/stars.js';
import { dieSVG, SUIT_COLOR, hintTriangleSVG, DIE_OUTER, dieFaceBorderColor, starSVG } from '../../logic/dice-visual.js';
import {
  getOccupiedCols, getValidSlotsForDie,
  isPlacedThisTurn, getColumn, CENTER_COL,
} from '../../logic/row.js';

function tileHTML(tile, col) {
  const color = SUIT_COLOR[tile.suit] ?? '#404A59';
  const isNew = state.newTileCols?.has(col);
  return `<div class="placement-tile${isNew ? ' is-new' : ''}" style="color:${color}">
    <span class="placement-tile-rank">${tile.rank}</span>
    <span class="placement-tile-suit">${tile.suit}</span>
  </div>`;
}

function stackHTML(col, column) {
  return column.dice.map((dieId, i) => {
    const die = state.dice[dieId];
    const sel = state.selectedDieId === dieId;
    const ret = isPlacedThisTurn(dieId);
    const z = i + 1;
    const style = ret
      ? `--stack-z:${z};--die-border-fill:${dieFaceBorderColor(die.value)}`
      : `--stack-z:${z}`;
    return `<div class="die die--placed${sel ? ' die--placed-selected' : ''}${ret ? ' die--returnable' : ''}" data-die-id="${dieId}" data-col="${col}" style="${style}">${dieSVG(die.value, DIE_OUTER)}</div>`;
  }).join('');
}

function colElement(inner, col) {
  return inner.querySelector(`.placement-col[data-col="${col}"]`);
}

function edgeGhost(inner, side) {
  return inner.querySelector(`.placement-col--ghost-edge[data-edge="${side}"]`);
}

/** getBoundingClientRect is post-transform; hint left/top are design px inside .viewport-inner */
function viewportScale() {
  const root = document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function toDesignPx(screenPx, scale) {
  return screenPx / scale;
}

function gapCenterX(leftEl, rightEl, innerRect, scale) {
  const l = leftEl.getBoundingClientRect();
  const r = rightEl.getBoundingClientRect();
  return toDesignPx((l.right + r.left) / 2 - innerRect.left, scale) - DIE_OUTER / 2;
}

/** Visual bottom die in a column (anchored row). */
function bottomDieInCol(colNode) {
  const dice = colNode.querySelectorAll('.die--placed');
  if (!dice.length) return null;
  return settings.stackBottomUp ? dice[0] : dice[dice.length - 1];
}

/** Last placed die — top of stack. */
function topDieInCol(colNode) {
  const dice = colNode.querySelectorAll('.die--placed');
  if (!dice.length) return null;
  return settings.stackBottomUp ? dice[dice.length - 1] : dice[0];
}

function colBottomY(colNode, innerRect, scale) {
  const die = bottomDieInCol(colNode);
  const rect = (die ?? colNode).getBoundingClientRect();
  return toDesignPx(rect.bottom - innerRect.top, scale);
}

/** Figma Group 3 — upward hint tip aligns to bottom die edge (between rounded corners). */
const TIP_UP_Y = 6;
/** Figma — downward stack hint tip above the last placed die. */
const HINT_ABOVE_DIE = 2;
const TIP_DOWN_Y = 42;

const GAP_H = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-gap-h')) || 6;
const COL_W = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col-width')) || 48;
const STAR_MARKER_PX = 28;

function cellElAtRow(colNode, row) {
  if (colNode.classList.contains('placement-col--tile')) {
    return row === 0 ? colNode.querySelector('.placement-tile') : null;
  }
  const dice = colNode.querySelectorAll('.die--placed');
  return dice[row] ?? null;
}

/** Screen-space centre of the die band at `row` (tiles use bottom die-height strip). */
function dieCenterAtRow(colNode, row, scale) {
  if (colNode.classList.contains('placement-col--tile')) {
    if (row !== 0) return null;
    const colRect = colNode.getBoundingClientRect();
    const diePx = DIE_OUTER * scale;
    return {
      x: (colRect.left + colRect.right) / 2,
      y: colRect.bottom - diePx / 2,
    };
  }
  const die = cellElAtRow(colNode, row);
  if (!die) return null;
  const rect = die.getBoundingClientRect();
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  };
}

function starMarkerCenter(leftCol, rightCol, row, innerRect, scale) {
  const leftCenter = dieCenterAtRow(leftCol, row, scale);
  const rightCenter = dieCenterAtRow(rightCol, row, scale);
  if (!leftCenter || !rightCenter) return null;
  return {
    x: toDesignPx((leftCenter.x + rightCenter.x) / 2 - innerRect.left, scale),
    y: toDesignPx((leftCenter.y + rightCenter.y) / 2 - innerRect.top, scale),
  };
}

/** Viewport-centre X in scroll content space — survives column insert/remove. */
let pinnedContentX = null;

/** Pin row scroll across renders until `unpinRowScroll()`. */
export function pinRowScroll() {
  const el = document.getElementById('placement-row');
  if (!el) return;
  pinnedContentX = el.scrollLeft + el.clientWidth / 2;
}

export function unpinRowScroll() {
  pinnedContentX = null;
}

export function restorePinnedRowScroll() {
  const el = document.getElementById('placement-row');
  if (!el || pinnedContentX == null) return;
  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
  el.scrollLeft = Math.min(maxScroll, Math.max(0, pinnedContentX - el.clientWidth / 2));
}

export function renderPlacementRow() {
  const el = document.getElementById('placement-row');
  if (!el) return;

  const se = state.sweepExit;
  const sweepRun = se?.phase === 'run';
  el.classList.toggle('is-sweep-run', sweepRun);

  const scrollLeft = el.scrollLeft;
  const usePin = pinnedContentX != null;
  const occupied = getOccupiedCols();
  const showEdgeGhosts = occupied.length > 0 && state.selectedDieId != null && state.phase !== 'animating';

  let colsHTML = '';
  if (occupied.length === 0) {
    colsHTML = `<div class="placement-col placement-col--ghost placement-col--ghost-first" data-col="${CENTER_COL}"></div>`;
  } else {
    for (const col of occupied) {
      const column = getColumn(col);
      let colClass = 'placement-col';
      let colStyle = '';

      if (se?.cols.includes(col)) {
        if (se.phase === 'wait') colClass += ' placement-col--sweep-pending';
        else if (se.phase === 'run') {
          colClass += ' placement-col--sweep';
          colStyle = ` style="--exit-order:${se.cols.indexOf(col)}"`;
        }
      }

      if (column.kind === 'tile') {
        colsHTML += `<div class="${colClass} placement-col--tile" data-col="${col}"${colStyle}>${tileHTML(column, col)}</div>`;
      } else {
        const converting = state.convertingCol === col;
        const pairClass = column.dice.length === 2 ? ' placement-col--stack-pair' : '';
        const dirClass = settings.stackBottomUp ? ' placement-col--stack-bottom-up' : '';
        colsHTML += `<div class="${colClass} placement-col--stack${pairClass}${dirClass}${converting ? ' is-converting' : ''}" data-col="${col}"${colStyle}>${stackHTML(col, column)}</div>`;
      }
    }
  }

  const edgeGhosts = showEdgeGhosts ? edgeGhostsMarkup() : '';

  el.innerHTML = `<div class="placement-row-inner${sweepRun ? ' is-sweep-run' : ''}">${colsHTML}${edgeGhosts}</div>`;
  if (usePin) {
    restorePinnedRowScroll();
  } else {
    el.scrollLeft = scrollLeft;
  }
}

/** Edge insert targets — out of flex flow so columns never shift on select. */
export function positionEdgeGhosts() {
  const inner = document.querySelector('.placement-row-inner');
  const layer = inner?.querySelector('.placement-edge-ghosts');
  if (!layer) return;

  const occupied = getOccupiedCols();
  if (!occupied.length) return;

  const firstCol = colElement(inner, occupied[0]);
  const lastCol = colElement(inner, occupied[occupied.length - 1]);
  if (!firstCol || !lastCol) return;

  const gap = GAP_H();
  const colW = COL_W();
  const leftGhost = layer.querySelector('[data-edge="left"]');
  const rightGhost = layer.querySelector('[data-edge="right"]');

  if (leftGhost) {
    leftGhost.style.left = `${firstCol.offsetLeft - gap - colW}px`;
  }
  if (rightGhost) {
    rightGhost.style.left = `${lastCol.offsetLeft + lastCol.offsetWidth + gap}px`;
  }
}

function edgeGhostsMarkup() {
  return `<div class="placement-edge-ghosts" aria-hidden="true">
        <div class="placement-col placement-col--ghost placement-col--ghost-edge" data-edge="left"></div>
        <div class="placement-col placement-col--ghost placement-col--ghost-edge" data-edge="right"></div>
      </div>`;
}

/** Sync selection chrome without rebuilding columns (keeps tile text stable). */
export function updatePlacementSelection() {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return;

  inner.querySelectorAll('.die--action, .die--placed').forEach(el => {
    const id = Number(el.dataset.dieId);
    const sel = state.selectedDieId === id;
    if (el.classList.contains('die--action')) {
      el.classList.toggle('die--action-selected', sel);
    }
    if (el.classList.contains('die--placed')) {
      el.classList.toggle('die--placed-selected', sel);
    }
  });

  const occupied = getOccupiedCols();
  const showEdgeGhosts = occupied.length > 0 && state.selectedDieId != null && state.phase !== 'animating';
  const layer = inner.querySelector('.placement-edge-ghosts');

  if (!showEdgeGhosts) {
    layer?.remove();
    return;
  }

  if (!layer) inner.insertAdjacentHTML('beforeend', edgeGhostsMarkup());
}

/** Position hint triangles after layout (Figma Group 3) */
export function positionHints() {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return;

  const old = inner.querySelector('.placement-hints');
  if (state.selectedDieId == null || state.phase === 'animating') {
    old?.remove();
    return;
  }

  const slots = getValidSlotsForDie(state.selectedDieId);
  if (old) old.remove();
  if (!slots.length) return;

  const hints = document.createElement('div');
  hints.className = 'placement-hints';
  inner.appendChild(hints);

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();

  for (const slot of slots) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.tabIndex = -1;
    const stackHint = slot.kind === 'stack';
    const hintDir = stackHint ? 'down' : 'up';
    btn.className = `placement-hint placement-hint--${hintDir}`;
    btn.setAttribute('aria-label', 'Place here');
    btn.innerHTML = hintTriangleSVG(hintDir);

    if (slot.kind === 'insert') {
      btn.dataset.kind = 'insert';
      btn.dataset.leftCol = slot.leftCol ?? '';
      btn.dataset.rightCol = slot.rightCol ?? '';
      const leftEl = slot.leftCol != null ? colElement(inner, slot.leftCol) : edgeGhost(inner, 'left');
      const rightEl = slot.rightCol != null ? colElement(inner, slot.rightCol) : edgeGhost(inner, 'right');
      if (!leftEl || !rightEl) continue;
      const dieBottom = Math.max(colBottomY(leftEl, innerRect, scale), colBottomY(rightEl, innerRect, scale));
      btn.style.left = `${gapCenterX(leftEl, rightEl, innerRect, scale)}px`;
      btn.style.top = `${dieBottom - TIP_UP_Y}px`;
    } else if (slot.kind === 'new-column') {
      btn.dataset.col = String(slot.col);
      btn.dataset.kind = slot.kind;
      const colNode = colElement(inner, slot.col);
      if (!colNode) continue;
      const colRect = colNode.getBoundingClientRect();
      btn.style.left = `${toDesignPx(colRect.left - innerRect.left, scale) + (toDesignPx(colRect.width, scale) - DIE_OUTER) / 2}px`;
      btn.style.top = `${toDesignPx(colRect.bottom - innerRect.top, scale) - TIP_UP_Y}px`;
    } else {
      btn.dataset.col = String(slot.col);
      btn.dataset.kind = slot.kind;
      const colNode = colElement(inner, slot.col);
      if (!colNode) continue;
      const topDie = topDieInCol(colNode);
      if (!topDie) continue;
      const topRect = topDie.getBoundingClientRect();
      btn.style.left = `${toDesignPx(topRect.left - innerRect.left, scale) + (toDesignPx(topRect.width, scale) - DIE_OUTER) / 2}px`;
      btn.style.top = `${toDesignPx(topRect.top - innerRect.top, scale) - HINT_ABOVE_DIE - TIP_DOWN_Y}px`;
    }
    hints.appendChild(btn);
  }
}

/** Live ⭐ preview between adjacent matching dice while placing. */
export function positionStarMarkers() {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return;

  const old = inner.querySelector('.placement-stars');
  if (state.phase !== 'rolled') {
    old?.remove();
    return;
  }

  const matches = findStarMatches();
  if (!matches.length) {
    old?.remove();
    return;
  }

  let layer = old;
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'placement-stars';
    layer.setAttribute('aria-hidden', 'true');
    inner.appendChild(layer);
  }
  layer.replaceChildren();

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();

  for (const match of matches) {
    const leftCol = colElement(inner, match.leftCol);
    const rightCol = colElement(inner, match.rightCol);
    if (!leftCol || !rightCol) continue;
    const center = starMarkerCenter(leftCol, rightCol, match.row, innerRect, scale);
    if (!center) continue;

    const el = document.createElement('span');
    el.className = 'placement-star';
    el.innerHTML = starSVG(STAR_MARKER_PX);
    el.style.left = `${center.x}px`;
    el.style.top = `${center.y}px`;
    layer.appendChild(el);
  }
}

/** Screen rects for star-collect pip launch (post-convert confirm). */
export function getStarMatchRects(matches) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner || !matches.length) return [];

  const innerRect = inner.getBoundingClientRect();
  const scale = viewportScale();
  const rects = [];

  for (const match of matches) {
    const leftCol = colElement(inner, match.leftCol);
    const rightCol = colElement(inner, match.rightCol);
    if (!leftCol || !rightCol) continue;
    const center = starMarkerCenter(leftCol, rightCol, match.row, innerRect, scale);
    if (!center) continue;

    const cx = innerRect.left + center.x * scale;
    const cy = innerRect.top + center.y * scale;
    const size = STAR_MARKER_PX * scale;
    rects.push(new DOMRect(cx - size / 2, cy - size / 2, size, size));
  }
  return rects;
}
