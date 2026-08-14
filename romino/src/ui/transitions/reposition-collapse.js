import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { findDieColumn, getColumn, isPushBelowPlacedDie } from '../../logic/row.js';
import { DIE_OUTER } from '../../logic/dice-visual.js';
import { pinRowScroll, restorePinnedRowScroll, unpinRowScroll, syncStarMarkersDuringMotion } from '../display/placement-row.js';
import { syncDominoSpotStripDuringMotion, setDominoSpotStackDragSuppressed } from '../display/domino-spot-strip.js';
import { COL_SPREAD_MS } from './timing.js';

const EASING = 'ease-out';

/** @type {number | null} */
let vacatedSourceCol = null;

/** @type {number | null} */
let dragSuppressedSpotCol = null;

/** @type {HTMLElement[]} */
let shiftedPushReturnDice = [];

function stackStepPx() {
  const border = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-border')) || 4;
  return DIE_OUTER - border;
}

function clearDragSuppressedSpot() {
  if (dragSuppressedSpotCol == null) return;
  setDominoSpotStackDragSuppressed(dragSuppressedSpotCol, false);
  dragSuppressedSpotCol = null;
}

function colEl(inner, col) {
  return inner.querySelector(`.placement-col[data-col="${col}"]`);
}

function collapseMs() {
  return spd(COL_SPREAD_MS);
}

function captureColLeft() {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return new Map();
  const map = new Map();
  for (const el of inner.querySelectorAll('.placement-col[data-col]')) {
    const col = Number(el.dataset.col);
    if (!Number.isNaN(col)) map.set(col, el.offsetLeft);
  }
  return map;
}

/** FLIP slide after flex reflow — keeps motion smooth while scroll pin holds the viewport centre. */
function runFlip(beforeLeft, animate) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return;

  const ms = animate ? collapseMs() : 0;
  const movers = [];

  for (const el of inner.querySelectorAll('.placement-col[data-col]')) {
    const col = Number(el.dataset.col);
    const oldLeft = beforeLeft.get(col);
    if (oldLeft == null) continue;
    const dx = oldLeft - el.offsetLeft;
    if (Math.abs(dx) < 0.5) continue;
    movers.push({ el, dx });
  }

  if (!movers.length) return;

  for (const { el, dx } of movers) {
    el.classList.add('placement-col--reposition-collapsing');
    el.style.transition = 'none';
    el.style.transform = `translate3d(${dx}px, 0, 0)`;
  }
  inner.offsetHeight;

  const transition = ms ? `transform ${ms}ms ${EASING}` : 'none';
  for (const { el } of movers) {
    el.style.transition = transition;
    el.style.transform = '';
  }

  const cleanup = () => {
    for (const { el } of movers) {
      el.classList.remove('placement-col--reposition-collapsing');
      el.style.transition = '';
      el.style.transform = '';
    }
  };

  if (ms) {
    syncStarMarkersDuringMotion();
    syncDominoSpotStripDuringMotion();
    setTimeout(cleanup, ms);
  } else {
    cleanup();
    syncStarMarkersDuringMotion();
    syncDominoSpotStripDuringMotion();
  }
}

function soleSourceCol(dieId) {
  if (state.actionBar.includes(dieId)) return null;

  const loc = findDieColumn(dieId);
  if (!loc) return null;

  const column = getColumn(loc.col);
  if (column?.kind !== 'stack' || column.dice.length !== 1) return null;

  return loc.col;
}

export function isRepositionCollapseActive() {
  return vacatedSourceCol != null;
}

/** Remove sole source column from flex flow; pin scroll so the row stays centred. */
export function beginRepositionCollapse(dieId) {
  const sourceCol = soleSourceCol(dieId);
  if (sourceCol != null) beginColumnRepositionCollapse(sourceCol);
}

/** Remove a sole stack or dealt-tile column from flex flow; pin scroll so the row stays centred. */
export function beginColumnRepositionCollapse(sourceCol) {
  clearRepositionCollapse(false);

  const inner = document.querySelector('.placement-row-inner');
  const src = colEl(inner, sourceCol);
  if (!src) return;

  vacatedSourceCol = sourceCol;
  pinRowScroll();

  const beforeLeft = captureColLeft();
  src.style.left = `${src.offsetLeft}px`;
  src.classList.add('placement-col--reposition-vacated');

  restorePinnedRowScroll();
  runFlip(beforeLeft, false);

  if (setDominoSpotStackDragSuppressed(sourceCol, true)) {
    dragSuppressedSpotCol = sourceCol;
  }
}

/** Shift upper dice down one stack step; bottom die stays in flex (hidden) so row baseline holds. */
export function beginPushReturnCollapse(dieId) {
  if (!isPushBelowPlacedDie(dieId)) return;

  const loc = findDieColumn(dieId);
  if (!loc || loc.column.dice.length < 2 || loc.column.dice[0] !== dieId) return;

  clearPushReturnCollapse();

  const inner = document.querySelector('.placement-row-inner');
  const colNode = colEl(inner, loc.col);
  if (!colNode) return;

  const step = stackStepPx();
  const remaining = [...colNode.querySelectorAll('.die--placed')]
    .filter(el => Number(el.dataset.dieId) !== dieId);

  if (!remaining.length) return;

  shiftedPushReturnDice = remaining;
  for (const el of remaining) {
    el.classList.add('die--stack-shifted');
    el.style.transition = 'none';
    el.style.transform = `translateY(${step}px)`;
  }

  syncStarMarkersDuringMotion();
  syncDominoSpotStripDuringMotion();
}

/** Drop internal state only — next `render()` rebuilds the row (no die snap). */
export function resetPushReturnCollapse() {
  shiftedPushReturnDice = [];
}

/** Restore shifted dice after cancel drag. */
export function clearPushReturnCollapse() {
  if (!shiftedPushReturnDice.length) return;

  for (const el of shiftedPushReturnDice) {
    el.classList.remove('die--stack-shifted');
    el.style.transition = '';
    el.style.transform = '';
  }
  shiftedPushReturnDice = [];

  syncStarMarkersDuringMotion();
  syncDominoSpotStripDuringMotion();
}

/** Drop internal state only — next `render()` rebuilds the row (no column snap). */
export function resetRepositionCollapse() {
  vacatedSourceCol = null;
  resetPushReturnCollapse();
  clearDragSuppressedSpot();
  unpinRowScroll();
}

/** Restore flex layout after cancel drag (DOM reflow). */
export function clearRepositionCollapse(animate = true) {
  if (vacatedSourceCol == null) return;

  const inner = document.querySelector('.placement-row-inner');
  const src = colEl(inner, vacatedSourceCol);
  const beforeLeft = captureColLeft();

  if (src) {
    src.classList.remove('placement-col--reposition-vacated');
    src.style.left = '';
  }

  vacatedSourceCol = null;

  restorePinnedRowScroll();
  runFlip(beforeLeft, animate);
  unpinRowScroll();
  clearDragSuppressedSpot();
}
