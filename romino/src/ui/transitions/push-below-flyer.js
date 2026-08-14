import { state } from '../../logic/state.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { slotAnchorXY } from '../display/placement-row.js';

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

/** Snap ghost → commit flyer at release (no disappear/reappear). */
export function promoteSnapGhostToFlyer(ghostEl) {
  if (!ghostEl) return null;
  ghostEl.classList.remove('placement-snap-ghost', 'placement-snap-ghost--push-below');
  ghostEl.classList.add('placement-die-flyer');
  ghostEl.style.opacity = '';
  ghostEl.style.visibility = '';
  return ghostEl;
}

/** Tap-to-push: spawn commit flyer at snap anchor (same slot as ghost). */
export function createCommitFlyerAtSlot(dieId, slot) {
  const layer = flyLayer();
  const pos = slotAnchorXY(slot, dieId);
  if (!layer || !pos) return null;
  const die = state.dice[dieId];
  const el = document.createElement('div');
  el.className = 'placement-die-flyer';
  el.innerHTML = dieSVG(die.value, DIE_OUTER);
  el.style.left = `${pos.left}px`;
  el.style.top = `${pos.top}px`;
  el.style.transform = 'translate(0, 0)';
  el.style.transition = 'none';
  layer.appendChild(el);
  return el;
}
