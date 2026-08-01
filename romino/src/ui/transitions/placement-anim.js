import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { placeDie, getValidSlotsForDie, slotsEqual, getOccupiedCols, gapInsertAnimationsAllowed, spreadContextForDie } from '../../logic/row.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { pinRowScroll, unpinRowScroll, syncStarMarkersDuringMotion, slotAnchorRowXY } from '../display/placement-row.js';
import { spreadColumnElement, flankStackColElement, FLANK_SPREAD_LEFT, FLANK_SPREAD_RIGHT } from '../display/flank-stacks.js';
import { flankStackTop } from '../../logic/deck-flank.js';
import { resetInsertHoverSpread, handoffInsertHoverSpread } from './placement-hover.js';
import { clearRepositionCollapse, resetRepositionCollapse } from './reposition-collapse.js';
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
  return spreadColumnElement(inner, col);
}

/** Column box in placement-row-inner design px (live layout incl. spread transform). */
function colBoxFromRect(el, innerRect, scale) {
  const r = el.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - innerRect.left, scale),
    right: toDesignPx(r.right - innerRect.left, scale),
    bottom: toDesignPx(r.bottom - innerRect.top, scale),
  };
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
export function computeSpreadOffsets(slot, dieId = null) {
  const offsets = new Map();
  if (slot.kind !== 'insert') return offsets;

  const { slot: effSlot, occupied, excludeCols } = spreadContextForDie(slot, dieId);
  const half = openWidth() / 2;
  const { leftCol, rightCol } = effSlot;

  if (leftCol == null) {
    for (const col of occupied) {
      if (!excludeCols.has(col)) offsets.set(col, half);
    }
    addFlankPushOffsets(offsets, effSlot, occupied);
    return offsets;
  }

  if (rightCol == null) {
    for (const col of occupied) {
      if (!excludeCols.has(col)) offsets.set(col, -half);
    }
    addFlankPushOffsets(offsets, effSlot, occupied);
    return offsets;
  }

  for (const col of occupied) {
    if (excludeCols.has(col)) continue;
    if (col <= leftCol) offsets.set(col, -half);
    else if (col >= rightCol) offsets.set(col, half);
  }

  addFlankPushOffsets(offsets, effSlot, occupied);
  return offsets;
}

/** Adjacent flank stacks follow edge column spread; row-edge inserts use opposite dx to open the gap. */
function addFlankPushOffsets(offsets, slot, occupied) {
  if (!settings.deckFlank || !occupied.length) return;

  const leftmost = occupied[0];
  const rightmost = occupied[occupied.length - 1];

  if (flankStackTop('left') && offsets.has(leftmost)) {
    const dx = offsets.get(leftmost);
    offsets.set(FLANK_SPREAD_LEFT, slot.leftCol == null ? -dx : dx);
  }
  if (flankStackTop('right') && offsets.has(rightmost)) {
    const dx = offsets.get(rightmost);
    offsets.set(FLANK_SPREAD_RIGHT, slot.rightCol == null ? -dx : dx);
  }
}

/** Row-edge insert — no spread when deckFlank OFF (columns stay put until render). */
function isRowEdgeInsert(slot) {
  if (slot.kind !== 'insert') return false;
  if (slot.leftCol != null && slot.rightCol != null) return false;
  if (settings.deckFlank) return false;
  return true;
}

/** Between-column gap insert. */
function isGapInsert(slot) {
  return slot.kind === 'insert' && slot.leftCol != null && slot.rightCol != null;
}

/** True when occupied column indices are not consecutive (insert gap exists). */
function hasIndexGapBetween(a, b) {
  return Math.abs(b - a) > 1;
}

/** Row-edge insert: columns separated from the new die by an index gap collapse after fly-in. */
function edgeInsertCollapseCols(slot) {
  if (slot.kind !== 'insert') return [];

  const occupied = getOccupiedCols();

  if (slot.leftCol == null && slot.rightCol != null) {
    const newCol = slot.rightCol - 1;
    return occupied.filter(col => hasIndexGapBetween(newCol, col));
  }

  if (slot.rightCol == null && slot.leftCol != null) {
    const newCol = slot.leftCol + 1;
    return occupied.filter(col => hasIndexGapBetween(col, newCol));
  }

  return [];
}

function animateSpreadCollapse(spreadEls, collapseCols, onDone) {
  const collapseSet = new Set(collapseCols);
  const ms = spd(COL_SPREAD_MS);
  let any = false;

  for (const entry of spreadEls) {
    if (!collapseSet.has(entry.col)) continue;
    entry.el.style.transition = `transform ${ms}ms ${SPREAD_EASING}`;
    entry.el.style.transform = 'translate3d(0, 0, 0)';
    any = true;
  }

  if (any) {
    syncStarMarkersDuringMotion();
    setTimeout(onDone, ms);
  } else onDone();
}

function clearSpreadStyles(entries) {
  for (const { el } of entries) {
    el.classList.remove('placement-col--spreading');
    el.style.transition = '';
    el.style.transform = '';
  }
}

function readColSpreadDx(el) {
  const m = el.style.transform.match(/translate3d\(([-\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
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

function animateDieFly(dieId, finalTarget, duration, onDone, existingFlyer = null, retainFlyer = false) {
  const layer = flyLayer();
  const inner = document.querySelector('.placement-row-inner');
  if (!layer || !inner || !finalTarget) {
    existingFlyer?.remove();
    onDone();
    return null;
  }

  const die = state.dice[dieId];
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const innerRect = inner.getBoundingClientRect();
  const end = pointInFlyLayer(finalTarget, innerRect, layerRect, scale);

  let start;
  let flyer = existingFlyer;

  if (flyer) {
    start = {
      left: parseFloat(flyer.style.left) || 0,
      top: parseFloat(flyer.style.top) || 0,
    };
    flyer.style.transition = 'none';
    flyer.style.transform = 'translate(0, 0)';
  } else {
    start = flyStartXY(dieId, layerRect, scale);
    if (!start) {
      onDone();
      return null;
    }
    flyer = document.createElement('div');
    flyer.className = 'placement-die-flyer';
    flyer.innerHTML = dieSVG(die.value, DIE_OUTER);
    flyer.style.left = `${start.left}px`;
    flyer.style.top = `${start.top}px`;
    flyer.style.transform = 'translate(0, 0)';
    layer.appendChild(flyer);
  }

  const dx = end.left - start.left;
  const dy = end.top - start.top;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.transition = `transform ${duration}ms ${FLY_EASING}`;
      flyer.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  });

  setTimeout(() => {
    onDone();
    if (!retainFlyer) flyer.remove();
  }, duration);

  return flyer;
}

function syncStarMarkers() {
  syncStarMarkersDuringMotion();
}

function runSpreadThenFly(dieId, slot, onDone, existingFlyer = null) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) {
    if (placeDie(dieId, slot)) render();
    onDone();
    return;
  }

  const finalTarget = slotAnchorRowXY(slot);

  const offsets = computeSpreadOffsets(slot, dieId);
  const spreadMs = spd(COL_SPREAD_MS);
  const flyMs = spd(COL_DIE_IN_MS);
  const spreadEls = [];

  for (const [col, dx] of offsets) {
    const el = colEl(inner, col);
    if (el) spreadEls.push({ el, dx, col });
  }

  let commitFlyer = existingFlyer;

  const finishPlacement = () => {
    clearSpreadStyles(spreadEls);
    onDone();
    commitFlyer?.remove();
    commitFlyer = null;
  };

  const flyIn = () => {
    commitFlyer = animateDieFly(dieId, finalTarget, flyMs, () => {
      placeDie(dieId, slot);
      if (isRowEdgeInsert(slot)) {
        finishPlacement();
        return;
      }
      const collapseCols = edgeInsertCollapseCols(slot);
      if (collapseCols.length) {
        animateSpreadCollapse(spreadEls, collapseCols, finishPlacement);
      } else {
        finishPlacement();
      }
    }, commitFlyer, true) ?? commitFlyer;
  };

  if (isRowEdgeInsert(slot) || (isGapInsert(slot) && !gapInsertAnimationsAllowed())) {
    handoffInsertHoverSpread(new Set());
    syncStarMarkers();
    flyIn();
    return;
  }

  handoffInsertHoverSpread(new Set(offsets.keys()));

  if (!spreadEls.length) {
    syncStarMarkers();
    flyIn();
    return;
  }

  const needsSpread = spreadEls.some(
    ({ el, dx }) => Math.abs(readColSpreadDx(el) - dx) > 0.5,
  );

  for (const { el } of spreadEls) {
    el.classList.add('placement-col--spreading');
  }

  if (!needsSpread) {
    for (const { el, dx } of spreadEls) {
      el.style.transition = 'none';
      el.style.transform = `translate3d(${dx}px, 0, 0)`;
    }
    syncStarMarkers();
    flyIn();
    return;
  }

  for (const { el } of spreadEls) {
    const cur = readColSpreadDx(el);
    el.style.transition = 'none';
    el.style.transform = `translate3d(${cur}px, 0, 0)`;
  }
  inner.offsetHeight;

  for (const { el, dx } of spreadEls) {
    const cur = readColSpreadDx(el);
    if (Math.abs(cur - dx) < 0.5) continue;
    el.style.transition = `transform ${spreadMs}ms ${SPREAD_EASING}`;
    el.style.transform = `translate3d(${dx}px, 0, 0)`;
  }

  syncStarMarkers();
  setTimeout(flyIn, spreadMs / 4);
}

/** Place from the bar: columns spread (gap inserts), then die flies to the slot. */
export function placeDieWithAnim(dieId, slot, existingFlyer = null) {
  const fromBar = state.actionBar.includes(dieId);
  if (!fromBar) {
    resetInsertHoverSpread();
    resetRepositionCollapse();
    state.draggingDieId = null;
    const ok = placeDie(dieId, slot);
    if (ok) render();
    existingFlyer?.remove();
    return ok;
  }

  const valid = getValidSlotsForDie(dieId);
  if (!valid.some(s => slotsEqual(s, slot))) {
    return false;
  }

  pinRowScroll();
  state.phase = 'animating';
  runSpreadThenFly(dieId, slot, () => {
    state.phase = 'rolled';
    render();
    requestAnimationFrame(() => unpinRowScroll());
  }, existingFlyer);
  return true;
}
