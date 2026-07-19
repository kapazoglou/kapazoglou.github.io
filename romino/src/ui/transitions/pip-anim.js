import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { renderHUD } from '../display/hud-v2.js';
import {
  BANK_PIP_POP_UP_MS,
  BANK_PIP_POP_DOWN_MS,
  BANK_PIP_TRAVEL_MS,
  BANK_PIP_FADE_DONE_MS,
  BANK_PIP_FADE_MS,
  BANK_PIP_FADE_DELAY_MS,
  BANK_PIP_GAP_MS,
} from './timing.js';

function launchPipWithTimings(fromRect, toRect, onArrival, onDone, fontSizePx, {
  popUp, popDown, travel, fadeDone, fade, fadeDelay,
}) {
  const POP_UP_MS = spd(popUp);
  const POP_DOWN_MS = spd(popDown);
  const POP_TOTAL_MS = POP_UP_MS + POP_DOWN_MS;
  const TRAVEL_MS = spd(travel);
  const FADE_DONE_MS = spd(fadeDone);

  const pip = document.createElement('div');
  pip.textContent = '⭐';
  Object.assign(pip.style, {
    position: 'fixed',
    left: `${fromRect.left + fromRect.width / 2}px`,
    top: `${fromRect.top + fromRect.height / 2}px`,
    transform: 'translate(-50%, -50%) scale(1)',
    fontSize: `${fontSizePx}px`,
    lineHeight: '1',
    pointerEvents: 'none',
    zIndex: '9998',
    transition: 'none',
  });
  document.body.appendChild(pip);
  pip.getBoundingClientRect();

  pip.style.transition = `transform ${POP_UP_MS}ms cubic-bezier(0.2, 0, 0.4, 1)`;
  pip.style.transform = 'translate(-50%, -50%) scale(1.33)';

  setTimeout(() => {
    pip.style.transition = `transform ${POP_DOWN_MS}ms ease`;
    pip.style.transform = 'translate(-50%, -50%) scale(1)';
  }, POP_UP_MS);

  const tx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
  const ty = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
  setTimeout(() => {
    pip.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.2,0.8,0.3,1), opacity ${spd(fade)}ms ease ${spd(fadeDelay)}ms`;
    pip.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    pip.style.opacity = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  }, POP_TOTAL_MS);

  setTimeout(onArrival, POP_TOTAL_MS + TRAVEL_MS);
  setTimeout(onDone, POP_TOTAL_MS + FADE_DONE_MS);
}

const BANK_PIP_TIMINGS = {
  popUp: BANK_PIP_POP_UP_MS,
  popDown: BANK_PIP_POP_DOWN_MS,
  travel: BANK_PIP_TRAVEL_MS,
  fadeDone: BANK_PIP_FADE_DONE_MS,
  fade: BANK_PIP_FADE_MS,
  fadeDelay: BANK_PIP_FADE_DELAY_MS,
};

const HUD_STAR_FONT_PX = 32;

function launchBankStarPip(fromRect, toRect, onArrival, onDone) {
  launchPipWithTimings(fromRect, toRect, onArrival, onDone, HUD_STAR_FONT_PX, BANK_PIP_TIMINGS);
}

/** Visual-only star pips after state.points / state.stars were already updated. */
export function bankStarsToPoints(count, onDone) {
  if (count <= 0) {
    onDone?.();
    return;
  }

  const starsEl = document.getElementById('hud-stars');
  const pointsEl = document.getElementById('hud-points');
  if (!starsEl || !pointsEl) {
    onDone?.();
    return;
  }

  let displayStars = state.stars + count;
  let displayPoints = state.points - count;
  renderHUD();
  const starsNode = document.getElementById('hud-stars');
  const pointsNode = document.getElementById('hud-points');
  if (starsNode) starsNode.textContent = String(displayStars);
  if (pointsNode) pointsNode.textContent = String(displayPoints);

  let completed = 0;
  for (let p = 0; p < count; p++) {
    setTimeout(() => {
      const fromRect = starsNode.getBoundingClientRect();
      const toRect = pointsNode.getBoundingClientRect();
      launchBankStarPip(fromRect, toRect,
        () => {
          displayStars = Math.max(0, displayStars - 1);
          displayPoints += 1;
          if (starsNode) starsNode.textContent = String(displayStars);
          if (pointsNode) pointsNode.textContent = String(displayPoints);
        },
        () => {
          completed++;
          if (completed >= count) {
            renderHUD();
            onDone?.();
          }
        },
      );
    }, p * spd(BANK_PIP_GAP_MS));
  }
}
