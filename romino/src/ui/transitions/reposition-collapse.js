import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { findDieColumn, getColumn } from '../../logic/row.js';
import { pinRowScroll, restorePinnedRowScroll, unpinRowScroll, syncStarMarkersDuringMotion } from '../display/placement-row.js';
import { COL_SPREAD_MS } from './timing.js';

const EASING = 'ease-out';

/** @type {number | null} */
let vacatedSourceCol = null;

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
    setTimeout(cleanup, ms);
  } else {
    cleanup();
    syncStarMarkersDuringMotion();
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
  clearRepositionCollapse(false);

  const sourceCol = soleSourceCol(dieId);
  if (sourceCol == null) return;

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
}

/** Drop internal state only — next `render()` rebuilds the row (no column snap). */
export function resetRepositionCollapse() {
  vacatedSourceCol = null;
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
}
