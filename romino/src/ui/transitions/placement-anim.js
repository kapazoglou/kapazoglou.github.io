import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { placeDie, getValidSlotsForDie, slotsEqual, getOccupiedCols, gapInsertAnimationsAllowed } from '../../logic/row.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { pinRowScroll, unpinRowScroll, syncStarMarkersDuringMotion, slotAnchorRowXY } from '../display/placement-row.js';
import { syncDominoSpotStripDuringMotion } from '../display/domino-spot-strip.js';
import { spreadColumnElement, flankStackColElement } from '../display/flank-stacks.js';
import { resetInsertHoverSpread, handoffInsertHoverSpread } from './placement-hover.js';
import { clearRepositionCollapse, resetRepositionCollapse } from './reposition-collapse.js';
import { payStarForSlot } from './pip-anim.js';
import { computeSpreadOffsets } from './placement-spread.js';
import { promoteSnapGhostToFlyer, createCommitFlyerAtSlot } from './push-below-flyer.js';
import { COL_SPREAD_MS, COL_DIE_IN_MS, PUSH_LIFT_MS } from './timing.js';

export { computeSpreadOffsets } from './placement-spread.js';

const SPREAD_EASING = 'ease-out';
/** Fast departure, pronounced deceleration into the gap. */
const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';

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
    syncDominoSpotStripDuringMotion();
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

function animateDieFly(dieId, finalTarget, duration, onDone, existingFlyer = null) {
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
  const dist = Math.hypot(dx, dy);
  const effectiveMs = dist < 0.5 ? 0 : duration;

  const runDone = () => {
    onDone();
    flyer.remove();
  };

  if (effectiveMs <= 0) {
    flyer.style.left = `${end.left}px`;
    flyer.style.top = `${end.top}px`;
    flyer.style.transform = 'translate(0, 0)';
    runDone();
    return flyer;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.transition = `transform ${effectiveMs}ms ${FLY_EASING}`;
      flyer.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  });

  setTimeout(runDone, effectiveMs);

  return flyer;
}

function isCommitFlyerAtTarget(flyer, rowTarget) {
  if (!flyer || !rowTarget) return false;
  const layer = flyLayer();
  const inner = document.querySelector('.placement-row-inner');
  if (!layer || !inner) return false;
  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const innerRect = inner.getBoundingClientRect();
  const end = pointInFlyLayer(rowTarget, innerRect, layerRect, scale);
  const left = parseFloat(flyer.style.left) || 0;
  const top = parseFloat(flyer.style.top) || 0;
  return Math.hypot(end.left - left, end.top - top) < 4;
}

function dieBorder() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-border')) || 4;
}

/** One stack step in design px (die size minus overlap). */
function stackLiftDesignPx() {
  return DIE_OUTER - dieBorder();
}

/** Lift stack + pusher together, then commit. */
function animatePushBelowLift(col, duration, onDone, flyer = null) {
  const inner = document.querySelector('.placement-row-inner');
  const colNode = colEl(inner, col);

  if (!colNode) {
    flyer?.remove();
    onDone();
    return;
  }

  const dice = [...colNode.querySelectorAll('.die--placed')];
  const lift = stackLiftDesignPx();
  const liftY = settings.stackBottomUp ? lift : -lift;

  const finish = () => {
    colNode.classList.remove('placement-col--push-lifting');
    for (const die of dice) {
      die.style.transition = '';
      die.style.transform = '';
    }
    if (flyer) {
      flyer.style.transition = '';
      flyer.style.transform = '';
    }
    onDone();
    flyer?.remove();
  };

  const applyLift = () => {
    colNode.classList.add('placement-col--push-lifting');
    for (const die of dice) {
      die.style.transition = `transform ${duration}ms ${FLY_EASING}`;
      die.style.transform = `translateY(${liftY}px)`;
    }
    if (flyer) {
      flyer.style.transition = `transform ${duration}ms ${FLY_EASING}`;
      flyer.style.transform = `translateY(${liftY}px)`;
    }
  };

  syncStarMarkersDuringMotion();
  syncDominoSpotStripDuringMotion();

  if (duration <= 0) {
    applyLift();
    finish();
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(applyLift);
  });

  setTimeout(finish, duration);
}

function runPushBelow(dieId, slot, onDone, existingFlyer = null) {
  const finalTarget = slotAnchorRowXY(slot);
  const liftMs = spd(PUSH_LIFT_MS);

  let commitFlyer = existingFlyer;
  let committed = false;

  /** Commit exactly once, whatever path the animation took. */
  const commit = () => {
    if (committed) return;
    committed = true;
    placeDie(dieId, slot);
    onDone();
  };

  if (!finalTarget) {
    commitFlyer?.remove();
    commit();
    return;
  }

  payStarForSlot(slot.col);
  syncStarMarkers();

  // The pusher starts snapped under the stack — never a fly-in from tray or finger.
  if (!commitFlyer || !isCommitFlyerAtTarget(commitFlyer, finalTarget)) {
    commitFlyer?.remove();
    commitFlyer = createCommitFlyerAtSlot(dieId, slot);
  }

  animatePushBelowLift(slot.col, liftMs, commit, commitFlyer);
}

function syncStarMarkers() {
  syncStarMarkersDuringMotion();
  syncDominoSpotStripDuringMotion();
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
  if (!slot?.kind) {
    existingFlyer?.remove();
    return false;
  }

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
    existingFlyer?.remove();
    return false;
  }

  if (slot.kind === 'stack-below' && state.stars <= 0) {
    existingFlyer?.remove();
    return false;
  }

  let commitFlyer = existingFlyer;
  if (commitFlyer?.classList.contains('placement-snap-ghost')) {
    commitFlyer = promoteSnapGhostToFlyer(commitFlyer);
  }
  if (commitFlyer) commitFlyer.style.visibility = '';

  if (fromBar) state.draggingDieId = dieId;

  pinRowScroll();
  state.phase = 'animating';
  const finish = () => {
    state.draggingDieId = null;
    state.phase = 'rolled';
    render();
    requestAnimationFrame(() => unpinRowScroll());
  };

  if (slot.kind === 'stack-below') {
    runPushBelow(dieId, slot, finish, commitFlyer);
    return true;
  }

  runSpreadThenFly(dieId, slot, finish, commitFlyer);
  return true;
}
