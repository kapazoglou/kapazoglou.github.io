import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { findStarMatches } from '../../logic/stars.js';
import { dieSVG, hintTriangleSVG, DIE_OUTER, dieFaceBorderColor, starSVG, tileHTML } from '../../logic/dice-visual.js';
import { COL_SPREAD_MS } from '../transitions/timing.js';
import {
  getOccupiedCols, getValidSlotsForDie, getValidSlotsForDealtTile,
  isPlacedThisTurn, isTopDieInStack, getColumn, CENTER_COL, dieIdAt, canPlaceDealtTile, isPlacedDealtTileCol,
} from '../../logic/row.js';

function stackHTML(col, column) {
  return column.dice.map((dieId, i) => {
    const die = state.dice[dieId];
    const sel = state.selectedDieId === dieId && state.draggingDieId !== dieId;
    const ret = isPlacedThisTurn(dieId) && isTopDieInStack(dieId);
    const dragging = state.draggingDieId === dieId;
    const z = i + 1;
    const style = ret
      ? `--stack-z:${z};--die-border-fill:${dieFaceBorderColor(die.value)}`
      : `--stack-z:${z}`;
    return `<div class="die die--placed${sel ? ' die--placed-selected' : ''}${ret ? ' die--returnable' : ''}${dragging ? ' die--drag-source' : ''}" data-die-id="${dieId}" data-col="${col}" style="${style}">${dieSVG(die.value, DIE_OUTER)}</div>`;
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

function colSpreadDx(el) {
  if (!el) return 0;
  const m = el.style.transform.match(/translate3d\(([-\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
}

/** Gap insert spread pushes the flanking pair in opposite directions — hide the star between them. */
function starAtOpeningGap(leftEl, rightEl) {
  const ldx = colSpreadDx(leftEl);
  const rdx = colSpreadDx(rightEl);
  return ldx < -0.5 && rdx > 0.5;
}

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

function verticalStarMarkerCenter(colNode, topRow, innerRect, scale) {
  const topCenter = dieCenterAtRow(colNode, topRow, scale);
  const bottomCenter = dieCenterAtRow(colNode, topRow + 1, scale);
  if (!topCenter || !bottomCenter) return null;
  return {
    x: toDesignPx(topCenter.x - innerRect.left, scale),
    y: toDesignPx((topCenter.y + bottomCenter.y) / 2 - innerRect.top, scale),
  };
}

function starMatchKey(match) {
  return match.axis === 'v'
    ? `v-${match.col}-${match.row}`
    : `h-${match.leftCol}-${match.rightCol}-${match.row}`;
}

function starMatchMarkerCenter(match, inner, innerRect, scale) {
  if (match.axis === 'v') {
    const colNode = colElement(inner, match.col);
    if (!colNode) return null;
    return verticalStarMarkerCenter(colNode, match.row, innerRect, scale);
  }
  const leftCol = colElement(inner, match.leftCol);
  const rightCol = colElement(inner, match.rightCol);
  if (!leftCol || !rightCol) return null;
  if (starAtOpeningGap(leftCol, rightCol)) return null;
  return starMarkerCenter(leftCol, rightCol, match.row, innerRect, scale);
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
  const showEdgeGhosts = !settings.directPlacement
    && occupied.length > 0
    && (state.selectedDieId != null || state.selectedDealtTile)
    && state.phase !== 'animating';

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
        const returnable = isPlacedDealtTileCol(col);
        const selected = returnable && state.selectedDealtTile;
        const classExtra = [
          returnable ? 'placement-tile--returnable' : '',
          selected ? 'placement-tile--selected' : '',
        ].filter(Boolean).join(' ');
        colsHTML += `<div class="${colClass} placement-col--tile" data-col="${col}"${colStyle}>${tileHTML(column, { classExtra, isNew: state.newTileCols?.has(col) })}</div>`;
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
    const dragging = state.draggingDieId === id;
    const sel = state.selectedDieId === id && !dragging;
    el.classList.toggle('die--drag-source', dragging);
    if (el.classList.contains('die--action')) {
      el.classList.toggle('die--action-selected', sel);
    }
    if (el.classList.contains('die--placed')) {
      el.classList.toggle('die--placed-selected', sel);
    }
  });

  inner.querySelectorAll('.placement-col--tile .placement-tile--returnable').forEach(el => {
    const col = Number(el.closest('.placement-col')?.dataset.col);
    const sel = state.selectedDealtTile && isPlacedDealtTileCol(col);
    el.classList.toggle('placement-tile--selected', sel);
  });

  const occupied = getOccupiedCols();
  const hasSelection = state.selectedDieId != null || state.selectedDealtTile;
  const showEdgeGhosts = !settings.directPlacement
    && occupied.length > 0
    && hasSelection
    && state.phase !== 'animating';
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

  if (settings.directPlacement) {
    inner.querySelector('.placement-hints')?.remove();
    return;
  }

  const old = inner.querySelector('.placement-hints');
  const noSelection = state.selectedDieId == null && !state.selectedDealtTile;
  if (noSelection || state.phase === 'animating') {
    old?.remove();
    return;
  }

  const slots = state.selectedDealtTile
    ? getValidSlotsForDealtTile()
    : getValidSlotsForDie(state.selectedDieId);
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

/** Hide stars involving the die being repositioned (still in state until drop). */
function visibleStarMatches() {
  const matches = findStarMatches();
  const dragId = state.draggingDieId;
  if (dragId == null || state.actionBar.includes(dragId)) return matches;

  return matches.filter(m => {
    if (m.axis === 'v') {
      const topId = dieIdAt(m.col, m.row);
      const bottomId = dieIdAt(m.col, m.row + 1);
      return topId !== dragId && bottomId !== dragId;
    }
    const leftId = dieIdAt(m.leftCol, m.row);
    const rightId = dieIdAt(m.rightCol, m.row);
    return leftId !== dragId && rightId !== dragId;
  });
}

/** Live ⭐ preview between adjacent matching dice while placing. */
export function positionStarMarkers() {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return;

  const old = inner.querySelector('.placement-stars');
  if (state.phase === 'replay') {
    old?.remove();
    return;
  }

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();
  const visible = visibleStarMatches();

  if (!visible.length) {
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

  const existing = new Map();
  for (const el of layer.querySelectorAll('.placement-star')) {
    if (el.dataset.starKey) existing.set(el.dataset.starKey, el);
  }
  const keep = new Set();

  for (const match of visible) {
    const key = starMatchKey(match);
    keep.add(key);
    const center = starMatchMarkerCenter(match, inner, innerRect, scale);
    if (!center) continue;

    let el = existing.get(key);
    if (!el) {
      el = document.createElement('span');
      el.className = 'placement-star';
      el.dataset.starKey = key;
      el.innerHTML = starSVG(STAR_MARKER_PX);
      layer.appendChild(el);
    }

    el.style.left = `${center.x}px`;
    el.style.top = `${center.y}px`;
    el.style.transition = '';
    el.style.transform = 'translate(-50%, -50%)';
  }

  for (const [key, el] of existing) {
    if (!keep.has(key)) el.remove();
  }
}

let starMotionRaf = 0;
let starMotionDeadline = 0;

/** rAF loop — stars track live die layout while columns transform-animate. */
export function syncStarMarkersDuringMotion(extraMs = 0) {
  starMotionDeadline = Math.max(starMotionDeadline, performance.now() + spd(COL_SPREAD_MS) + extraMs);
  if (starMotionRaf) return;

  const tick = now => {
    positionStarMarkers();
    if (now < starMotionDeadline) {
      starMotionRaf = requestAnimationFrame(tick);
    } else {
      starMotionRaf = 0;
      positionStarMarkers();
    }
  };
  starMotionRaf = requestAnimationFrame(tick);
}

/** Screen rects for star-collect pip launch (post-convert confirm). */
export function getStarMatchRects(matches) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner || !matches.length) return [];

  const innerRect = inner.getBoundingClientRect();
  const scale = viewportScale();
  const rects = [];

  for (const match of matches) {
    const center = starMatchMarkerCenter(match, inner, innerRect, scale);
    if (!center) continue;

    const cx = innerRect.left + center.x * scale;
    const cy = innerRect.top + center.y * scale;
    const size = STAR_MARKER_PX * scale;
    rects.push(new DOMRect(cx - size / 2, cy - size / 2, size, size));
  }
  return rects;
}

function columnCenterX(colNode) {
  const r = colNode.getBoundingClientRect();
  return (r.left + r.right) / 2;
}

/** Insert slot for x between two occupied columns (midpoint partition). */
function insertSlotBetween(inner, occupied, clientX, clientY) {
  if (occupied.length < 2) return null;

  const firstCol = colElement(inner, occupied[0]);
  const lastCol = colElement(inner, occupied[occupied.length - 1]);
  if (!firstCol || !lastCol) return null;

  const firstRect = firstCol.getBoundingClientRect();
  const lastRect = lastCol.getBoundingClientRect();
  if (clientX < firstRect.left || clientX > lastRect.right) return null;

  const centers = occupied.map(col => columnCenterX(colElement(inner, col)));

  for (let i = 0; i < occupied.length - 1; i++) {
    const leftBound = i === 0 ? firstRect.left : (centers[i - 1] + centers[i]) / 2;
    const rightBound = i === occupied.length - 2
      ? lastRect.right
      : (centers[i] + centers[i + 1]) / 2;
    if (clientX < leftBound || clientX > rightBound) continue;

    const leftNode = colElement(inner, occupied[i]);
    const rightNode = colElement(inner, occupied[i + 1]);
    const insertMinY = Math.max(columnInsertMinY(leftNode), columnInsertMinY(rightNode));
    if (clientY < insertMinY) continue;

    return { kind: 'insert', leftCol: occupied[i], rightCol: occupied[i + 1] };
  }

  return null;
}

/** Screen Y of the shared bottom die row — inserts only at or below this line. */
function columnInsertMinY(colNode) {
  if (!colNode) return Infinity;
  const bottomDie = bottomDieInCol(colNode);
  if (bottomDie) return bottomDie.getBoundingClientRect().top;
  const tile = colNode.querySelector('.placement-tile');
  if (tile) {
    const r = tile.getBoundingClientRect();
    return r.bottom - DIE_OUTER * viewportScale();
  }
  return colNode.getBoundingClientRect().bottom;
}

function stackableColumnAtCol(col) {
  const column = getColumn(col);
  return column?.kind === 'stack' && column.dice.length < 3 ? column : null;
}

/** Stack slot when pointer/flyer targets the stack band (incl. dropping onto a placed die). */
function stackSlotAtPointer(inner, occupied, clientX, clientY, stackY) {
  const dieH = DIE_OUTER * viewportScale();

  for (const col of occupied) {
    if (!stackableColumnAtCol(col)) continue;
    const colNode = colElement(inner, col);
    if (!colNode) continue;
    const colRect = colNode.getBoundingClientRect();
    if (clientX < colRect.left || clientX > colRect.right) continue;

    const topDie = topDieInCol(colNode);
    const bottomDie = bottomDieInCol(colNode);
    if (!topDie || !bottomDie) continue;

    const topRect = topDie.getBoundingClientRect();
    const bottomRect = bottomDie.getBoundingClientRect();
    const pointerOnStack =
      clientY >= topRect.top && clientY <= bottomRect.bottom;
    const flyerAboveStack = stackY <= topRect.top + 2;
    const slotAboveStack =
      clientY >= topRect.top - dieH && clientY < topRect.top;

    if (pointerOnStack || flyerAboveStack || slotAboveStack) {
      return { kind: 'stack', col };
    }
  }
  return null;
}

/** Drag flyer sits above the row — peek through it for a stack target die. */
function stackSlotThroughFlyer(clientX, clientY, inner, occupied) {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const die = el.closest?.('.die--placed');
    if (!die || !inner.contains(die)) continue;
    const col = Number(die.dataset.col);
    if (!occupied.includes(col) || !stackableColumnAtCol(col)) continue;
    return { kind: 'stack', col };
  }
  return null;
}

/** Insert slots only (gap + row edges) — for hover spread preview. */
export function resolveInsertSlotFromPointer(clientX, clientY) {
  const rowEl = document.getElementById('placement-row');
  if (!rowEl) return null;

  const rowRect = rowEl.getBoundingClientRect();
  if (
    clientX < rowRect.left || clientX > rowRect.right
    || clientY < rowRect.top || clientY > rowRect.bottom
  ) {
    return null;
  }

  const occupied = getOccupiedCols();
  if (occupied.length === 0) return null;

  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return null;

  const firstCol = colElement(inner, occupied[0]);
  const lastCol = colElement(inner, occupied[occupied.length - 1]);
  if (!firstCol || !lastCol) return null;

  const firstRect = firstCol.getBoundingClientRect();
  const lastRect = lastCol.getBoundingClientRect();

  if (clientX < firstRect.left) {
    if (clientY >= columnInsertMinY(firstCol)) {
      return { kind: 'insert', leftCol: null, rightCol: occupied[0] };
    }
    return null;
  }
  if (clientX > lastRect.right) {
    if (clientY >= columnInsertMinY(lastCol)) {
      return { kind: 'insert', leftCol: occupied[occupied.length - 1], rightCol: null };
    }
    return null;
  }

  return insertSlotBetween(inner, occupied, clientX, clientY);
}

/** Map pointer coordinates to an intended placement slot (direct-placement mode). */
export function isPointerOnPlacementRow(clientX, clientY) {
  const rowEl = document.getElementById('placement-row');
  if (!rowEl) return false;
  const rowRect = rowEl.getBoundingClientRect();
  return clientX >= rowRect.left && clientX <= rowRect.right
    && clientY >= rowRect.top && clientY <= rowRect.bottom;
}

/** Map pointer coordinates to an intended placement slot (direct-placement mode). */
export function resolveSlotFromPointer(clientX, clientY, stackY = clientY, { allowStack = true } = {}) {
  if (!isPointerOnPlacementRow(clientX, clientY)) return null;

  const occupied = getOccupiedCols();
  if (occupied.length === 0) {
    return { kind: 'new-column', col: CENTER_COL };
  }

  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return null;

  const insert = resolveInsertSlotFromPointer(clientX, clientY);
  if (insert) return insert;

  if (!allowStack) return null;

  const stack = stackSlotAtPointer(inner, occupied, clientX, clientY, stackY)
    ?? stackSlotThroughFlyer(clientX, clientY, inner, occupied);
  if (stack) return stack;

  return null;
}
