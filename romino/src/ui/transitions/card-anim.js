import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { fillOneCard } from '../../logic/phase.js';
import { render } from '../display/render.js';
import { renderHUD, popCoolOffCard } from '../display/hud.js';
import {
  BANK_PIP_POP_UP_MS,
  BANK_PIP_POP_DOWN_MS,
  BANK_PIP_TRAVEL_MS,
  BANK_PIP_FADE_DONE_MS,
  BANK_PIP_FADE_MS,
  BANK_PIP_FADE_DELAY_MS,
  BANK_PIP_GAP_MS,
} from './timing.js';

/** Matches #hud font-size — bank pips use the same emoji size as grid coins. */
const HUD_COIN_FONT_PX = 28;

/** Launch one score pip from fromRect toward toRect. */
function launchPipWithTimings(fromRect, toRect, onArrival, onDone, fontSizePx, {
  popUp, popDown, travel, fadeDone, fade, fadeDelay,
}) {
  const POP_UP_MS    = spd(popUp);
  const POP_DOWN_MS  = spd(popDown);
  const POP_TOTAL_MS = POP_UP_MS + POP_DOWN_MS;
  const TRAVEL_MS    = spd(travel);
  const FADE_DONE_MS = spd(fadeDone);

  const pip = document.createElement('div');
  pip.textContent = '🪙';
  Object.assign(pip.style, {
    position:      'fixed',
    left:          `${fromRect.left + fromRect.width  / 2}px`,
    top:           `${fromRect.top  + fromRect.height / 2}px`,
    transform:     'translate(-50%, -50%) scale(1)',
    fontSize:      `${fontSizePx}px`,
    lineHeight:    '1',
    pointerEvents: 'none',
    zIndex:        '9998',
    transition:    'none',
  });
  document.body.appendChild(pip);
  pip.getBoundingClientRect();

  pip.style.transition = `transform ${POP_UP_MS}ms cubic-bezier(0.2, 0, 0.4, 1)`;
  pip.style.transform  = 'translate(-50%, -50%) scale(1.33)';

  setTimeout(() => {
    pip.style.transition = `transform ${POP_DOWN_MS}ms ease`;
    pip.style.transform  = 'translate(-50%, -50%) scale(1)';
  }, POP_UP_MS);

  const tx = (toRect.left + toRect.width  / 2) - (fromRect.left + fromRect.width  / 2);
  const ty = (toRect.top  + toRect.height / 2) - (fromRect.top  + fromRect.height / 2);
  setTimeout(() => {
    pip.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.2,0.8,0.3,1), opacity ${spd(fade)}ms ease ${spd(fadeDelay)}ms`;
    pip.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    pip.style.opacity    = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  }, POP_TOTAL_MS);

  setTimeout(onArrival, POP_TOTAL_MS + TRAVEL_MS);
  setTimeout(onDone,    POP_TOTAL_MS + FADE_DONE_MS);
}

const EARN_PIP_TIMINGS = { popUp: 110, popDown: 130, travel: 550, fadeDone: 750, fade: 600, fadeDelay: 150 };
const BANK_PIP_TIMINGS = {
  popUp: BANK_PIP_POP_UP_MS,
  popDown: BANK_PIP_POP_DOWN_MS,
  travel: BANK_PIP_TRAVEL_MS,
  fadeDone: BANK_PIP_FADE_DONE_MS,
  fade: BANK_PIP_FADE_MS,
  fadeDelay: BANK_PIP_FADE_DELAY_MS,
};

export function launchPip(fromRect, toRect, onArrival, onDone, fontSizePx = 56) {
  launchPipWithTimings(fromRect, toRect, onArrival, onDone, fontSizePx, EARN_PIP_TIMINGS);
}

function launchBankPip(fromRect, toRect, onArrival, onDone, fontSizePx = HUD_COIN_FONT_PX) {
  launchPipWithTimings(fromRect, toRect, onArrival, onDone, fontSizePx, BANK_PIP_TIMINGS);
}

/** Reverse pip: coin flies FROM score counter TO a target slot (forbidden-slot penalty). */
export function launchPenaltyPip(toRect) {
  const scoreEl = document.getElementById('score-display');
  if (!scoreEl) return;
  const fromRect = scoreEl.getBoundingClientRect();
  const TRAVEL_MS = spd(480);
  const pip = document.createElement('div');
  pip.textContent = '🪙';
  Object.assign(pip.style, {
    position:      'fixed',
    left:          `${fromRect.left + fromRect.width  / 2}px`,
    top:           `${fromRect.top  + fromRect.height / 2}px`,
    transform:     'translate(-50%, -50%) scale(1)',
    fontSize:      '56px',
    lineHeight:    '1',
    pointerEvents: 'none',
    zIndex:        '9998',
    transition:    'none',
  });
  document.body.appendChild(pip);
  pip.getBoundingClientRect();
  const tx = (toRect.left + toRect.width  / 2) - (fromRect.left + fromRect.width  / 2);
  const ty = (toRect.top  + toRect.height / 2) - (fromRect.top  + fromRect.height / 2);
  requestAnimationFrame(() => {
    pip.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${spd(300)}ms ease ${(TRAVEL_MS * 0.7 / 1000).toFixed(2)}s`;
    pip.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.55)`;
    pip.style.opacity    = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  });
}

/** Fire pts pips one after the other; calls onAllDone when the last one fades. */
export function firePipsSequential(fromRect, toRect, pts, pipIndex, onAllDone) {
  if (pipIndex >= pts) { onAllDone(); return; }
  launchPip(fromRect, toRect,
    () => { state.score++; renderHUD(); },
    () => firePipsSequential(fromRect, toRect, pts, pipIndex + 1, onAllDone),
    HUD_COIN_FONT_PX,
  );
}

/** Fly each score coin to swept points (staggered); decrements score and increments sweptPoints per arrival. */
export function bankScoreToSweptPoints(onDone) {
  const count = state.score;
  if (count <= 0 || !settings.scoring) {
    onDone?.();
    return;
  }

  const scoreEl = document.getElementById('score-display');
  const sweptEl = document.getElementById('swept-points');
  if (!scoreEl || !sweptEl) {
    state.sweptPoints += count;
    state.score = 0;
    renderHUD();
    onDone?.();
    return;
  }

  let completed = 0;
  for (let p = 0; p < count; p++) {
    setTimeout(() => {
      const fromRect = scoreEl.getBoundingClientRect();
      const toRect = sweptEl.getBoundingClientRect();
      launchBankPip(fromRect, toRect,
        () => {
          if (state.score > 0) state.score--;
          state.sweptPoints++;
          renderHUD();
        },
        () => {
          completed++;
          if (completed >= count) onDone?.();
        },
      );
    }, p * spd(BANK_PIP_GAP_MS));
  }
}

/** Animate and fill cards in queue one by one; calls onDone when done. */
export function processCardFills(queue, index, onDone) {
  if (index >= queue.length) { setTimeout(() => onDone?.(), spd(420)); return; }
  const { cardId, pts } = queue[index];

  const CONVERT_MS = spd(240);
  const next = () => {
    const cardEl = document.querySelector(`.converter-card[data-card-id="${cardId}"]`);
    if (cardEl) {
      cardEl.classList.add('is-converting');
      setTimeout(() => {
        popCoolOffCard(true);
        fillOneCard(cardId);
        if (state.phase === 'replay') { onDone?.(); return; }
        render();
        processCardFills(queue, index + 1, onDone);
      }, CONVERT_MS);
    } else {
      popCoolOffCard(true);
      fillOneCard(cardId);
      if (state.phase === 'replay') { onDone?.(); return; }
      render();
      processCardFills(queue, index + 1, onDone);
    }
  };

  if (pts === 0) { setTimeout(next, spd(320)); return; }

  const previewEl = document.querySelector(`.converter-card[data-card-id="${cardId}"] .score-preview`);
  const scoreEl   = document.getElementById('score-display');

  if (!previewEl || !scoreEl) {
    state.score += pts;
    renderHUD();
    next();
    return;
  }

  const fromRect = previewEl.getBoundingClientRect();
  const toRect   = scoreEl.getBoundingClientRect();

  state.cards[cardId].showScorePreview = false;
  render();

  firePipsSequential(fromRect, toRect, pts, 0, next);
}
