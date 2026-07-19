import { state, clearSweepExitTimers } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { findSweepRuns, applySweepRun } from '../../logic/sweeps-row.js';
import { render } from '../display/render.js';
import { pinRowScroll, unpinRowScroll } from '../display/placement-row.js';
import { bankStarsToPoints } from './pip-anim.js';
import { BEAT_MS, SWEEP_MS, COL_COLLAPSE_MS } from './timing.js';

const COLLAPSE_EASING = 'ease-out';

function captureColLeftPositions() {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) return new Map();
  const map = new Map();
  for (const el of inner.querySelectorAll('.placement-col[data-col]')) {
    const col = Number(el.dataset.col);
    if (!Number.isNaN(col)) map.set(col, el.offsetLeft);
  }
  return map;
}

/** FLIP remaining columns inward after swept tiles are removed from state. */
function animateColumnCollapse(beforeLeft, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  if (!inner) {
    onDone();
    return;
  }

  const ms = spd(COL_COLLAPSE_MS);
  const movers = [];

  for (const el of inner.querySelectorAll('.placement-col[data-col]')) {
    const col = Number(el.dataset.col);
    const oldLeft = beforeLeft.get(col);
    if (oldLeft == null) continue;
    const dx = oldLeft - el.offsetLeft;
    if (Math.abs(dx) < 0.5) continue;
    movers.push({ el, dx });
  }

  if (!movers.length) {
    onDone();
    return;
  }

  for (const { el, dx } of movers) {
    el.classList.add('placement-col--collapsing');
    el.style.transition = 'none';
    el.style.transform = `translate3d(${dx}px, 0, 0)`;
  }
  inner.offsetHeight;

  for (const { el } of movers) {
    el.style.transition = `transform ${ms}ms ${COLLAPSE_EASING}`;
    el.style.transform = 'translate3d(0, 0, 0)';
  }

  setTimeout(() => {
    for (const { el } of movers) {
      el.classList.remove('placement-col--collapsing');
      el.style.transition = '';
      el.style.transform = '';
    }
    onDone();
  }, ms);
}

export function startRowSweepAnimation(cols, onDone) {
  pinRowScroll();
  clearSweepExitTimers();
  state.sweepExit = { cols: [...cols], phase: 'wait', onDone };
  document.getElementById('app')?.classList.add('is-sweep-exit');
  render();

  state.sweepExitBeatTimer = setTimeout(() => {
    state.sweepExitBeatTimer = null;
    if (!state.sweepExit) return;
    state.sweepExit.phase = 'run';
    render();
    state.sweepExitDoneTimer = setTimeout(() => {
      state.sweepExitDoneTimer = null;
      commitRowSweepExit();
    }, spd(SWEEP_MS));
  }, spd(BEAT_MS));
}

function commitRowSweepExit() {
  clearSweepExitTimers();
  const se = state.sweepExit;
  if (!se) return;

  const done = se.onDone;
  state.sweepExit = null;
  document.getElementById('app')?.classList.remove('is-sweep-exit');
  render();
  done?.();
}

/** Beat → sweep each run; bank stars → points once at the end. */
export function resolveSweepsAnimated(onDone) {
  const runs = findSweepRuns();
  if (!runs.length) {
    onDone?.();
    return;
  }

  const starsToBank = state.stars;
  let runIndex = 0;

  const finish = () => {
    if (starsToBank > 0) {
      state.points += starsToBank;
      state.stars = 0;
      render();
      bankStarsToPoints(starsToBank, onDone);
    } else {
      onDone?.();
    }
  };

  const next = () => {
    if (runIndex >= runs.length) {
      finish();
      return;
    }
    const run = runs[runIndex++];
    startRowSweepAnimation(run.map(([col]) => col), () => {
      const beforeLeft = captureColLeftPositions();
      applySweepRun(run);
      render();
      animateColumnCollapse(beforeLeft, () => {
        requestAnimationFrame(() => unpinRowScroll());
        next();
      });
    });
  };

  next();
}
