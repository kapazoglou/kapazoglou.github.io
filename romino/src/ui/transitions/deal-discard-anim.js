import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { render } from '../display/render.js';
import { BEAT_MS, SWEEP_MS } from './timing.js';

function animateOneDiscard(onStepDone) {
  const tileEl = document.querySelector('.action-bar-tile-slot .placement-tile--discarding');
  if (!tileEl) {
    onStepDone();
    return;
  }

  const beat = spd(BEAT_MS);
  const sweep = spd(SWEEP_MS);

  tileEl.classList.add('placement-tile--sweep-run');

  setTimeout(() => {
    tileEl.classList.remove('placement-tile--sweep-pending');
    tileEl.classList.add('placement-tile--sweep-exit');
    setTimeout(() => {
      state.dealingDiscardTile = state.dealingDiscardQueue.shift() ?? null;
      onStepDone();
    }, sweep);
  }, beat);
}

function finishDiscardSequence(onDone) {
  document.getElementById('app')?.classList.remove('is-sweep-exit');
  state.dealingDiscardTile = null;
  onDone?.();
}

/** Sequential sweep-style discard for duplicate tiles dealt from the deck. */
export function runDealDiscardAnimations(onDone) {
  if (!state.dealingDiscardTile) {
    finishDiscardSequence(onDone);
    return;
  }

  state.phase = 'animating';
  document.getElementById('app')?.classList.add('is-sweep-exit');
  render();

  function step() {
    if (!state.dealingDiscardTile) {
      finishDiscardSequence(onDone);
      render();
      return;
    }
    render();
    requestAnimationFrame(() => {
      animateOneDiscard(() => {
        step();
      });
    });
  }

  step();
}
