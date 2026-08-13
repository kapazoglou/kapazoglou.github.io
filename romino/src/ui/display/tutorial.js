import { settings, spd } from '../../logic/settings.js';
import { TUTORIAL_DONE_KEY } from './settings-panel.js';
import { getTutorialSteps, hasEarnedStarSinceStart } from './tutorial-steps.js';

const HIGHLIGHT_PAD = 8;
const CARD_GAP = 16;
const GATE_POLL_MS = 120;
const STAR_STEP_TIMEOUT_MS = 60000;

/** @type {ReturnType<typeof getTutorialSteps>} */
let steps = [];
let stepIndex = 0;
let active = false;
let gateTimer = null;
let starStepTimer = null;
let resizeHandler = null;

/** @type {HTMLElement | null} */
let overlay = null;
/** @type {HTMLElement | null} */
let backdrop = null;
/** @type {HTMLElement | null} */
let highlight = null;
/** @type {HTMLElement | null} */
let card = null;
/** @type {HTMLButtonElement | null} */
let skipBtn = null;
/** @type {HTMLButtonElement | null} */
let nextBtn = null;

export function shouldStartTutorial() {
  if (!settings.tutoria) return false;
  try {
    return localStorage.getItem(TUTORIAL_DONE_KEY) !== '1';
  } catch {
    return true;
  }
}

export function isTutorialActive() {
  return active;
}

function markTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_DONE_KEY, '1');
  } catch { /* ignore */ }
}

function destroyTutorial() {
  active = false;
  if (gateTimer) {
    clearInterval(gateTimer);
    gateTimer = null;
  }
  if (starStepTimer) {
    clearTimeout(starStepTimer);
    starStepTimer = null;
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('orientationchange', resizeHandler);
    resizeHandler = null;
  }
  overlay?.remove();
  overlay = null;
  backdrop = null;
  highlight = null;
  card = null;
  skipBtn = null;
  nextBtn = null;
}

function finishTutorial() {
  markTutorialDone();
  destroyTutorial();
}

function currentStep() {
  return steps[stepIndex];
}

function gateMet(step) {
  return step.type !== 'gate' || (step.gate?.() ?? true);
}

function visibleTutorialSteps() {
  return getTutorialSteps().filter(step => !(step.skip?.() ?? false));
}

function advanceStep() {
  if (stepIndex >= steps.length - 1) {
    finishTutorial();
    return;
  }
  stepIndex += 1;
  showStep();
}

function positionHighlight(el) {
  if (!highlight) return;
  if (!el) {
    highlight.hidden = true;
    return;
  }
  highlight.hidden = false;
  const rect = el.getBoundingClientRect();
  highlight.style.top = `${Math.max(0, rect.top - HIGHLIGHT_PAD)}px`;
  highlight.style.left = `${Math.max(0, rect.left - HIGHLIGHT_PAD)}px`;
  highlight.style.width = `${rect.width + HIGHLIGHT_PAD * 2}px`;
  highlight.style.height = `${rect.height + HIGHLIGHT_PAD * 2}px`;
}

function positionCard(step, anchorEl) {
  if (!card) return;

  if (step.centered || !anchorEl) {
    card.style.top = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    return;
  }

  card.style.transform = 'translateX(-50%)';
  const rect = anchorEl.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const below = rect.bottom + CARD_GAP + cardRect.height <= viewportH - 12;
  const top = below
    ? rect.bottom + CARD_GAP
    : Math.max(12, rect.top - CARD_GAP - cardRect.height);
  card.style.top = `${top}px`;
}

function resolveAnchor(step) {
  if (step.centered || !step.anchor) return null;
  if (step.id === 'star-matches' && hasEarnedStarSinceStart()) {
    return document.querySelector('#hud-stars') ?? document.querySelector(step.anchor);
  }
  return document.querySelector(step.anchor);
}

function updateGateUI(step) {
  if (!nextBtn) return;
  const met = gateMet(step);
  nextBtn.disabled = !met;
  nextBtn.classList.toggle('tutorial-btn--hidden', step.type === 'gate' && !met);

  const hintEl = card?.querySelector('.tutorial-card__hint');
  if (hintEl) {
    hintEl.hidden = !(step.type === 'gate' && !met && step.hint);
    hintEl.textContent = step.hint ?? '';
  }
}

function showStep() {
  const step = currentStep();
  if (!step || !overlay || !card) return;

  if (starStepTimer) {
    clearTimeout(starStepTimer);
    starStepTimer = null;
  }

  const counter = card.querySelector('.tutorial-card__counter');
  const title = card.querySelector('.tutorial-card__title');
  const body = card.querySelector('.tutorial-card__body');
  if (counter) counter.textContent = `${stepIndex + 1} / ${steps.length}`;
  if (title) title.textContent = step.title;
  if (body) body.textContent = step.body;

  const isBlocking = step.type === 'info';
  overlay.classList.toggle('is-blocking', isBlocking);
  backdrop.hidden = !isBlocking;

  if (skipBtn) skipBtn.textContent = 'Skip tutorial';
  if (nextBtn) {
    nextBtn.textContent = step.final ? 'Play' : 'Next';
    nextBtn.classList.remove('tutorial-btn--hidden');
    nextBtn.disabled = false;
  }

  const anchorEl = resolveAnchor(step);
  if (step.centered || !anchorEl) {
    highlight.hidden = true;
  } else {
    highlight.hidden = false;
    positionHighlight(anchorEl);
    if (step.id === 'star-matches' && hasEarnedStarSinceStart()) {
      highlight.classList.add('is-pulse');
      setTimeout(() => highlight?.classList.remove('is-pulse'), spd(1200));
    }
  }

  updateGateUI(step);
  requestAnimationFrame(() => positionCard(step, anchorEl));

  if (step.id === 'star-matches') {
    starStepTimer = setTimeout(() => {
      if (!active || currentStep()?.id !== 'star-matches') return;
      const bodyEl = card?.querySelector('.tutorial-card__body');
      if (bodyEl && !hasEarnedStarSinceStart()) {
        bodyEl.textContent = `${step.body} Stars appear when matching dice touch — you’ll see this as you play.`;
      }
    }, STAR_STEP_TIMEOUT_MS);
  }

  if (step.type === 'gate') {
    if (gateTimer) clearInterval(gateTimer);
    gateTimer = setInterval(() => {
      if (!active) return;
      const current = currentStep();
      if (!current || current.type !== 'gate') return;
      updateGateUI(current);
      if (gateMet(current)) {
        clearInterval(gateTimer);
        gateTimer = null;
      }
    }, GATE_POLL_MS);
  } else if (gateTimer) {
    clearInterval(gateTimer);
    gateTimer = null;
  }
}

function refreshLayout() {
  const step = currentStep();
  if (!step || !active) return;
  const anchorEl = resolveAnchor(step);
  if (!step.centered && anchorEl) positionHighlight(anchorEl);
  positionCard(step, anchorEl);
}

function buildDOM() {
  overlay = document.createElement('div');
  overlay.id = 'tutorial-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Tutorial');

  backdrop = document.createElement('div');
  backdrop.className = 'tutorial-backdrop';
  backdrop.hidden = true;

  highlight = document.createElement('div');
  highlight.className = 'tutorial-highlight';
  highlight.hidden = true;

  card = document.createElement('div');
  card.className = 'tutorial-card';
  card.innerHTML = `
    <div class="tutorial-card__counter"></div>
    <div class="tutorial-card__title"></div>
    <div class="tutorial-card__body"></div>
    <div class="tutorial-card__hint" hidden></div>
    <div class="tutorial-card__actions">
      <button type="button" class="tutorial-btn tutorial-btn--ghost" data-tutorial-skip>Skip tutorial</button>
      <button type="button" class="tutorial-btn tutorial-btn--primary" data-tutorial-next>Next</button>
    </div>
  `;

  skipBtn = card.querySelector('[data-tutorial-skip]');
  nextBtn = card.querySelector('[data-tutorial-next]');

  skipBtn?.addEventListener('click', finishTutorial);
  nextBtn?.addEventListener('click', () => {
    const step = currentStep();
    if (step?.type === 'gate' && !gateMet(step)) return;
    advanceStep();
  });

  overlay.append(backdrop, highlight, card);
  document.body.appendChild(overlay);
}

export function onRender() {
  if (!active) return;
  refreshLayout();
}

export function initTutorial() {
  if (active || !shouldStartTutorial()) return;

  steps = visibleTutorialSteps();
  stepIndex = 0;
  active = true;

  buildDOM();
  showStep();

  resizeHandler = () => refreshLayout();
  window.addEventListener('resize', resizeHandler);
  window.addEventListener('orientationchange', resizeHandler);
}
