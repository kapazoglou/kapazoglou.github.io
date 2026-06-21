import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { fillOneCard } from '../../logic/phase.js';
import { render } from '../display/render.js';
import { renderHUD, popCoolOffCard } from '../display/hud.js';

/** Launch one score pip from fromRect toward toRect. */
export function launchPip(fromRect, toRect, onArrival, onDone, fontSizePx = 56) {
  const POP_UP_MS    = spd(110);
  const POP_DOWN_MS  = spd(130);
  const POP_TOTAL_MS = POP_UP_MS + POP_DOWN_MS;
  const TRAVEL_MS    = spd(550);
  const FADE_DONE_MS = spd(750);

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
    pip.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.2,0.8,0.3,1), opacity ${spd(600)}ms ease ${spd(150)}ms`;
    pip.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    pip.style.opacity    = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  }, POP_TOTAL_MS);

  setTimeout(onArrival, POP_TOTAL_MS + TRAVEL_MS);
  setTimeout(onDone,    POP_TOTAL_MS + FADE_DONE_MS);
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
  );
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
        render();
        processCardFills(queue, index + 1, onDone);
      }, CONVERT_MS);
    } else {
      popCoolOffCard(true);
      fillOneCard(cardId);
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
