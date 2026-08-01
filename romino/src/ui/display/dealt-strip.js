import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { tileHTML, SUIT_COLOR } from '../../logic/dice-visual.js';
import { stripTileHasRowDuplicate, pairSweepStripTile, getRowColForIdentity, sortedDealtStrip } from '../../logic/dealt-strip.js';
import { spd } from '../../logic/settings.js';
import { BEAT_MS, SWEEP_MS } from '../transitions/timing.js';
import { render } from './render.js';

let pairSweepBeatTimer = null;
let pairSweepDoneTimer = null;

function clearPairSweepTimers() {
  if (pairSweepBeatTimer) clearTimeout(pairSweepBeatTimer);
  if (pairSweepDoneTimer) clearTimeout(pairSweepDoneTimer);
  pairSweepBeatTimer = null;
  pairSweepDoneTimer = null;
}

function stripSweepExitOrder(tile, pairExit) {
  const se = state.sweepExit;
  const rowStripIdx = se?.stripIds?.indexOf(tile.stripId) ?? -1;
  if (rowStripIdx >= 0) return rowStripIdx;
  if (pairExit?.stripId === tile.stripId) return 0;
  return null;
}

function stripSweepClasses(tile, pairExit) {
  const se = state.sweepExit;
  const rowStripIdx = se?.stripIds?.indexOf(tile.stripId) ?? -1;
  if (rowStripIdx >= 0) {
    if (se.phase === 'wait') return ['dealt-strip-tile--sweep-pending'];
    if (se.phase === 'run') return ['dealt-strip-tile--sweep-run'];
  }
  if (pairExit?.stripId === tile.stripId) {
    if (pairExit.phase === 'wait') return ['dealt-strip-tile--sweep-pending'];
    if (pairExit.phase === 'run') return ['dealt-strip-tile--sweep-run'];
  }
  return [];
}

export function renderDealtStrip() {
  const strip = document.getElementById('dealt-strip');
  if (!strip) return;

  const active = settings.tileDealtEvery > 0 && !settings.deckFlank;
  strip.setAttribute('aria-hidden', active && state.dealtStrip.length ? 'false' : 'true');

  if (!active || !state.dealtStrip.length) {
    strip.innerHTML = '';
    return;
  }

  const pairExit = state.pairSweepExit;
  const tilesHTML = sortedDealtStrip().map(tile => {
    const accent = stripTileHasRowDuplicate(tile.stripId);
    const warning = state.dealtStripWarningIds.has(tile.stripId);
    const isNew = state.newDealtStripIds.has(tile.stripId);
    const exitOrder = stripSweepExitOrder(tile, pairExit);
    const suitBg = SUIT_COLOR[tile.suit] ?? '#404A59';
    const styleVars = exitOrder != null
      ? `--strip-tile-bg:${suitBg};--exit-order:${exitOrder}`
      : `--strip-tile-bg:${suitBg}`;
    const classExtra = [
      'dealt-strip-tile',
      accent ? 'dealt-strip-tile--accent' : '',
      warning ? 'dealt-strip-tile--warning' : '',
      ...stripSweepClasses(tile, pairExit),
    ].filter(Boolean).join(' ');
    return tileHTML(tile, {
      classExtra,
      isNew,
      stripFace: true,
      styleVars,
      attrs: ` data-strip-id="${tile.stripId}"`,
    });
  }).join('');

  state.newDealtStripIds.clear();

  strip.innerHTML = `<div class="dealt-strip-inner">${tilesHTML}</div>`;
}

/** Accent tap: sweep strip tile + matching row tile without scoring. */
export function startPairSweepAnimation(stripId) {
  if (state.phase === 'animating' || state.pairSweepExit || state.sweepExit) return false;
  if (!stripTileHasRowDuplicate(stripId)) return false;

  const tile = state.dealtStrip.find(t => t.stripId === stripId);
  const rowCol = tile ? getRowColForIdentity(tile.suit, tile.rank) : null;
  if (rowCol == null) return false;

  clearPairSweepTimers();
  const prevPhase = state.phase;
  state.pairSweepExit = { stripId, rowCol, phase: 'wait', prevPhase };
  state.phase = 'animating';
  document.getElementById('app')?.classList.add('is-sweep-exit');
  render();

  pairSweepBeatTimer = setTimeout(() => {
    pairSweepBeatTimer = null;
    if (!state.pairSweepExit) return;
    state.pairSweepExit.phase = 'run';
    render();
    pairSweepDoneTimer = setTimeout(() => {
      pairSweepDoneTimer = null;
      pairSweepStripTile(stripId);
      state.pairSweepExit = null;
      state.phase = prevPhase;
      document.getElementById('app')?.classList.remove('is-sweep-exit');
      render();
    }, spd(SWEEP_MS));
  }, spd(BEAT_MS));

  return true;
}
