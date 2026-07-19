import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { placeDie, getValidSlotsForDie, slotsEqual } from '../../logic/row.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { pinRowScroll, unpinRowScroll } from '../display/placement-row.js';
import { COL_SPREAD_MS, COL_DIE_IN_MS } from './timing.js';

const SPREAD_EASING = 'ease-out';
/** Fast departure, pronounced deceleration into the gap. */
const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';

const gapH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-gap-h')) || 6;
const colW = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col-width')) || 48;
/** Horizontal space a new column consumes in the flex row (margin + die + margin). */
const openWidth = () => colW() + gapH();

function viewportScale() {
  const root = document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function toDesignPx(screenPx, scale) {
  return screenPx / scale;
}

function colEl(inner, col) {
  return inner.querySelector(`.placement-col[data-col="${col}"]`);
}

function dieBorder() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-border')) || 4;
}

/** Top die in a stack — matches placement-row hint anchoring. */
function topDieInCol(colNode) {
  const dice = colNode.querySelectorAll('.die--placed');
  if (!dice.length) return null;
  return settings.stackBottomUp ? dice[dice.length - 1] : dice[0];
}

/** Column box in placement-row-inner design px (pre-spread layout). */
function colBoxInInner(el, innerRect, scale) {
  const r = el.getBoundingClientRect();
  return {
    left: el.offsetLeft,
    right: el.offsetLeft + el.offsetWidth,
    bottom: toDesignPx(r.bottom - innerRect.top, scale),
  };
}

/** Symmetric spread from gap centre — entire left block −half, entire right block +half. */
function computeSpreadOffsets(slot) {
  const offsets = new Map();
  if (slot.kind !== 'insert') return offsets;

  const half = openWidth() / 2;
  const occupied = Object.keys(state.row).map(Number).sort((a, b) => a - b);
  const { leftCol, rightCol } = slot;

  if (leftCol == null) {
    for (const col of occupied) offsets.set(col, half);
    return offsets;
  }

  if (rightCol == null) {
    for (const col of occupied) offsets.set(col, -half);
    return offsets;
  }

  for (const col of occupied) {
    if (col <= leftCol) offsets.set(col, -half);
    else if (col >= rightCol) offsets.set(col, half);
  }
  return offsets;
}

/** Final die landing in row-inner design px — from rest layout + full spread, not mid-animation rects. */
function dieFinalTargetXY(slot, inner, innerRect, scale) {
  const half = openWidth() / 2;
  const open = openWidth();

  if (slot.kind === 'new-column') {
    const ghost = inner.querySelector('.placement-col--ghost-first');
    if (!ghost) return null;
    const box = colBoxInInner(ghost, innerRect, scale);
    return {
      left: box.left + (ghost.offsetWidth - DIE_OUTER) / 2,
      top: box.bottom - DIE_OUTER,
    };
  }

  if (slot.kind === 'stack') {
    const colNode = colEl(inner, slot.col);
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

  if (slot.kind !== 'insert') return null;

  let cx;
  let bottom;

  if (slot.leftCol == null) {
    const el = colEl(inner, slot.rightCol);
    if (!el) return null;
    const box = colBoxInInner(el, innerRect, scale);
    cx = box.left + half - open / 2;
    bottom = box.bottom;
  } else if (slot.rightCol == null) {
    const el = colEl(inner, slot.leftCol);
    if (!el) return null;
    const box = colBoxInInner(el, innerRect, scale);
    cx = box.right + open / 2 - half;
    bottom = box.bottom;
  } else {
    const leftEl = colEl(inner, slot.leftCol);
    const rightEl = colEl(inner, slot.rightCol);
    if (!leftEl || !rightEl) return null;
    const l = colBoxInInner(leftEl, innerRect, scale);
    const r = colBoxInInner(rightEl, innerRect, scale);
    cx = (l.right - half + r.left + half) / 2;
    bottom = Math.max(l.bottom, r.bottom);
  }

  return {
    left: cx - DIE_OUTER / 2,
    top: bottom - DIE_OUTER,
  };
}

function clearSpreadStyles(entries) {
  for (const { el } of entries) {
    el.classList.remove('placement-col--spreading');
    el.style.transition = '';
    el.style.transform = '';
  }
}

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

/** Row-local target → viewport-inner design coords. */
function pointInFlyLayer(point, innerRect, layerRect, scale) {
  return {
    left: point.left + toDesignPx(innerRect.left - layerRect.left, scale),
    top: point.top + toDesignPx(innerRect.top - layerRect.top, scale),
  };
}

/** Tray die position in viewport-inner design coords. */
function flyStartXY(dieId, layerRect, scale) {
  const trayDie = document.querySelector(`.die--action[data-die-id="${dieId}"]`);
  if (!trayDie) return null;

  const trayR = trayDie.getBoundingClientRect();
  return {
    left: toDesignPx(trayR.left - layerRect.left, scale),
    top: toDesignPx(trayR.top - layerRect.top, scale),
  };
}

function animateDieFly(dieId, finalTarget, duration, onDone) {
  const layer = flyLayer();
  const inner = document.querySelector('.placement-row-inner');
  if (!layer || !inner || !finalTarget) {
    onDone();
    return;
  }

  const die = state.dice[dieId];
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const innerRect = inner.getBoundingClientRect();
  const start = flyStartXY(dieId, layerRect, scale);
  const end = pointInFlyLayer(finalTarget, innerRect, layerRect, scale);

  if (!start) {
    onDone();
    return;
  }

  const dx = end.left - start.left;
  const dy = end.top - start.top;
  const trayDie = document.querySelector(`.die--action[data-die-id="${dieId}"]`);

  const flyer = document.createElement('div');
  flyer.className = 'placement-die-flyer';
  flyer.innerHTML = dieSVG(die.value, DIE_OUTER);
  flyer.style.left = `${start.left}px`;
  flyer.style.top = `${start.top}px`;
  flyer.style.transform = 'translate(0, 0)';
  layer.appendChild(flyer);
  if (trayDie) trayDie.style.visibility = 'hidden';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.transition = `transform ${duration}ms ${FLY_EASING}`;
      flyer.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  });

  setTimeout(() => {
    flyer.remove();
    onDone();
  }, duration);
}

function runSpreadThenFly(dieId, slot, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) {
    if (placeDie(dieId, slot)) render();
    onDone();
    return;
  }

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();
  const finalTarget = dieFinalTargetXY(slot, inner, innerRect, scale);

  const offsets = computeSpreadOffsets(slot);
  const spreadMs = spd(COL_SPREAD_MS);
  const flyMs = spd(COL_DIE_IN_MS);
  const spreadEls = [];

  for (const [col, dx] of offsets) {
    const el = colEl(inner, col);
    if (el) spreadEls.push({ el, dx });
  }

  const flyIn = () => {
    animateDieFly(dieId, finalTarget, flyMs, () => {
      placeDie(dieId, slot);
      clearSpreadStyles(spreadEls);
      onDone();
    });
  };

  if (!spreadEls.length) {
    flyIn();
    return;
  }

  for (const { el } of spreadEls) {
    el.classList.add('placement-col--spreading');
    el.style.transition = 'none';
    el.style.transform = 'translate3d(0, 0, 0)';
  }
  inner.offsetHeight;

  for (const { el, dx } of spreadEls) {
    el.style.transition = `transform ${spreadMs}ms ${SPREAD_EASING}`;
    el.style.transform = `translate3d(${dx}px, 0, 0)`;
  }

  setTimeout(flyIn, spreadMs / 4);
}

/** Place from the bar: columns spread (gap inserts), then die flies to the slot. */
export function placeDieWithAnim(dieId, slot) {
  const fromBar = state.actionBar.includes(dieId);
  if (!fromBar) {
    const ok = placeDie(dieId, slot);
    if (ok) render();
    return ok;
  }

  const valid = getValidSlotsForDie(dieId);
  if (!valid.some(s => slotsEqual(s, slot))) return false;

  pinRowScroll();
  state.phase = 'animating';
  runSpreadThenFly(dieId, slot, () => {
    state.phase = 'rolled';
    render();
    requestAnimationFrame(() => unpinRowScroll());
  });
  return true;
}
