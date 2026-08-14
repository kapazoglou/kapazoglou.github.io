import { settings } from '../../logic/settings.js';
import { spreadContextForDie } from '../../logic/row.js';
import { flankStackTop } from '../../logic/deck-flank.js';
import { FLANK_SPREAD_LEFT, FLANK_SPREAD_RIGHT } from '../display/flank-stacks.js';

const gapH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--die-gap-h')) || 6;
const colW = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col-width')) || 48;
/** Horizontal space a new column consumes in the flex row (margin + die + margin). */
const openWidth = () => colW() + gapH();

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
