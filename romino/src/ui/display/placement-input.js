import { getValidSlotsForDie, slotsEqual } from '../../logic/row.js';
import { resolveSlotFromPointer, isPointerOnPlacementRow } from './placement-row.js';
import { placeDieWithAnim } from '../transitions/placement-anim.js';
import { flashInvalidPlacement } from '../transitions/invalid-flash.js';

/** @returns {'placed' | 'invalid' | 'none'} */
export function attemptPlacementAtPoint(dieId, clientX, clientY, stackY = clientY, existingFlyer = null) {
  const onRow = isPointerOnPlacementRow(clientX, clientY);
  const slot = resolveSlotFromPointer(clientX, clientY, stackY);

  if (!slot) {
    if (onRow) flashInvalidPlacement();
    return 'none';
  }

  const valid = getValidSlotsForDie(dieId);
  if (valid.some(s => slotsEqual(s, slot))) {
    if (placeDieWithAnim(dieId, slot, existingFlyer)) return 'placed';
    flashInvalidPlacement();
    return 'invalid';
  }

  flashInvalidPlacement();
  return 'invalid';
}
