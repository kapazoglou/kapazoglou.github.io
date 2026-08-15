import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { isDominoSpotsActive, getDominoKeyForCol, getRowDominoSpotCols } from '../../logic/domino-spots.js';
import {
  parseDominoKey,
  getDominoDiscardKeys,
  isDominoHandMode,
  isDominoHandLocked,
  isDominoHandPreviewActive,
} from '../../logic/domino-roll.js';
import { dominoStackHTML, DOMINO_SPOT_DIE } from '../../logic/dice-visual.js';
import { isDominoDeckInActionBar } from '../../logic/deck-size.js';
import { spreadColumnElement } from './flank-stacks.js';
import { COL_SPREAD_MS, TRAY_STAGGER_MS } from '../transitions/timing.js';

let scrollBound = false;
let motionRaf = 0;
let motionDeadline = 0;
let layoutRaf = 0;
let lastStripRenderKey = '';
let lastDiscardRenderKey = '';
let lastDiscardMode = '';

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
    if (!strip.querySelector('.domino-spot-stack-wrap[data-col]')
      && !strip.querySelector('.domino-discard-pile')) {
      strip.innerHTML = '';
    }
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
  const poolLow = (isDominoSpotsActive() || isDominoDeckInActionBar()) && (state.deckRemaining ?? 0) < 2;
  badge.classList.toggle('action-bar-deck-badge--low', poolLow);
  syncDominoSpotsVisibility();
}

export function toggleDominoSpotsVisibility() {
  state.dominoSpotsVisible = !state.dominoSpotsVisible;
  syncDominoSpotsVisibility();
}

export function syncDominoSpotsVisibility() {
  const strip = document.getElementById('domino-spot-strip');
  const badge = document.getElementById('action-bar-deck');
  const pile = strip?.querySelector('.domino-discard-pile');
  const hidden = !state.dominoSpotsVisible;
  strip?.classList.toggle('is-spots-hidden', hidden);
  badge?.classList.toggle('is-spots-hidden', hidden);
  badge?.setAttribute('aria-pressed', hidden ? 'true' : 'false');
  // nRoll=1 hand ignores spot toggle; nRoll>1 discard pile follows deck-badge visibility
  pile?.classList.toggle('domino-discard-pile--spots-suppressed', hidden && !isDominoHandMode());
}

/** Seam-row deck badge — same Y as domino spots; X centred over roll-button die. */
export function positionActionBarDeck() {
  const badge = document.getElementById('action-bar-deck');
  const strip = document.getElementById('domino-spot-strip');
  const inner = document.querySelector('.placement-row-inner');
  const bar = document.getElementById('action-bar');
  if (!strip || !bar) {
    positionDominoDiscardPile();
    return;
  }

  if (badge && inner) {
    const colNode = inner.querySelector('.placement-col');
    if (!colNode) {
      badge.classList.remove('is-positioned');
    } else {
      const scale = viewportScale();
      const stripRect = strip.getBoundingClientRect();
      const colRect = colNode.getBoundingClientRect();
      if (!colRect.width) {
        badge.classList.remove('is-positioned');
      } else {
        const gap = toDesignPx(stripRect.top - colRect.bottom, scale);
        const offsetY = dominoSeamOffsetY(gap);
        const centerY = -offsetY + DOMINO_SPOT_DIE / 2;

        const rollWrap = bar.querySelector('.roll-btn-wrap');
        let centerX;
        if (rollWrap) {
          const wrapRect = rollWrap.getBoundingClientRect();
          centerX = toDesignPx(wrapRect.right - stripRect.left, scale) - 36;
        } else {
          centerX = toDesignPx(stripRect.width, scale) - 36;
        }

        badge.style.left = `${centerX}px`;
        badge.style.top = `${centerY}px`;
        badge.classList.add('is-positioned');
      }
    }
  }

  positionDominoDiscardPile();
}

function ensureDominoDiscardPileShell(strip) {
  const inner = ensureStripInner(strip);
  let pile = strip.querySelector('.domino-discard-pile');
  if (!pile) {
    pile = document.createElement('div');
    pile.className = 'domino-discard-pile';
    pile.innerHTML = '<div class="domino-discard-pile-scroll"><div class="domino-discard-pile-row"></div></div>';
    inner.appendChild(pile);
  }
  return pile;
}

/** Discard pile — horizontal LTR row under roll button, vertically centred in band below roll wrap. */
export function renderDominoDiscardPile() {
  const strip = document.getElementById('domino-spot-strip');
  if (!strip) return;

  const mode = isDominoHandMode() ? 'hand' : isDominoSpotsActive() ? 'spots' : 'none';
  if (mode !== lastDiscardMode) {
    lastDiscardRenderKey = '';
    lastDiscardMode = mode;
  }

  if (isDominoHandMode()) {
    renderDominoHand(strip);
    syncDominoSpotsVisibility();
    return;
  }

  if (!isDominoSpotsActive()) {
    strip.querySelector('.domino-discard-pile')?.remove();
    lastDiscardRenderKey = '';
    return;
  }

  const keys = getDominoDiscardKeys();
  const sig = keys.join('|');
  const pile = ensureDominoDiscardPileShell(strip);
  pile.classList.remove('domino-discard-pile--hand');
  const row = pile.querySelector('.domino-discard-pile-row');

  if (!keys.length) {
    row.innerHTML = '';
    lastDiscardRenderKey = '';
    positionDominoDiscardPile({ reveal: false });
    return;
  }

  if (sig === lastDiscardRenderKey) {
    positionDominoDiscardPile({ reveal: true });
    return;
  }

  const firstShow = !pile.classList.contains('is-positioned');
  if (firstShow) pile.classList.remove('is-positioned');

  row.innerHTML = keys.map((key, i) => {
    const values = parseDominoKey(key);
    return dominoStackHTML(values, {
      orientation: 'horizontal',
      attrs: ` data-discard-index="${i}"`,
    });
  }).join('');

  positionDominoDiscardPile({ reveal: false });
  positionDominoDiscardPile({ reveal: true });
  lastDiscardRenderKey = sig;
  syncDominoSpotsVisibility();
}

function dominoHandRenderKey() {
  const sel = state.dominoHandPreviewKey ?? 'none';
  return `hand:${state.dominoHandKeys.join('|')}|${sel}|${state.dominoHandLocked ? 1 : 0}`;
}

/** nRoll=1 hand — reuse discard-row band; discards hidden. */
function renderDominoHand(strip) {
  const keys = state.dominoHandKeys;
  const sig = dominoHandRenderKey();
  const pile = ensureDominoDiscardPileShell(strip);
  pile.classList.add('domino-discard-pile--hand');
  pile.classList.toggle('domino-discard-pile--locked', isDominoHandLocked());
  pile.classList.toggle('domino-discard-pile--preview', isDominoHandPreviewActive());
  const row = pile.querySelector('.domino-discard-pile-row');

  if (!keys.length) {
    row.innerHTML = '';
    lastDiscardRenderKey = '';
    positionDominoDiscardPile({ reveal: false });
    return;
  }

  if (sig === lastDiscardRenderKey) {
    positionDominoDiscardPile({ reveal: true });
    return;
  }

  const firstShow = !pile.classList.contains('is-positioned');
  if (firstShow) pile.classList.remove('is-positioned');

  row.innerHTML = keys.map((key, i) => {
    const values = parseDominoKey(key);
    const selected = state.dominoHandPreviewKey === key;
    const isNew = state.newDominoHandKeys.has(key);
    let stackStyleVars = '';
    if (isNew) {
      const newIndex = keys.slice(0, i).filter(k => state.newDominoHandKeys.has(k)).length;
      stackStyleVars = `--hand-enter-delay:${spd(newIndex * TRAY_STAGGER_MS)}ms`;
    }
    return dominoStackHTML(values, {
      orientation: 'horizontal',
      isNew,
      stackStyleVars,
      attrs: ` data-hand-index="${i}" role="button" tabindex="0" aria-pressed="${selected ? 'true' : 'false'}"`,
      stackClassExtra: selected ? 'domino-hand-stack--selected' : '',
    });
  }).join('');

  state.newDominoHandKeys.clear();

  scheduleDominoDiscardPileReveal();
  lastDiscardRenderKey = sig;
}

function scheduleDominoDiscardPileReveal() {
  positionDominoDiscardPile({ reveal: false });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      positionDominoDiscardPile({ reveal: true });
    });
  });
}

export function positionDominoDiscardPile({ reveal = true } = {}) {
  const pile = document.querySelector('.domino-discard-pile');
  const strip = document.getElementById('domino-spot-strip');
  const bar = document.getElementById('action-bar');
  if (!pile || !strip || !bar) return;

  const rollWrap = bar.querySelector('.roll-btn-wrap');
  if (!rollWrap) {
    pile.classList.remove('is-positioned');
    return;
  }

  const scale = viewportScale();
  const stripRect = strip.getBoundingClientRect();
  const rollWrapRect = rollWrap.getBoundingClientRect();
  const viewportInner = document.querySelector('.viewport-inner');
  const viewportBottom = viewportInner?.getBoundingClientRect().bottom ?? document.documentElement.clientHeight;

  const top = toDesignPx(rollWrapRect.bottom - stripRect.top, scale);
  const height = toDesignPx(viewportBottom - rollWrapRect.bottom, scale);

  const bandHeight = Math.max(0, height);
  const row = pile.querySelector('.domino-discard-pile-row');
  const rowRect = row?.getBoundingClientRect();
  const rowHeightDesign = rowRect?.height
    ? toDesignPx(rowRect.height, scale)
    : DOMINO_SPOT_DIE;
  const fits = rowHeightDesign <= bandHeight;
  const margin = fits
    ? Math.max(0, (bandHeight - rowHeightDesign) / 2)
    : 0;

  pile.style.top = `${top}px`;
  pile.style.height = `${bandHeight}px`;
  pile.style.left = '0';
  pile.style.width = `${toDesignPx(stripRect.width, scale)}px`;
  pile.style.paddingTop = `${margin}px`;
  pile.style.paddingBottom = `${margin}px`;
  pile.style.paddingLeft = `${margin}px`;
  pile.style.paddingRight = `${margin}px`;
  pile.style.boxSizing = 'border-box';
  pile.classList.toggle('is-overflowing', !fits);
  const hasContent = Boolean(row?.children.length);
  if (reveal && hasContent) pile.classList.add('is-positioned');
  else pile.classList.remove('is-positioned');
}

function stripSignature() {
  return getRowDominoSpotCols().map(col => `${col}:${getDominoKeyForCol(col) ?? ''}`).join('|');
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

/** Hide seam domino for a spot col during sole-die drag — DOM class only, no strip rebuild. */
export function setDominoSpotStackDragSuppressed(col, suppressed) {
  if (!isDominoSpotsActive()) return false;
  if (!state.dominoSpotCols.includes(col) || !getDominoKeyForCol(col)) return false;

  const strip = document.getElementById('domino-spot-strip');
  if (!strip) return false;
  const el = strip.querySelector(`.domino-spot-stack-wrap[data-col="${col}"]`);
  if (!el) return false;

  el.classList.toggle('is-drag-suppressed', suppressed);
  return true;
}

export function renderDominoSpotStrip() {
  const strip = document.getElementById('domino-spot-strip');
  if (!strip) return;

  const spotCols = getRowDominoSpotCols();
  const active = isDominoSpotsActive() && spotCols.length > 0;
  strip.setAttribute('aria-hidden', active ? 'false' : 'true');

  if (!active) {
    strip.querySelectorAll('.domino-spot-stack-wrap[data-col]').forEach(el => el.remove());
    lastStripRenderKey = '';
    renderActionBarDeckBadge();
    renderDominoDiscardPile();
    return;
  }

  const key = stripRenderKey();
  if (key !== lastStripRenderKey) {
    lastStripRenderKey = key;
    const inner = ensureStripInner(strip);
    inner.querySelectorAll('.domino-spot-stack-wrap[data-col]').forEach(el => el.remove());

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

    const temp = document.createElement('div');
    temp.innerHTML = stacksHTML;
    const insertBefore = inner.querySelector('.domino-discard-pile')
      ?? inner.querySelector('#action-bar-deck');
    while (temp.firstChild) {
      inner.insertBefore(temp.firstChild, insertBefore);
    }
    state.newDominoSpotCols.clear();
    renderActionBarDeckBadge();
  }
  syncDominoSpotsVisibility();
}

function syncDominoSpotUnderDiceOpacity(strip) {
  const nRoll1Hand = isDominoHandMode();
  strip.classList.toggle('domino-spot-strip--nroll1-hand', nRoll1Hand);
  if (!nRoll1Hand) {
    strip.querySelectorAll('.domino-spot-stack-wrap--under-dice').forEach(el => {
      el.classList.remove('domino-spot-stack-wrap--under-dice');
    });
    return;
  }

  for (const el of strip.querySelectorAll('.domino-spot-stack-wrap[data-col]')) {
    const col = Number(el.dataset.col);
    const column = state.row[col];
    const underDice = column?.kind === 'stack' && column.dice.length > 0;
    el.classList.toggle('domino-spot-stack-wrap--under-dice', underDice);
  }
}

export function positionDominoSpotStrip() {
  const strip = document.getElementById('domino-spot-strip');
  const inner = document.querySelector('.placement-row-inner');
  if (!strip || !inner) {
    positionActionBarDeck();
    positionDominoDiscardPile();
    return false;
  }

  let stripInner = strip.querySelector('.domino-spot-strip-inner');
  if (!stripInner && isDominoDeckInActionBar()) {
    renderActionBarDeckBadge();
    stripInner = strip.querySelector('.domino-spot-strip-inner');
  }
  if (!stripInner) {
    positionActionBarDeck();
    positionDominoDiscardPile();
    return false;
  }

  const scale = viewportScale();
  const stripRect = strip.getBoundingClientRect();
  let positioned = false;

  for (const el of stripInner.querySelectorAll('.domino-spot-stack-wrap[data-col]')) {
    if (el.classList.contains('is-drag-suppressed')) continue;
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

  syncDominoSpotUnderDiceOpacity(strip);
  positionActionBarDeck();
  positionDominoDiscardPile();
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
