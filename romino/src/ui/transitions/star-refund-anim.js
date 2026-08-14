import {
  returnDieToBar,
  peekStarPowerReturnRefund,
  peekStarPowerRepositionRefund,
} from '../../logic/row.js';
import { pushBelowStarCost, addPushReminderCol, clearPushReminderCol } from '../../logic/star-powers.js';
import { refundStarFromCol, payStarForSlot } from './pip-anim.js';
import { syncStarMarkersDuringMotion, positionStarMarkers } from '../display/placement-row.js';
import { render } from '../display/render.js';
import { renderHUD } from '../display/hud-v2.js';
import { CONVERT_FLY_MS } from './timing.js';
import { spd } from '../../logic/settings.js';

/** Return placed die to tray; star-power refunds fly col → HUD immediately after render. */
export function returnDieToBarWithStarRefund(dieId, keepSelected = false) {
  const refund = peekStarPowerReturnRefund(dieId);
  if (!returnDieToBar(dieId, keepSelected)) return false;

  render();
  positionStarMarkers();
  syncStarMarkersDuringMotion(spd(CONVERT_FLY_MS));
  if (refund) {
    refundStarFromCol(refund.col, () => {
      positionStarMarkers();
      renderHUD();
    }, refund.count, { fromRow: refund.fromRow });
  }
  return true;
}

/** After a successful push-below reposition `placeDie`, play leave refund (+ target pay when applicable). */
export function playRepositionStarRefunds(repositionRefund, slot) {
  const willPayPush = slot?.kind === 'stack-below';
  let pending = 0;
  const done = () => {
    if (--pending <= 0) renderHUD();
  };

  if (repositionRefund) {
    pending++;
    clearPushReminderCol(repositionRefund.col);
    refundStarFromCol(repositionRefund.col, done, repositionRefund.count, { fromRow: 0 });
  }
  if (willPayPush) {
    pending++;
    payStarForSlot(slot.col, () => {
      addPushReminderCol(slot.col);
      syncStarMarkersDuringMotion();
      done();
    }, pushBelowStarCost());
  }
  if (pending === 0) return false;
  return true;
}

export { peekStarPowerRepositionRefund };
