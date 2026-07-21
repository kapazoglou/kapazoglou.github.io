import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { placeDie, getDealtTileForPlacement, getValidSlotsForDealtTile, placeDealtTile, getValidSlotsForDie, slotsEqual, getOccupiedCols, findDieColumn, getColumn, gapInsertAnimationsAllowed, liftDealtTileForReposition } from '../../logic/row.js';
import { dieSVG, DIE_OUTER, TILE_OUTER_W, TILE_OUTER_H, tileHTML } from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { pinRowScroll, unpinRowScroll, syncStarMarkersDuringMotion } from '../display/placement-row.js';
import { resetInsertHoverSpread, handoffInsertHoverSpread } from './placement-hover.js';
import { clearRepositionCollapse, resetRepositionCollapse, beginColumnRepositionCollapse } from './reposition-collapse.js';
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

/** Sole-die column being repositioned vanishes on commit — spread as if it is already gone. */
function remapInsertSlotAfterColRemoval(slot, removedCol) {
  if (slot.kind !== 'insert') return slot;

  const remaining = getOccupiedCols().filter(c => c !== removedCol);
  let { leftCol, rightCol } = slot;

  if (leftCol === removedCol) {
    const idx = remaining.indexOf(rightCol);
    leftCol = idx > 0 ? remaining[idx - 1] : null;
  }

  if (rightCol === removedCol) {
    const idx = remaining.indexOf(leftCol);
    rightCol = idx >= 0 && idx < remaining.length - 1 ? remaining[idx + 1] : null;
  }

  return { kind: 'insert', leftCol, rightCol };
}

function effectiveSpreadContext(slot, dieId = null) {
  const occupiedFull = getOccupiedCols();
  if (!dieId || state.actionBar.includes(dieId)) {
    return { slot, occupied: occupiedFull, excludeCols: new Set() };
  }

  const loc = findDieColumn(dieId);
  if (!loc) return { slot, occupied: occupiedFull, excludeCols: new Set() };

  const column = getColumn(loc.col);
  const soleSource = column?.kind === 'stack' && column.dice.length === 1;
  if (!soleSource) {
    return { slot, occupied: occupiedFull, excludeCols: new Set() };
  }

  const removedCol = loc.col;
  return {
    slot: slot.kind === 'insert' ? remapInsertSlotAfterColRemoval(slot, removedCol) : slot,
    occupied: occupiedFull.filter(c => c !== removedCol),
    excludeCols: new Set([removedCol]),
  };
}

/** Symmetric spread from gap centre — entire left block −half, entire right block +half. */
export function computeSpreadOffsets(slot, dieId = null) {
  const offsets = new Map();
  if (slot.kind !== 'insert') return offsets;

  const { slot: effSlot, occupied, excludeCols } = effectiveSpreadContext(slot, dieId);
  const half = openWidth() / 2;
  const { leftCol, rightCol } = effSlot;

  if (leftCol == null) {
    for (const col of occupied) {
      if (!excludeCols.has(col)) offsets.set(col, half);
    }
    return offsets;
  }

  if (rightCol == null) {
    for (const col of occupied) {
      if (!excludeCols.has(col)) offsets.set(col, -half);
    }
    return offsets;
  }

  for (const col of occupied) {
    if (excludeCols.has(col)) continue;
    if (col <= leftCol) offsets.set(col, -half);
    else if (col >= rightCol) offsets.set(col, half);
  }
  return offsets;
}

/** Row-edge insert — no full-row spread (columns stay put until render). */
function isRowEdgeInsert(slot) {
  return slot.kind === 'insert' && (slot.leftCol == null || slot.rightCol == null);
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
    cx = box.left - open / 2;
    bottom = box.bottom;
  } else if (slot.rightCol == null) {
    const el = colEl(inner, slot.leftCol);
    if (!el) return null;
    const box = colBoxInInner(el, innerRect, scale);
    cx = box.right + open / 2;
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

/** Tile landing in row-inner design px — bottom-aligned like a placed tile column. */
function tileFinalTargetXY(slot, inner, innerRect, scale) {
  const half = openWidth() / 2;
  const open = openWidth();

  if (slot.kind === 'new-column') {
    const ghost = inner.querySelector('.placement-col--ghost-first');
    if (!ghost) return null;
    const box = colBoxInInner(ghost, innerRect, scale);
    return {
      left: box.left + (ghost.offsetWidth - TILE_OUTER_W) / 2,
      top: box.bottom - TILE_OUTER_H,
    };
  }

  if (slot.kind !== 'insert') return null;

  let cx;
  let bottom;

  if (slot.leftCol == null) {
    const el = colEl(inner, slot.rightCol);
    if (!el) return null;
    const box = colBoxInInner(el, innerRect, scale);
    cx = box.left - open / 2;
    bottom = box.bottom;
  } else if (slot.rightCol == null) {
    const el = colEl(inner, slot.leftCol);
    if (!el) return null;
    const box = colBoxInInner(el, innerRect, scale);
    cx = box.right + open / 2;
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
    left: cx - TILE_OUTER_W / 2,
    top: bottom - TILE_OUTER_H,
  };
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

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();
  const finalTarget = dieFinalTargetXY(slot, inner, innerRect, scale);

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

function tileFlyerHTML(tile) {
  return tileHTML(tile, { classExtra: 'placement-tile-flyer' });
}

function flyStartFromActionBarTile(layerRect, scale) {
  const el = document.querySelector('.action-bar-tile-slot .placement-tile[data-dealt-tile]:not(.placement-tile--discarding)');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - layerRect.left, scale),
    top: toDesignPx(r.top - layerRect.top, scale),
  };
}

function flyStartFromRowTile(col, layerRect, scale) {
  const el = document.querySelector(`.placement-col[data-col="${col}"] .placement-tile`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - layerRect.left, scale),
    top: toDesignPx(r.top - layerRect.top, scale),
  };
}

function createTileFlyerAt(tile, start, layer) {
  const flyer = document.createElement('div');
  flyer.className = 'placement-die-flyer placement-die-flyer--tile';
  flyer.innerHTML = tileFlyerHTML(tile);
  flyer.style.left = `${start.left}px`;
  flyer.style.top = `${start.top}px`;
  flyer.style.transform = 'translate(0, 0)';
  flyer.style.transition = 'none';
  layer.appendChild(flyer);
  return flyer;
}

function animateTileFly(tile, finalTarget, duration, onDone, existingFlyer = null, retainFlyer = false) {
  const layer = flyLayer();
  const inner = document.querySelector('.placement-row-inner');
  if (!layer || !inner || !finalTarget) {
    existingFlyer?.remove();
    onDone();
    return null;
  }

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
    start = flyStartFromActionBarTile(layerRect, scale);
    if (!start) {
      onDone();
      return null;
    }
    flyer = document.createElement('div');
    flyer.className = 'placement-die-flyer placement-die-flyer--tile';
    flyer.innerHTML = tileFlyerHTML(tile);
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

function runSpreadThenFlyTile(slot, onDone, existingFlyer = null) {
  const tile = state.dealtTile;
  if (!tile) {
    onDone();
    return;
  }

  const inner = document.querySelector('.placement-row-inner');
  if (!inner) {
    if (placeDealtTile(slot)) render();
    onDone();
    return;
  }

  const scale = viewportScale();
  const innerRect = inner.getBoundingClientRect();
  const finalTarget = tileFinalTargetXY(slot, inner, innerRect, scale);

  const offsets = computeSpreadOffsets(slot, null);
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
    commitFlyer = animateTileFly(tile, finalTarget, flyMs, () => {
      placeDealtTile(slot);
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

  const needsSpread = spreadEls.some(({ el, dx }) => Math.abs(readColSpreadDx(el) - dx) > 0.5);

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

/** Place dealt tile from the bar or reposition a placed-this-turn tile: spread, then fly. */
export function placeDealtTileWithAnim(slot, existingFlyer = null) {
  if (!getDealtTileForPlacement()) return false;
  if (!getValidSlotsForDealtTile().some(s => slotsEqual(s, slot))) return false;

  pinRowScroll();

  const repositionCol = state.placedDealtTileCol;
  if (repositionCol != null && !state.dealtTile && !existingFlyer) {
    const layer = flyLayer();
    const scale = viewportScale();
    const layerRect = layer?.getBoundingClientRect();
    const start = layerRect ? flyStartFromRowTile(repositionCol, layerRect, scale) : null;
    beginColumnRepositionCollapse(repositionCol);
    liftDealtTileForReposition(repositionCol);
    if (start && layer && state.dealtTile) {
      existingFlyer = createTileFlyerAt(state.dealtTile, start, layer);
    }
    render();
  }

  if (!state.dealtTile) return false;

  state.phase = 'animating';
  state.selectedDealtTile = false;
  runSpreadThenFlyTile(slot, () => {
    state.phase = 'rolled';
    render();
    requestAnimationFrame(() => unpinRowScroll());
  }, existingFlyer);
  return true;
}
