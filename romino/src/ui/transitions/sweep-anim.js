import { state, clearSweepExitTimers } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { SUIT_COLOR } from '../../logic/dice-visual.js';
import { findSweepRuns, applySweepRun, sweepStarMultiplierForRun, checkFlankWellDone } from '../../logic/sweeps-row.js';
import { clearDealtStrip, sortedDealtStrip } from '../../logic/dealt-strip.js';
import { flankSideForSweepCol, popFlankStack } from '../../logic/deck-flank.js';
import {
  beginBankCycle,
  recordSweepRun,
  commitBankCycle,
  cancelBankCycle,
} from '../../logic/game-log.js';
import { syncDominoSpotStripDuringMotion, scheduleDominoSpotStripLayout } from '../display/domino-spot-strip.js';
import { render } from '../display/render.js';
import { pinRowScroll, unpinRowScroll } from '../display/placement-row.js';
import { bankStarsToPoints } from './pip-anim.js';
import {
  buildRankCubeNode,
  positionOverlayOnDie,
  captureElementFlyStart,
  animateCubeDiceArcFlyFromStarts,
  flyLayer,
  viewportScale,
  rollBtnTargetXY,
} from './cube-fly.js';
import {
  BEAT_MS,
  SWEEP_MS,
  COL_COLLAPSE_MS,
  CONVERT_MS,
  CONVERT_FLY_STAGGER_MS,
  CUBE_REPLACE_MS,
  CUBE_FLY_SCALE_MS,
  CUBE_FLY_ARC_MS,
} from './timing.js';

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

  syncDominoSpotStripDuringMotion(COL_COLLAPSE_MS);

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
    scheduleDominoSpotStripLayout();
    onDone();
  }, ms);
}

function sweepCubePreludeDuration(colCount) {
  const stagger = spd(CONVERT_FLY_STAGGER_MS);
  const reveal = spd(CUBE_REPLACE_MS);
  const fly = spd(CUBE_FLY_SCALE_MS) + spd(CUBE_FLY_ARC_MS);
  const maxOrder = Math.max(0, colCount - 1);
  return maxOrder * stagger + reveal + fly;
}

/** Dice & Cubes: suit cube fade on bottom die, then arc fly to roll button (no render during). */
function animateSweepCubePrelude(cols, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  const layer = flyLayer();
  if (!inner || !layer || !cols.length) {
    onDone();
    return;
  }

  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const target = rollBtnTargetXY(layerRect, scale);
  const staggerMs = spd(CONVERT_FLY_STAGGER_MS);
  const revealMs = spd(CUBE_REPLACE_MS);
  const overlays = [];

  cols.forEach((col, exitOrder) => {
    const colNode = inner.querySelector(`.placement-col[data-col="${col}"]`);
    const tile = state.row[col];
    if (!colNode || !tile || tile.kind !== 'tile') return;

    const tileCube = colNode.querySelector('.placement-tile-cube');
    const suitDie = tileCube?.querySelector('.suit-die');
    if (!tileCube || !suitDie) return;

    tileCube.classList.add('placement-tile-cube--sweep-prelude');

    const suitColor = SUIT_COLOR[tile.suit] ?? '#404A59';
    const suitCube = buildRankCubeNode(tile.suit, { muted: false });
    suitCube.style.setProperty('--cube-suit-color', suitColor);

    const overlay = document.createElement('div');
    overlay.className = 'cube-convert-rank-overlay';
    overlay.appendChild(suitCube);
    tileCube.appendChild(overlay);
    positionOverlayOnDie(overlay, suitDie, tileCube, scale);
    overlays.push({ overlay, tileCube });

    setTimeout(() => {
      if (!state.sweepExit) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          suitCube.classList.add('cube-convert-rank--revealed');
        });
      });

      setTimeout(() => {
        if (!state.sweepExit) return;

        const flyStart = captureElementFlyStart(suitDie, layer, scale);
        suitCube.classList.remove('cube-convert-rank');
        suitCube.classList.add('cube-sweep-suit-cube');
        overlay.removeChild(suitCube);
        tileCube.replaceChild(suitCube, suitDie);
        overlay.remove();

        state.sweepExit.suitFlownCols.add(col);

        animateCubeDiceArcFlyFromStarts(
          [{ value: tile.bottomValue, ...flyStart }],
          layer,
          target,
          { flyerClass: 'placement-die-flyer--cube-convert' },
        );
      }, revealMs);
    }, exitOrder * staggerMs);
  });

  state.sweepExitPreludeTimer = setTimeout(() => {
    state.sweepExitPreludeTimer = null;
    overlays.forEach(({ overlay, tileCube }) => {
      overlay.remove();
      tileCube.classList.remove('placement-tile-cube--sweep-prelude');
    });
    onDone();
  }, sweepCubePreludeDuration(cols.length));
}

function beginSweepRunPhase() {
  if (!state.sweepExit) return;
  state.sweepExit.phase = 'run';
  render();
  state.sweepExitDoneTimer = setTimeout(() => {
    state.sweepExitDoneTimer = null;
    commitRowSweepExit();
  }, spd(SWEEP_MS));
}

export function startRowSweepAnimation(cols, onDone) {
  pinRowScroll();
  clearSweepExitTimers();
  const flankSides = cols.map(col => flankSideForSweepCol(col)).filter(Boolean);
  const stripIds = sortedDealtStrip().map(t => t.stripId);
  state.sweepExit = {
    cols: [...cols],
    flankSides,
    stripIds,
    phase: 'wait',
    suitFlownCols: new Set(),
    onDone,
  };
  document.getElementById('app')?.classList.add('is-sweep-exit');
  render();

  state.sweepExitBeatTimer = setTimeout(() => {
    state.sweepExitBeatTimer = null;
    if (!state.sweepExit) return;
    if (settings.diceAndCubes) {
      animateSweepCubePrelude(state.sweepExit.cols, beginSweepRunPhase);
    } else {
      beginSweepRunPhase();
    }
  }, spd(BEAT_MS));
}

function commitRowSweepExit() {
  clearSweepExitTimers();
  const se = state.sweepExit;
  if (!se) return;

  const done = se.onDone;
  state.sweepExit = null;
  document.getElementById('app')?.classList.remove('is-sweep-exit');
  done?.();
}

function finishFlankStackSweep() {
  clearSweepExitTimers();
  const se = state.sweepExit;
  if (!se) return;

  const done = se.onDone;
  const flankSides = se.flankSides ?? [];
  state.sweepExit = null;
  document.getElementById('app')?.classList.remove('is-sweep-exit');

  /** @type {'well-done' | null} */
  let result = null;
  for (const side of flankSides) {
    if (popFlankStack(side) === 'well-done') result = 'well-done';
  }
  for (const side of flankSides) {
    state.newFlankSides.add(side);
  }
  render();
  setTimeout(() => {
    for (const side of flankSides) state.newFlankSides.delete(side);
    render();
    requestAnimationFrame(() => unpinRowScroll());
    done?.(result);
  }, spd(CONVERT_MS));
}

/** Sweep-exit animation for flank stack tops (convert-match discard). */
export function animateFlankStackSweep(flankSides, onDone) {
  if (!flankSides.length) {
    onDone?.(null);
    return;
  }
  pinRowScroll();
  clearSweepExitTimers();
  state.sweepExit = { cols: [], flankSides: [...flankSides], phase: 'wait', onDone };
  document.getElementById('app')?.classList.add('is-sweep-exit');
  render();

  state.sweepExitBeatTimer = setTimeout(() => {
    state.sweepExitBeatTimer = null;
    if (!state.sweepExit) return;
    state.sweepExit.phase = 'run';
    render();
    state.sweepExitDoneTimer = setTimeout(() => {
      state.sweepExitDoneTimer = null;
      finishFlankStackSweep();
    }, spd(SWEEP_MS));
  }, spd(BEAT_MS));
}

/** Beat → sweep each run; re-scan after every apply so chain sweeps are not missed. */
export function resolveSweepsAnimated(onDone) {
  const starsToBank = state.stars;
  let totalMult = 0;
  let anySwept = false;
  beginBankCycle(starsToBank);

  const finish = (result = null) => {
    if (anySwept) {
      commitBankCycle(totalMult, starsToBank);
      if (starsToBank > 0) {
        state.points += starsToBank * totalMult;
        state.stars = 0;
        bankStarsToPoints(starsToBank, totalMult, () => onDone?.(result));
      } else {
        onDone?.(result);
      }
    } else {
      cancelBankCycle();
      onDone?.(result);
    }
  };

  const next = () => {
    const runs = findSweepRuns();
    if (!runs.length) {
      finish(checkFlankWellDone());
      return;
    }
    const run = runs[0];
    startRowSweepAnimation(run.map(([col]) => col), () => {
      clearDealtStrip();
      const beforeLeft = captureColLeftPositions();
      const flankRevealed = run.map(([col]) => flankSideForSweepCol(col)).filter(Boolean);
      const tiles = run.map(([, t]) => t);
      const mult = sweepStarMultiplierForRun(tiles);
      applySweepRun(run);
      for (const side of flankRevealed) {
        state.newFlankSides.add(side);
      }
      recordSweepRun(tiles, mult);
      anySwept = true;
      totalMult += mult;
      const wellDone = checkFlankWellDone();
      render();
      if (flankRevealed.length) {
        setTimeout(() => {
          for (const side of flankRevealed) state.newFlankSides.delete(side);
          render();
        }, spd(CONVERT_MS));
      }
      animateColumnCollapse(beforeLeft, () => {
        requestAnimationFrame(() => unpinRowScroll());
        if (wellDone) {
          finish('well-done');
          return;
        }
        next();
      });
    });
  };

  next();
}
