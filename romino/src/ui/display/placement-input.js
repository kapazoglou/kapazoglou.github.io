import { getValidSlotsForDie, getValidSlotsForDealtTile, slotsEqual, isStarBlockedPlacement } from '../../logic/row.js';

import { resolveSlotFromPointer, isPointerOnPlacementRow } from './placement-row.js';

import { placeDieWithAnim, placeDealtTileWithAnim } from '../transitions/placement-anim.js';

import { flashInvalidPlacement, flashStarShortagePlacement } from '../transitions/invalid-flash.js';



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



  if (isStarBlockedPlacement(dieId, slot)) flashStarShortagePlacement();
  else flashInvalidPlacement();

  return 'invalid';

}



/** @returns {'placed' | 'invalid' | 'none'} */

export function attemptDealtTilePlacementAtPoint(clientX, clientY, stackY = clientY, existingFlyer = null) {

  const onRow = isPointerOnPlacementRow(clientX, clientY);

  const slot = resolveSlotFromPointer(clientX, clientY, stackY, { allowStack: false });



  if (!slot) {

    if (onRow) flashInvalidPlacement();

    return 'none';

  }



  const valid = getValidSlotsForDealtTile();

  if (valid.some(s => slotsEqual(s, slot))) {

    if (placeDealtTileWithAnim(slot, existingFlyer)) return 'placed';

    flashInvalidPlacement();

    return 'invalid';

  }



  flashInvalidPlacement();

  return 'invalid';

}

