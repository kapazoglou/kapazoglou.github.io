import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { findStarMatches } from '../../logic/stars.js';
import { dieSVG, hintTriangleSVG, DIE_OUTER, dieFaceBorderColor, starSVG, tileHTML, cubeTileHTML, isSwitcherTricolorStack, sweepDuplicateMarkHTML } from '../../logic/dice-visual.js';
import { sessionSweepDuplicateNumber, stackConvertSweepDuplicateNumber } from '../../logic/suit-tally.js';
import { flankStackColHTML, flankStackColElement } from './flank-stacks.js';
import { COL_SPREAD_MS } from '../transitions/timing.js';
import { pushBelowEnabled, getStarPowerCostReminderMatches } from '../../logic/star-powers.js';
import {
  getOccupiedCols, getValidSlotsForDie,
  isPlacedThisTurn, isTopDieInStack, isReturnablePlacedDie, isSwapRefundableDie, getColumn, CENTER_COL, dieIdAt,
  slotsEqual, stackHeight, spreadContextForDie,
} from '../../logic/row.js';

function stackHTML(col, column) {
  return column.dice.map((dieId, i) => {
    const die = state.dice[dieId];
    const sel = state.selectedDieId === dieId && state.draggingDieId !== dieId;
    const ret = isReturnablePlacedDie(dieId);
    const swapRef = isSwapRefundableDie(dieId);
    const dragging = state.draggingDieId === dieId;
    const z = i + 1;
    const style = ret
      ? `--stack-z:${z};--die-border-fill:${dieFaceBorderColor(die.value)}`
      : `--stack-z:${z}`;
    return `<div class="die die--placed${sel ? ' die--placed-selected' : ''}${ret ? ' die--returnable' : ''}${swapRef ? ' die--swap-refundable' : ''}${dragging ? ' die--drag-source' : ''}" data-die-id="${dieId}" data-col="${col}" style="${style}">${dieSVG(die.value, DIE_OUTER)}</div>`;
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
  if (dice.length) {
    return settings.stackBottomUp ? dice[0] : dice[dice.length - 1];
  }
  return colNode.querySelector('.placement-tile-cube .suit-die');
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
    const suitDie = colNode.querySelector('.placement-tile-cube .suit-die');
    if (suitDie) {
      const rect = suitDie.getBoundingClientRect();
      return {
        x: (rect.left + rect.right) / 2,
        y: (rect.top + rect.bottom) / 2,
      };
    }
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
    && state.selectedDieId != null
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
        const pairExit = state.pairSweepExit;
        if (pairExit?.rowCol === col) {
          if (pairExit.phase === 'wait') colClass += ' placement-col--sweep-pending';
          else if (pairExit.phase === 'run') {
            colClass += ' placement-col--sweep';
            colStyle = ' style="--exit-order:0"';
          }
        }
        const classExtra = [
          state.rowTileWarningCols.has(col) ? 'placement-tile--duplicate-warning' : '',
        ].filter(Boolean).join(' ');
        const suitFlown = Boolean(se?.suitFlownCols?.has(col));
        const sweepDupCopy = settings.sweptSuits
          ? sessionSweepDuplicateNumber(column.suit, column.rank)
          : 0;
        const tileColClass = settings.diceAndCubes
          ? `${colClass} placement-col--tile placement-col--tile-cube`
          : `${colClass} placement-col--tile`;
        const tileMarkup = settings.diceAndCubes
          ? cubeTileHTML(column, { classExtra, isNew: state.newTileCols?.has(col), suitFlown, sweepDuplicateCopy: sweepDupCopy })
          : tileHTML(column, { classExtra, isNew: state.newTileCols?.has(col), sweepDuplicateCopy: sweepDupCopy });
        colsHTML += `<div class="${tileColClass}" data-col="${col}"${colStyle}>${tileMarkup}</div>`;
      } else {
        const converting = state.convertingCol === col;
        const stackValues = column.dice.map(id => state.dice[id].value);
        const switcherConverting = converting && column.dice.length === 3
          && isSwitcherTricolorStack(stackValues);
        const stackDragging = state.draggingDieId != null
          && column.dice.includes(state.draggingDieId);
        const stackDupCopy = settings.sweptSuits && column.dice.length === 3 && !stackDragging
          ? stackConvertSweepDuplicateNumber(stackValues)
          : 0;
        const stackDupMarkHTML = sweepDuplicateMarkHTML(stackDupCopy);
        const sweepDupColClass = stackDupCopy >= 1 ? ' placement-col--sweep-dup-mark' : '';
        const pairClass = column.dice.length === 2 ? ' placement-col--stack-pair' : '';
        const dirClass = settings.stackBottomUp ? ' placement-col--stack-bottom-up' : '';
        colsHTML += `<div class="${colClass} placement-col--stack${pairClass}${dirClass}${sweepDupColClass}${converting ? ' is-converting' : ''}${converting && settings.diceAndCubes && !switcherConverting ? ' is-cube-converting' : ''}${switcherConverting ? ' is-switcher-converting' : ''}" data-col="${col}"${colStyle}>${stackDupMarkHTML}${stackHTML(col, column)}</div>`;
      }
    }
  }

  const edgeGhosts = showEdgeGhosts ? edgeGhostsMarkup() : '';
  const leftFlank = flankStackColHTML('left');
  const rightFlank = flankStackColHTML('right');

  el.innerHTML = `<div class="placement-row-inner${sweepRun ? ' is-sweep-run' : ''}">${leftFlank}${colsHTML}${rightFlank}${edgeGhosts}</div>`;
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

/** True when el is the visually bottom die in its column. */
export function isVisualBottomDie(el) {
  if (!el?.classList?.contains('die--placed')) return false;
  const col = Number(el.dataset.col);
  if (Number.isNaN(col)) return false;
  const inner = document.querySelector('.placement-row-inner');
  const colNode = inner ? colElement(inner, col) : null;
  if (!colNode) return false;
  return bottomDieInCol(colNode) === el;
}

function updatePushBelowTargets(inner) {
  inner.querySelectorAll('.die--push-below-target').forEach(el => {
    el.classList.remove('die--push-below-target');
  });
  if (!pushBelowEnabled() || state.phase !== 'rolled') return;

  const dieId = state.draggingDieId ?? state.selectedDieId;
  if (dieId == null) return;
  if (!state.actionBar.includes(dieId) && !state.placedDieIds.has(dieId)) return;

  const valid = getValidSlotsForDie(dieId);
  for (const slot of valid) {
    if (slot.kind !== 'stack-below') continue;
    const colNode = colElement(inner, slot.col);
    const bottom = colNode ? bottomDieInCol(colNode) : null;
    bottom?.classList.add('die--push-below-target');
  }
}

/** Accent valid bottom dice for push-from-below (selection or drag). */
export function syncPushBelowTargets() {
  const inner = document.querySelector('.placement-row-inner');
  if (inner) updatePushBelowTargets(inner);
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

  const occupied = getOccupiedCols();
  const hasSelection = state.selectedDieId != null;
  const showEdgeGhosts = !settings.directPlacement
    && occupied.length > 0
    && hasSelection
    && state.phase !== 'animating';
  const layer = inner.querySelector('.placement-edge-ghosts');

  if (!showEdgeGhosts) {
    layer?.remove();
    updatePushBelowTargets(inner);
    return;
  }

  if (!layer) inner.insertAdjacentHTML('beforeend', edgeGhostsMarkup());
  updatePushBelowTargets(inner);
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
  const noSelection = state.selectedDieId == null;
  if (noSelection || state.phase === 'animating') {
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
    const belowHint = slot.kind === 'stack-below';
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
    } else if (belowHint) {
      btn.dataset.col = String(slot.col);
      btn.dataset.kind = slot.kind;
      const colNode = colElement(inner, slot.col);
      if (!colNode) continue;
      const bottomDie = bottomDieInCol(colNode);
      if (!bottomDie) continue;
      const bottomRect = bottomDie.getBoundingClientRect();
      btn.style.left = `${toDesignPx(bottomRect.left - innerRect.left, scale) + (toDesignPx(bottomRect.width, scale) - DIE_OUTER) / 2}px`;
      btn.style.top = `${toDesignPx(bottomRect.bottom - innerRect.top, scale) - TIP_UP_Y}px`;
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

/** Hide stars adjacent to the snapping ghost preview die. */
function starAdjacentToSnapGhost(match, slot) {
  if (!slot) return false;

  if (slot.kind === 'insert') {
    if (match.axis !== 'h' || match.row !== 0) return false;
    if (slot.leftCol != null && slot.rightCol != null) {
      return match.leftCol === slot.leftCol && match.rightCol === slot.rightCol;
    }
    if (slot.leftCol == null && slot.rightCol != null) {
      return match.rightCol === slot.rightCol;
    }
    if (slot.rightCol == null && slot.leftCol != null) {
      return match.leftCol === slot.leftCol;
    }
    return false;
  }

  if (slot.kind === 'stack' || slot.kind === 'stack-below') {
    const row = stackHeight(slot.col);
    if (match.axis === 'h') {
      return match.row === row && (match.leftCol === slot.col || match.rightCol === slot.col);
    }
    if (match.axis === 'v') {
      return match.col === slot.col && match.row === row - 1;
    }
  }

  return false;
}

/** Hide stars involving the die being repositioned (still in state until drop). */
function visibleStarMatches() {
  const matchMap = new Map();
  for (const match of findStarMatches()) {
    matchMap.set(starMatchKey(match), match);
  }
  for (const match of getStarPowerCostReminderMatches()) {
    matchMap.set(starMatchKey(match), match);
  }
  let visible = [...matchMap.values()];
  const dragId = state.draggingDieId;
  const snapSlot = state.snapGhostSlot;

  if (dragId != null && !state.actionBar.includes(dragId)) {
    visible = visible.filter(m => {
      if (m.costReminder) return true;
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

  if (snapSlot) {
    visible = visible.filter(m => m.costReminder || !starAdjacentToSnapGhost(m, snapSlot));
  }

  return visible;
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

/** Push-from-below zone: lower part of bottom die + strip below the stack. */
function pushBelowZoneAtCol(colNode, clientX, clientY) {
  const colRect = colNode.getBoundingClientRect();
  if (clientX < colRect.left || clientX > colRect.right) return false;
  const bottomDie = bottomDieInCol(colNode);
  if (!bottomDie) return false;
  const dieH = DIE_OUTER * viewportScale();
  const br = bottomDie.getBoundingClientRect();
  const zoneTop = br.top + br.height * 0.4;
  return clientY >= zoneTop && clientY <= br.bottom + dieH * 2;
}

function resolvePushBelowSlotFromPointer(clientX, clientY, validSlots) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return null;
  for (const slot of validSlots) {
    if (slot.kind !== 'stack-below') continue;
    const colNode = colElement(inner, slot.col);
    if (!colNode) continue;
    if (pushBelowZoneAtCol(colNode, clientX, clientY)) return slot;
  }
  return null;
}

/** Stack slot when pointer/flyer targets the stack band (incl. dropping onto a placed die). */
function stackSlotAtPointer(inner, occupied, clientX, clientY, stackY, validSlots = []) {
  const dieH = DIE_OUTER * viewportScale();
  const slotOk = slot => validSlots.some(s => slotsEqual(s, slot));

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
    const belowSlot = { kind: 'stack-below', col };
    const topSlot = { kind: 'stack', col };

    if (pushBelowZoneAtCol(colNode, clientX, clientY) && slotOk(belowSlot)) {
      return belowSlot;
    }

    const pointerOnStack =
      clientY >= topRect.top && clientY < bottomRect.top + bottomRect.height * 0.4;
    const flyerAboveStack = stackY <= topRect.top + 2;
    const slotAboveStack =
      clientY >= topRect.top - dieH && clientY < topRect.top;

    if (pointerOnStack || flyerAboveStack || slotAboveStack) {
      if (slotOk(topSlot)) return topSlot;
      if (slotOk(belowSlot)) return belowSlot;
    }
  }
  return null;
}

/** Drag flyer sits above the row — peek through it for a stack target die. */
function stackSlotThroughFlyer(clientX, clientY, inner, occupied, validSlots = []) {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const die = el.closest?.('.die--placed');
    if (!die || !inner.contains(die)) continue;
    const col = Number(die.dataset.col);
    if (!occupied.includes(col) || !stackableColumnAtCol(col)) continue;
    const colNode = colElement(inner, col);
    const topSlot = { kind: 'stack', col };
    const belowSlot = { kind: 'stack-below', col };
    const belowOk = validSlots.some(s => slotsEqual(s, belowSlot));
    const topOk = validSlots.some(s => slotsEqual(s, topSlot));
    if (belowOk && colNode && pushBelowZoneAtCol(colNode, clientX, clientY)) return belowSlot;
    if (topOk) return topSlot;
    if (belowOk) return belowSlot;
    return null;
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
    const leftFlank = settings.deckFlank ? flankStackColElement(inner, 'left') : null;
    const insertMinY = leftFlank
      ? Math.max(columnInsertMinY(firstCol), columnInsertMinY(leftFlank))
      : columnInsertMinY(firstCol);
    if (clientY >= insertMinY) {
      return { kind: 'insert', leftCol: null, rightCol: occupied[0] };
    }
    return null;
  }
  if (clientX > lastRect.right) {
    const rightFlank = settings.deckFlank ? flankStackColElement(inner, 'right') : null;
    const insertMinY = rightFlank
      ? Math.max(columnInsertMinY(lastCol), columnInsertMinY(rightFlank))
      : columnInsertMinY(lastCol);
    if (clientY >= insertMinY) {
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
export function resolveSlotFromPointer(
  clientX,
  clientY,
  stackY = clientY,
  { allowStack = true, validSlots = null, dieId = null } = {},
) {
  if (!isPointerOnPlacementRow(clientX, clientY)) return null;

  const occupied = getOccupiedCols();
  if (occupied.length === 0) {
    return { kind: 'new-column', col: CENTER_COL };
  }

  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return null;

  const slots = validSlots ?? (dieId != null ? getValidSlotsForDie(dieId) : []);

  const pushBelow = resolvePushBelowSlotFromPointer(clientX, clientY, slots);
  if (pushBelow) return pushBelow;

  const insert = resolveInsertSlotFromPointer(clientX, clientY);
  if (insert && slots.some(s => slotsEqual(s, insert))) return insert;

  if (!allowStack) return null;

  const stack = stackSlotAtPointer(inner, occupied, clientX, clientY, stackY, slots)
    ?? stackSlotThroughFlyer(clientX, clientY, inner, occupied, slots);
  if (stack) return stack;

  return null;
}

function openWidth() {
  return COL_W() + GAP_H();
}

function dieBorder() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-border')) || 4;
}

function colBoxFromRect(el, innerRect, scale) {
  const r = el.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - innerRect.left, scale),
    right: toDesignPx(r.right - innerRect.left, scale),
    bottom: toDesignPx(r.bottom - innerRect.top, scale),
  };
}

/** Die landing in placement-row-inner design px (live layout incl. gap spread). */
export function slotAnchorRowXY(slot, dieId = null) {
  if (dieId != null && slot.kind === 'insert') {
    slot = spreadContextForDie(slot, dieId).slot;
  }

  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return null;

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();
  const open = openWidth();

  if (slot.kind === 'new-column') {
    const ghost = inner.querySelector('.placement-col--ghost-first');
    if (!ghost) return null;
    const box = colBoxFromRect(ghost, innerRect, scale);
    const ghostW = toDesignPx(ghost.getBoundingClientRect().width, scale);
    return {
      left: box.left + (ghostW - DIE_OUTER) / 2,
      top: box.bottom - DIE_OUTER,
    };
  }

  if (slot.kind === 'stack') {
    const colNode = colElement(inner, slot.col);
    if (!colNode) return null;
    const topDie = topDieInCol(colNode);
    if (!topDie) return null;
    const tr = topDie.getBoundingClientRect();
    const border = dieBorder();
    return {
      left: toDesignPx(tr.left - innerRect.left, scale),
      top: toDesignPx(tr.top - innerRect.top, scale) - DIE_OUTER + border,
    };
  }

  if (slot.kind === 'stack-below') {
    const colNode = colElement(inner, slot.col);
    if (!colNode) return null;
    const bottomDie = bottomDieInCol(colNode);
    if (!bottomDie) return null;
    const br = bottomDie.getBoundingClientRect();
    return {
      left: toDesignPx(br.left - innerRect.left, scale),
      top: toDesignPx(br.bottom - innerRect.top, scale),
    };
  }

  if (slot.kind !== 'insert') return null;

  let cx;
  let bottom;

  if (slot.leftCol == null) {
    const rightEl = colElement(inner, slot.rightCol);
    const leftFlankEl = settings.deckFlank ? flankStackColElement(inner, 'left') : null;
    if (leftFlankEl && rightEl) {
      const l = colBoxFromRect(leftFlankEl, innerRect, scale);
      const r = colBoxFromRect(rightEl, innerRect, scale);
      cx = (l.right + r.left) / 2;
      bottom = Math.max(l.bottom, r.bottom);
    } else if (rightEl) {
      const box = colBoxFromRect(rightEl, innerRect, scale);
      cx = box.left - open / 2;
      bottom = box.bottom;
    } else return null;
  } else if (slot.rightCol == null) {
    const leftEl = colElement(inner, slot.leftCol);
    const rightFlankEl = settings.deckFlank ? flankStackColElement(inner, 'right') : null;
    if (leftEl && rightFlankEl) {
      const l = colBoxFromRect(leftEl, innerRect, scale);
      const r = colBoxFromRect(rightFlankEl, innerRect, scale);
      cx = (l.right + r.left) / 2;
      bottom = Math.max(l.bottom, r.bottom);
    } else if (leftEl) {
      const box = colBoxFromRect(leftEl, innerRect, scale);
      cx = box.right + open / 2;
      bottom = box.bottom;
    } else return null;
  } else {
    const leftEl = colElement(inner, slot.leftCol);
    const rightEl = colElement(inner, slot.rightCol);
    if (!leftEl || !rightEl) return null;
    const l = colBoxFromRect(leftEl, innerRect, scale);
    const r = colBoxFromRect(rightEl, innerRect, scale);
    cx = (l.right + r.left) / 2;
    bottom = Math.max(l.bottom, r.bottom);
  }

  return {
    left: cx - DIE_OUTER / 2,
    top: bottom - DIE_OUTER,
  };
}

/** Die landing in viewport-inner design px — for drag flyer and snap ghost. */
export function slotAnchorXY(slot, dieId = null) {
  const rowPoint = slotAnchorRowXY(slot, dieId);
  if (!rowPoint) return null;

  const inner = document.querySelector('.placement-row-inner');
  const layer = document.querySelector('.viewport-inner');
  if (!inner || !layer) return null;

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();

  return {
    left: rowPoint.left + toDesignPx(innerRect.left - layerRect.left, scale),
    top: rowPoint.top + toDesignPx(innerRect.top - layerRect.top, scale),
  };
}

/** Screen-space top-left of die anchor (for nearest-slot distance). */
function slotAnchorScreenTopLeft(slot, dieId = null) {
  const rowPoint = slotAnchorRowXY(slot, dieId);
  if (!rowPoint) return null;

  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return null;

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();

  return {
    x: innerRect.left + rowPoint.left * scale,
    y: innerRect.top + rowPoint.top * scale,
  };
}

/** Drop stack-below when its snap anchor overlaps the top-stack anchor on the same column. */
function dedupeOverlappingStackSlots(validSlots, dieId) {
  const topByCol = new Map();
  for (const slot of validSlots) {
    if (slot.kind === 'stack') topByCol.set(slot.col, slot);
  }
  const scale = viewportScale();
  const threshold = DIE_OUTER * scale * 0.35;

  return validSlots.filter(slot => {
    if (slot.kind !== 'stack-below') return true;
    const topSlot = topByCol.get(slot.col);
    if (!topSlot) return true;
    const topAnchor = slotAnchorScreenTopLeft(topSlot, dieId);
    const belowAnchor = slotAnchorScreenTopLeft(slot, dieId);
    if (!topAnchor || !belowAnchor) return true;
    const dx = topAnchor.x - belowAnchor.x;
    const dy = topAnchor.y - belowAnchor.y;
    return dx * dx + dy * dy > threshold * threshold;
  });
}

/** Nearest valid slot for snap ghost — pointer hit first, else minimum screen distance. */
export function resolveNearestValidSlot(clientX, clientY, stackY, validSlots, dieId = null) {
  if (!validSlots.length) return null;

  const slots = dedupeOverlappingStackSlots(validSlots, dieId);
  const onRow = isPointerOnPlacementRow(clientX, clientY);

  if (onRow) {
    const pushBelow = resolvePushBelowSlotFromPointer(clientX, clientY, slots);
    if (pushBelow) return pushBelow;
  }

  const pointerSlot = resolveSlotFromPointer(clientX, clientY, stackY, {
    validSlots: slots,
    dieId,
  });
  if (pointerSlot && slots.some(s => slotsEqual(s, pointerSlot))) {
    return pointerSlot;
  }

  if (!onRow) return null;

  let best = null;
  let bestDist = Infinity;
  const refY = stackY ?? clientY;

  for (const slot of slots) {
    const anchor = slotAnchorScreenTopLeft(slot, dieId);
    if (!anchor) continue;
    const sampleY = slot.kind === 'stack-below' ? clientY : refY;
    const dx = clientX - (anchor.x + (DIE_OUTER * viewportScale()) / 2);
    const dy = sampleY - anchor.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = slot;
    }
  }

  return best;
}
