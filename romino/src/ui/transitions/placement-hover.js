import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { getValidSlotsForDie, slotsEqual, gapInsertAnimationsAllowed } from '../../logic/row.js';
import { resolveInsertSlotFromPointer, syncStarMarkersDuringMotion } from '../display/placement-row.js';
import { computeSpreadOffsets } from './placement-anim.js';
import { COL_SPREAD_MS } from './timing.js';

const SPREAD_EASING = 'ease-out';

/** Between-column gaps only — not row-edge inserts. */
function isGapInsert(slot) {
  return slot.kind === 'insert' && slot.leftCol != null && slot.rightCol != null;
}

/** @type {Map<number, number>} */
let activeSpreadDx = new Map();
/** @type {import('../../logic/row.js').Slot | null} */
let activeHoverSlot = null;

function spreadMs() {
  return spd(COL_SPREAD_MS);
}

function colEl(inner, col) {
  return inner.querySelector(`.placement-col[data-col="${col}"]`);
}

function applySpreadCol(col, spreadDx, animate) {
  const inner = document.querySelector('.placement-row-inner');
  const el = colEl(inner, col);
  if (!el) return;

  const ms = animate ? spreadMs() : 0;
  const transition = ms ? `transform ${ms}ms ${SPREAD_EASING}` : 'none';

  if (spreadDx) {
    el.classList.add('placement-col--spreading');
    el.style.transition = transition;
    el.style.transform = `translate3d(${spreadDx}px, 0, 0)`;
  } else {
    el.style.transition = transition;
    el.style.transform = '';
    el.classList.remove('placement-col--spreading');
  }
}

/** End hover preview — keep spread on commit cols, instant-clear the rest (no reverse anim). */
export function handoffInsertHoverSpread(keepCols) {
  activeHoverSlot = null;
  const keep = keepCols instanceof Set ? keepCols : new Set(keepCols);
  for (const col of [...activeSpreadDx.keys()]) {
    if (!keep.has(col)) applySpreadCol(col, 0, false);
  }
  activeSpreadDx = new Map(
    [...activeSpreadDx.entries()].filter(([col]) => keep.has(col)),
  );
}

/** Preview gap insert — columns spread from gap midpoint while pointer hovers a valid insert. */
export function updateInsertHoverSpread(dieId, clientX, clientY) {
  if (!settings.directPlacement || state.phase === 'animating') {
    if (activeHoverSlot !== null) resetInsertHoverSpread();
    return;
  }

  if (!gapInsertAnimationsAllowed()) {
    if (activeHoverSlot !== null) clearInsertHoverSpread();
    return;
  }

  const slot = resolveInsertSlotFromPointer(clientX, clientY);
  if (!slot || !isGapInsert(slot)) {
    if (activeHoverSlot !== null) clearInsertHoverSpread();
    return;
  }

  const valid = getValidSlotsForDie(dieId);
  if (!valid.some(s => slotsEqual(s, slot))) {
    if (activeHoverSlot !== null) clearInsertHoverSpread();
    return;
  }

  if (activeHoverSlot && slotsEqual(activeHoverSlot, slot)) return;

  activeHoverSlot = slot;
  const offsets = computeSpreadOffsets(slot, dieId);

  for (const [col, prevDx] of activeSpreadDx) {
    if (!offsets.has(col)) applySpreadCol(col, 0, true);
  }

  for (const [col, dx] of offsets) {
    if (activeSpreadDx.get(col) === dx) continue;
    applySpreadCol(col, dx, true);
  }

  activeSpreadDx = new Map(offsets);
  syncStarMarkersDuringMotion();
}

export function resetInsertHoverSpread() {
  activeHoverSlot = null;
  activeSpreadDx = new Map();
}

/** Clear gap preview spread — `touchDom: false` when `render()` follows immediately. */
export function clearInsertHoverSpread(animate = true, touchDom = true) {
  activeHoverSlot = null;
  if (!activeSpreadDx.size) return;
  if (touchDom) {
    for (const col of activeSpreadDx.keys()) {
      applySpreadCol(col, 0, animate);
    }
    syncStarMarkersDuringMotion();
  }
  activeSpreadDx = new Map();
}
