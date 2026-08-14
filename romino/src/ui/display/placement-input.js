import {
  getValidSlotsForDie,
  slotsEqual,
  isStarBlockedPlacement,
  wouldCompleteBlockedDuplicate,
  convertIdentityForStackCompletion,
  wouldCompleteBlockedCube,
  cubeLockColForStackCompletion,
  wouldCompleteBlockedMonotonic,
  monotonicBoundaryColsForBlockedAttempt,
} from '../../logic/row.js';
import { pushBelowEnabled, pushBelowStarCost } from '../../logic/star-powers.js';
import { state } from '../../logic/state.js';
import { resolveSlotFromPointer, isPointerOnPlacementRow, isVisualBottomDie } from './placement-row.js';
import { placeDieWithAnim } from '../transitions/placement-anim.js';
import { createCommitFlyerAtSlot } from '../transitions/push-below-flyer.js';
import {
  flashInvalidPlacement,
  flashStarShortagePlacement,
  flashDuplicateBlocked,
  flashCubeBlocked,
  flashMonotonicBlocked,
} from '../transitions/invalid-flash.js';

function flashBlockedPlacement(dieId, slot) {
  if (isStarBlockedPlacement(dieId, slot)) flashStarShortagePlacement();
  else if (wouldCompleteBlockedDuplicate(dieId, slot)) {
    const identity = convertIdentityForStackCompletion(dieId, slot);
    if (identity) flashDuplicateBlocked(identity.suit, identity.rank);
    else flashInvalidPlacement();
  } else if (wouldCompleteBlockedCube(dieId, slot)) {
    const lockCol = cubeLockColForStackCompletion(dieId, slot);
    if (lockCol != null) flashCubeBlocked(lockCol);
    else flashInvalidPlacement();
  } else if (wouldCompleteBlockedMonotonic(dieId, slot)) {
    flashMonotonicBlocked(monotonicBoundaryColsForBlockedAttempt(dieId, slot));
  } else flashInvalidPlacement();
}

/** @returns {'placed' | 'invalid' | 'none'} */
export function attemptPushBelowOnBottomDie(dieId, bottomDieEl) {
  if (!bottomDieEl?.classList?.contains('die--placed')) return 'none';
  if (!isVisualBottomDie(bottomDieEl)) return 'none';
  if (!state.actionBar.includes(dieId)) return 'none';

  const col = Number(bottomDieEl.dataset.col);
  if (Number.isNaN(col)) return 'none';

  const slot = { kind: 'stack-below', col };
  const valid = getValidSlotsForDie(dieId);
  if (!valid.some(s => slotsEqual(s, slot))) {
    if (pushBelowEnabled() && state.stars < pushBelowStarCost()) flashStarShortagePlacement();
    else flashInvalidPlacement();
    return 'invalid';
  }

  const flyer = createCommitFlyerAtSlot(dieId, slot);
  if (placeDieWithAnim(dieId, slot, flyer)) return 'placed';
  flyer?.remove();
  flashInvalidPlacement();
  return 'invalid';
}

/** @returns {'placed' | 'invalid' | 'none'} */
export function attemptPlacementAtPoint(dieId, clientX, clientY, stackY = clientY, existingFlyer = null) {
  const onRow = isPointerOnPlacementRow(clientX, clientY);
  const validSlots = getValidSlotsForDie(dieId);
  const slot = resolveSlotFromPointer(clientX, clientY, stackY, { dieId, validSlots });

  if (!slot) {
    if (onRow) flashInvalidPlacement();
    return 'none';
  }

  if (validSlots.some(s => slotsEqual(s, slot))) {
    const flyer = slot.kind === 'stack-below' ? null : existingFlyer;
    if (placeDieWithAnim(dieId, slot, flyer)) return 'placed';
    flashInvalidPlacement();
    return 'invalid';
  }

  flashBlockedPlacement(dieId, slot);
  return 'invalid';
}
