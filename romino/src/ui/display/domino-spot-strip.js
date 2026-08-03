import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { isDominoSpotsActive, getDominoKeyForCol, getActiveDominoSpotCols } from '../../logic/domino-spots.js';
import { parseDominoKey } from '../../logic/domino-roll.js';
import { dominoStackHTML, DOMINO_SPOT_DIE } from '../../logic/dice-visual.js';
import { isDominoDeckInActionBar } from '../../logic/deck-size.js';
import { spreadColumnElement } from './flank-stacks.js';
import { COL_SPREAD_MS } from '../transitions/timing.js';

let scrollBound = false;
let motionRaf = 0;
let motionDeadline = 0;
let layoutRaf = 0;
let lastStripRenderKey = '';

function viewportScale() {
  const root = document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function toDesignPx(screenPx, scale) {
  return screenPx / scale;
}

function dominoSeamOffsetY(gapDesignPx) {
  const die = DOMINO_SPOT_DIE;
  if (gapDesignPx <= 0) return die;
  return (gapDesignPx + die) / 2;
}

function ensureStripInner(strip) {
  let inner = strip.querySelector('.domino-spot-strip-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'domino-spot-strip-inner';
    strip.appendChild(inner);
  }
  return inner;
}

/** nRoll=4 domino deck counter — lives on seam strip (not action-bar; avoids overflow clip). */
export function renderActionBarDeckBadge() {
  const strip = document.getElementById('domino-spot-strip');
  if (!strip) return;

  if (!isDominoDeckInActionBar()) {
    strip.querySelector('#action-bar-deck')?.remove();
    if (!strip.querySelector('.domino-spot-stack-wrap')) strip.innerHTML = '';
    return;
  }

  const inner = ensureStripInner(strip);
  let badge = strip.querySelector('#action-bar-deck');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'action-bar-deck';
    badge.className = 'action-bar-deck-badge';
    badge.setAttribute('role', 'button');
    badge.setAttribute('aria-label', 'Deck remaining');
    inner.appendChild(badge);
  } else if (badge.parentElement !== inner) {
    inner.appendChild(badge);
  }
  badge.textContent = state.deckRemaining != null ? String(state.deckRemaining) : '';
  syncDominoSpotsVisibility();
}

export function toggleDominoSpotsVisibility() {
  state.dominoSpotsVisible = !state.dominoSpotsVisible;
  syncDominoSpotsVisibility();
}

export function syncDominoSpotsVisibility() {
  const strip = document.getElementById('domino-spot-strip');
  const badge = document.getElementById('action-bar-deck');
  const hidden = !state.dominoSpotsVisible;
  strip?.classList.toggle('is-spots-hidden', hidden);
  badge?.classList.toggle('is-spots-hidden', hidden);
  badge?.setAttribute('aria-pressed', hidden ? 'true' : 'false');
}

/** Seam-row deck badge — same Y as domino spots; X centred over roll-button die. */
export function positionActionBarDeck() {
  const badge = document.getElementById('action-bar-deck');
  const strip = document.getElementById('domino-spot-strip');
  const inner = document.querySelector('.placement-row-inner');
  const bar = document.getElementById('action-bar');
  if (!badge || !strip || !inner || !bar) return;

  const colNode = inner.querySelector('.placement-col');
  if (!colNode) {
    badge.classList.remove('is-positioned');
    return;
  }

  const scale = viewportScale();
  const stripRect = strip.getBoundingClientRect();
  const colRect = colNode.getBoundingClientRect();
  if (!colRect.width) {
    badge.classList.remove('is-positioned');
    return;
  }

  const gap = toDesignPx(stripRect.top - colRect.bottom, scale);
  const offsetY = dominoSeamOffsetY(gap);
  const centerY = -offsetY + DOMINO_SPOT_DIE / 2;

  const rollFace = bar.querySelector('.roll-btn-face');
  let centerX;
  if (rollFace) {
    const faceRect = rollFace.getBoundingClientRect();
    centerX = toDesignPx(faceRect.left + faceRect.width / 2 - stripRect.left, scale);
  } else {
    centerX = toDesignPx(stripRect.width, scale) - 36;
  }

  badge.style.left = `${centerX}px`;
  badge.style.top = `${centerY}px`;
  badge.classList.add('is-positioned');
}

function stripSignature() {
  return getActiveDominoSpotCols().map(col => `${col}:${getDominoKeyForCol(col) ?? ''}`).join('|');
}

function stripRenderKey() {
  const se = state.sweepExit;
  const pe = state.pairSweepExit;
  const sweep = se
    ? `se:${se.phase}:${se.cols.join(',')}`
    : pe
      ? `pe:${pe.phase}:${pe.rowCol}`
      : '';
  return `${stripSignature()}|${sweep}`;
}

function dominoSpotSweepExitOrder(col) {
  const se = state.sweepExit;
  const idx = se?.cols.indexOf(col) ?? -1;
  if (idx >= 0) return idx;
  if (state.pairSweepExit?.rowCol === col) return 0;
  return null;
}

function dominoSpotSweepClasses(col) {
  const se = state.sweepExit;
  if (se?.cols.includes(col)) {
    if (se.phase === 'wait') return 'domino-spot-stack--sweep-pending';
    if (se.phase === 'run') return 'domino-spot-stack--sweep-run';
  }
  const pairExit = state.pairSweepExit;
  if (pairExit?.rowCol === col) {
    if (pairExit.phase === 'wait') return 'domino-spot-stack--sweep-pending';
    if (pairExit.phase === 'run') return 'domino-spot-stack--sweep-run';
  }
  return '';
}

export function renderDominoSpotStrip() {
  const strip = document.getElementById('domino-spot-strip');
  if (!strip) return;

  const spotCols = getActiveDominoSpotCols();
  const active = isDominoSpotsActive() && spotCols.length > 0;
  strip.setAttribute('aria-hidden', active ? 'false' : 'true');

  if (!active) {
    strip.querySelectorAll('.domino-spot-stack-wrap').forEach(el => el.remove());
    lastStripRenderKey = '';
    renderActionBarDeckBadge();
    return;
  }

  const key = stripRenderKey();
  if (key !== lastStripRenderKey) {
    lastStripRenderKey = key;
    const stacksHTML = spotCols.map(col => {
      const dominoKey = getDominoKeyForCol(col);
      if (!dominoKey) return '';
      const values = parseDominoKey(dominoKey);
      const isNew = state.newDominoSpotCols.has(col);
      const exitOrder = dominoSpotSweepExitOrder(col);
      const stackStyleVars = exitOrder != null ? `--exit-order:${exitOrder}` : '';
      const stackClassExtra = dominoSpotSweepClasses(col);
      return dominoStackHTML(values, { col, isNew, stackClassExtra, stackStyleVars });
    }).filter(Boolean).join('');

    strip.innerHTML = `<div class="domino-spot-strip-inner">${stacksHTML}</div>`;
    state.newDominoSpotCols.clear();
    renderActionBarDeckBadge();
  }
  syncDominoSpotsVisibility();
}

export function positionDominoSpotStrip() {
  const strip = document.getElementById('domino-spot-strip');
  const inner = document.querySelector('.placement-row-inner');
  if (!strip || !inner) {
    positionActionBarDeck();
    return false;
  }

  let stripInner = strip.querySelector('.domino-spot-strip-inner');
  if (!stripInner && isDominoDeckInActionBar()) {
    renderActionBarDeckBadge();
    stripInner = strip.querySelector('.domino-spot-strip-inner');
  }
  if (!stripInner) {
    positionActionBarDeck();
    return false;
  }

  const scale = viewportScale();
  const stripRect = strip.getBoundingClientRect();
  let positioned = false;

  for (const el of stripInner.querySelectorAll('.domino-spot-stack-wrap[data-col]')) {
    const col = Number(el.dataset.col);
    const colNode = spreadColumnElement(inner, col);
    if (!colNode) {
      el.classList.remove('is-positioned');
      continue;
    }

    const colRect = colNode.getBoundingClientRect();
    if (!colRect.width) {
      el.classList.remove('is-positioned');
      continue;
    }

    const cx = toDesignPx((colRect.left + colRect.right) / 2 - stripRect.left, scale);
    const gap = toDesignPx(stripRect.top - colRect.bottom, scale);
    el.style.left = `${cx}px`;
    el.style.setProperty('--domino-seam-offset', `${dominoSeamOffsetY(gap)}px`);
    el.classList.add('is-positioned');
    positioned = true;
  }

  positionActionBarDeck();
  return positioned;
}

/** Wait for row layout + scroll restore before revealing seam domino positions. */
export function scheduleDominoSpotStripLayout() {
  if (layoutRaf) cancelAnimationFrame(layoutRaf);
  layoutRaf = requestAnimationFrame(() => {
    layoutRaf = requestAnimationFrame(() => {
      layoutRaf = 0;
      positionDominoSpotStrip();
    });
  });
}

/** rAF loop — domino stacks track live column layout while columns transform-animate. */
export function syncDominoSpotStripDuringMotion(extraMs = 0) {
  motionDeadline = Math.max(motionDeadline, performance.now() + spd(COL_SPREAD_MS) + extraMs);
  if (motionRaf) return;

  const tick = now => {
    positionDominoSpotStrip();
    if (now < motionDeadline) {
      motionRaf = requestAnimationFrame(tick);
    } else {
      motionRaf = 0;
      positionDominoSpotStrip();
    }
  };
  motionRaf = requestAnimationFrame(tick);
}

export function initDominoSpotStrip() {
  if (scrollBound) return;
  const row = document.getElementById('placement-row');
  if (!row) return;
  row.addEventListener('scroll', () => positionDominoSpotStrip(), { passive: true });
  scrollBound = true;
}
