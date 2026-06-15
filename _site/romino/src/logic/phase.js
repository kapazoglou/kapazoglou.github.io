import { state, forbiddenDieSlots, clearScoreExitTimers } from './state.js';
import { settings, spd, getInitialStartCardCount } from './settings.js';
import { spawnCard, spawnEmptyCard, cardRank, cardSuit, snapshotCardIdentity, compareDiscoveredCards, DISCARD_RANKS, isSlotForbidden, dieInCard, isCardPlayableFull } from './cards.js';
import { spawnDice, nextComboForDisplay, nextComboForSlotCount, orderDiceIdsByValues, sortDiceIdsForDisplay, selectLeftmostTrayDie, drawFromCardDeck } from './dice.js';
import { getGridTotal, peekAnyScoringMatch } from './sweeps.js';
import { evaluateCardScore } from './scoring.js';
// These create circular imports resolved at call-time via ES module live bindings.
// All cross-module calls happen inside function bodies, never at module evaluation time.
import { resolveAllScoringSets } from '../ui/transitions/sweep-anim.js';
import { render } from '../ui/display/render.js';
import { renderWithPreviewFade } from '../ui/transitions/preview-anim.js';
import { renderHUD, initDiscards, discoveryGridHTML, renderDiscoveryGrid } from '../ui/display/hud.js';
import { processCardFills, launchPip } from '../ui/transitions/card-anim.js';
import { renderCardHTML } from '../ui/display/grid.js';
import { SCORING_RULE_LABELS } from './sweeps.js';
// Circular: handlers.js imports checkPhaseTransition from here.
import { autoplayCardStep } from '../ui/display/handlers.js';

/* ── Card fill (pure state mutation) ── */
export function fillOneCard(cardId) {
  const card = state.cards[cardId];
  if (!card) return;
  card.filled = true;
  card.scoreQueued = false;
  card.showScorePreview = false;
  const rank = cardRank(cardId);
  const suit = cardSuit(cardId);
  if (suit) {
    const col = DISCARD_RANKS.indexOf(rank);
    if (col >= 0) {
      if (!state.discards[col]) state.discards[col] = [];
      if (!state.discards[col].includes(suit)) state.discards[col].push(suit);
    }
  }
  const key = snapshotCardIdentity(cardId);
  if (key) {
    card.discoveryKey = key;
    if (!state.discoveredKeys.has(key)) {
      state.discoveredKeys.add(key);
      state.discoveredCards.push(cardId);
    }
  }
}

/* ── Convert cards (delegates animation to card-anim layer) ── */
// Pass force=true to skip the place-dice phase guard (used by full-grid endgame).
export function convertFilledCards(onDone, force = false) {
  if (!force && state.phase === 'place-dice') { onDone?.(); return; }
  if (state.awaitingPostDiceGridPlace)        { onDone?.(); return; }

  const queue = [];
  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (card.filled || card.scoreQueued) continue;
    if (isCardPlayableFull(cardId)) {
      card.scoreQueued = true;
      queue.push({ cardId, pts: evaluateCardScore(cardId) });
    }
  }

  if (queue.length === 0) { onDone?.(); return; }
  processCardFills(queue, 0, onDone);
}

export function convertAllGridCards(onDone) {
  const scoreEl = document.getElementById('score-display');
  let pipDelay = 0;
  const PIP_TAIL_MS = spd(990);
  const PIP_GAP_MS  = spd(830);

  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (!card) continue;

    if (!card.filled && !card.scoreQueued && isCardPlayableFull(cardId)) {
      card.scoreQueued = true;
      const pts = evaluateCardScore(cardId);
      if (pts > 0 && scoreEl) {
        const slotKey  = `${cardId}-1`;
        const holderEl = document.querySelector(`.holder-dice[data-slot="${slotKey}"]`);
        if (holderEl) {
          const fromRect = holderEl.getBoundingClientRect();
          const toRect   = scoreEl.getBoundingClientRect();
          for (let p = 0; p < pts; p++) {
            const d = pipDelay;
            setTimeout(() => launchPip(fromRect, toRect,
              () => { state.score++; renderHUD(); },
              () => {},
            ), d);
            pipDelay += PIP_GAP_MS;
          }
        } else {
          state.score += pts;
          renderHUD();
        }
      }
    }

    fillOneCard(cardId);
  }

  renderDiscoveryGrid();

  const totalMs = pipDelay > 0 ? (pipDelay - PIP_GAP_MS) + PIP_TAIL_MS + 80 : 0;
  if (onDone) setTimeout(onDone, totalMs);
}

/* ── State checks ── */
export function isAllDicePlaced() {
  return state.currentRoll.length > 0 &&
         state.currentRoll.every(id => dieInCard(id) !== null);
}

export function isGridFullyFilled() {
  return state.grid.every(id => {
    if (id === null) return false;
    const card = state.cards[id];
    return card?.empty === true || card?.filled === true;
  });
}

export function countEmptyDiceSlots() {
  return state.grid.reduce((sum, id) => {
    if (id === null) return sum;
    const card = state.cards[id];
    if (!card || card.empty) return sum;
    return sum + card.slots.filter(s => s === null).length;
  }, 0);
}

/** 4-square: after sweeps, offer one card when fewer than 6 empty dice slots remain. */
export function maybeOfferFourSquarePostSweepCard() {
  if (!settings.fourSquare || !settings.square) return;
  if (countEmptyDiceSlots() < 6) {
    state.pendingPostSweepCards = 1;
  }
}

export function hasLegalMove() {
  const trayDice = state.currentRoll.filter(id => dieInCard(id) === null);
  if (trayDice.length === 0) return true;
  for (const dieId of trayDice) {
    for (const cardId of state.grid) {
      if (cardId === null) continue;
      const card = state.cards[cardId];
      if (!card || card.filled || card.empty) continue;
      for (let si = 0; si < card.slots.length; si++) {
        if (card.slots[si] !== null) continue;
        if (!isSlotForbidden(cardId, si, dieId)) return true;
      }
    }
  }
  return false;
}

export function checkStuck() {
  if (state.phase !== 'place-dice') return;
  if (isAllDicePlaced()) return;
  if (!hasLegalMove()) showReplay('no legal moves remaining');
}

/** Undo place-dice → place-card when the post-dice hand card is returned to ghost. */
export function revertPostDiceCardPhase() {
  state.actionBarCards = [];
  state.selectedCardId = null;
  state.awaitingPostDiceGridPlace = false;
  state.phase = 'place-dice';
  state.diceAccentActive = true;
  selectLeftmostTrayDie();
}

/* ── Game over / replay ── */
export function showReplay(reason = '') {
  state.phase = 'replay';
  const bar = document.getElementById('action-bar');
  if (bar) bar.style.pointerEvents = 'none';
  render();

  document.getElementById('game-over-reason').textContent = reason;
  document.getElementById('go-cards-count').textContent = state.discoveredCards.length;

  const cardsEl = document.getElementById('go-cards-grid');
  const fourSquareGrid = settings.fourSquare && settings.square;
  cardsEl.classList.toggle('go-cards-grid--four-square', fourSquareGrid);

  if (fourSquareGrid) {
    cardsEl.innerHTML = discoveryGridHTML();
  } else {
    const sorted = [...state.discoveredCards].sort(compareDiscoveredCards);
    cardsEl.innerHTML = sorted.map(id =>
      `<div class="go-card-wrap">${renderCardHTML(id, false, false, { gameOver: true })}</div>`
    ).join('');
  }

  const sweepCounts = {};
  for (const s of state.scoredSets) {
    const label = SCORING_RULE_LABELS[s.ruleId] ?? s.ruleId;
    sweepCounts[label] = (sweepCounts[label] || 0) + 1;
  }
  const sweepsEl = document.getElementById('go-sweeps');
  sweepsEl.innerHTML = Object.keys(sweepCounts).length
    ? Object.entries(sweepCounts)
        .map(([label, n]) =>
          `<div class="go-sweep-row"><span class="go-sweep-label">${label}</span><span class="go-sweep-count">${n}</span></div>`)
        .join('')
    : '<div class="go-sweep-empty">no sweeps</div>';

  const overlay = document.getElementById('game-over-overlay');
  overlay.classList.remove('is-minimized');
  overlay.classList.add('is-visible');
}

/* ── Full-grid dice round ── */
export function spawnFullGridDiceRound() {
  state.phase = 'place-dice';
  state.fullGridDiceRound = true;
  state.suppressGhostAnimation = true;
  state.newPreview = true;
  const diceCount = settings.diceDecks ? (state.previewOrder.length || state.pendingCardSlotCount || 3) : 3;
  const ids = spawnDice(diceCount);
  state.currentRoll = ids;
  const prevPreview = state.previewOrder;
  state.trayOrder    = prevPreview.length ? orderDiceIdsByValues(ids, prevPreview) : sortDiceIdsForDisplay(ids);
  if (settings.diceDecks) {
    state.pendingCardSlotCount = drawFromCardDeck();
  }
  state.previewOrder = nextComboForSlotCount(settings.diceDecks ? state.lastPlacedCardSlotCount : 3);
  state.diceAccentActive = true;
  selectLeftmostTrayDie();
  renderWithPreviewFade();
  setTimeout(checkStuck, 0);
}

/* ── Phase transitions ── */
export function checkPhaseTransition() {
  if (state.phase === 'place-card' && state.actionBarCards.length === 0) {
    if (state.scoringExit) return;

    if (state.pendingSecondNewCard != null) {
      const nc2 = state.pendingSecondNewCard;
      state.pendingSecondNewCard = null;
      state.actionBarCards = [nc2];
      state.newCards = new Set([nc2]);
      state.selectedCardId = nc2;
      state.selectedDieId  = null;
      render();
      return;
    }

    // diceDecks ON: preview was empty (game start or any future empty state) →
    // fill preview based on the just-placed card, deal next card, skip dice phase.
    if (settings.diceDecks && state.previewOrder.length === 0) {
      state.previewOrder = nextComboForSlotCount(state.lastPlacedCardSlotCount);
      state.pendingCardSlotCount = drawFromCardDeck();
      const cardId = spawnCard(state.pendingCardSlotCount);
      state.actionBarCards = [cardId];
      state.newCards = new Set([cardId]);
      state.selectedCardId = cardId;
      state.selectedDieId  = null;
      state.newCardAfterPreview = true;
      render();
      maybeAutoplayFirstTwo();
      return;
    }

    if (state.currentRoll.length === 0 && state.cardsPlaced === getInitialStartCardCount()) {
      if (settings.diceDecks) {
        state.pendingCardSlotCount = drawFromCardDeck();
      }
      const cardId = spawnCard(settings.diceDecks ? state.pendingCardSlotCount : 3);
      state.actionBarCards = [cardId];
      state.newCards = new Set([cardId]);
      state.selectedCardId = cardId;
      state.selectedDieId  = null;
      state.newCardAfterPreview = true;
      render();
      maybeAutoplayFirstTwo();
      return;
    }

    state.phase = 'place-dice';
    state.awaitingPostDiceGridPlace = false;
    const allSlotsFilled = state.grid.every(id => id !== null);
    state.fullGridDiceRound = allSlotsFilled;
    // When diceDecks is ON, spawn exactly the dice shown in the upcoming-preview (previewOrder).
    // The empty-preview case is already handled above, so previewOrder.length > 0 here.
    const diceCount = settings.diceDecks ? (state.previewOrder.length || 3) : 3;
    const ids = spawnDice(diceCount);
    state.currentRoll = ids;
    const prevPreview = state.previewOrder;
    state.trayOrder    = (prevPreview.length === ids.length) ? orderDiceIdsByValues(ids, prevPreview) : sortDiceIdsForDisplay(ids);
    if (settings.diceDecks) {
      state.pendingCardSlotCount = drawFromCardDeck();
    }
    state.previewOrder = nextComboForSlotCount(settings.diceDecks ? state.lastPlacedCardSlotCount : 3);
    state.diceAccentActive = true;
    state.newPreview = true;
    selectLeftmostTrayDie();
    renderWithPreviewFade();
    setTimeout(checkStuck, 0);

  } else if (state.phase === 'place-dice' && isAllDicePlaced()) {
    if (state.fullGridDiceRound) {
      state.fullGridDiceRound = false;
      convertFilledCards(() => {
        const emptySlots = countEmptyDiceSlots();
        const willScore = peekAnyScoringMatch();
        if (willScore && !(settings.fourSquare && settings.square)) {
          state.pendingPostSweepCards = emptySlots === 0 ? 2 : 1;
        }
        resolveAllScoringSets();
        if (!state.scoringExit) {
          if (emptySlots === 0) {
            showReplay();
          } else {
            spawnFullGridDiceRound();
          }
          return;
        }
        render();
      }, true);
      return;
    }
    state.phase = 'place-card';
    const cardId = spawnCard(settings.diceDecks ? state.pendingCardSlotCount : 3);
    state.actionBarCards = [cardId];
    state.newCards = new Set([cardId]);
    state.selectedCardId = cardId;
    state.selectedDieId  = null;
    state.awaitingPostDiceGridPlace = true;
    render();
  }
}

/* ── Autoplay first-two helper ── */
export function maybeAutoplayFirstTwo() {
  if (!settings.autoplayFirstTwo) return;
  if (state.cardsPlaced >= getInitialStartCardCount() + 1) return;
  if (state.phase !== 'place-card') return;
  setTimeout(() => autoplayCardStep(), spd(480));
}

/* ── Game reset ── */
export function resetGame() {
  const bar = document.getElementById('action-bar');
  if (bar) bar.style.pointerEvents = '';
  state.grid           = Array(getGridTotal()).fill(null);
  state.cards          = [];
  state.actionBarCards = [];
  state.dice           = [];
  state.currentRoll    = [];
  state.trayOrder      = [];
  state.phase          = 'place-card';
  state.discards        = {};
  state.discoveredCards = [];
  state.discoveredKeys  = new Set();
  state.tickerTags     = [];
  state.stars          = 0;
  state.scoredSets     = [];
  state.awaitingPostDiceGridPlace = false;
  state.scoringExit = null;
  state.pendingLineSweeps = [];
  state.sweepOverlay = {};
  state.pendingPostSweepCards = 0;
  state.pendingSecondNewCard = null;
  state.fullGridDiceRound = false;
  state.suppressPreviewDice = false;
  state.suppressGhostAnimation = false;
  state.ghostReverseIn = false;
  state.diceDeck = [];
  state.diceDeck2 = [];
  state.diceDeck1 = [];
  state.cardDeck = [];
  state.pendingCardSlotCount = 3;
  state.lastPlacedCardSlotCount = 3;
  state.previewOrder = [];
  state.score = 0;
  state.cardsPlaced = 0;
  state.diceAccentActive = true;
  state.newDice = null;
  state.newCards = null;
  state.newPreview = null;
  state.newPreviewInCard = null;
  state.newCardAfterPreview = null;
  state.selectedDieId = null;
  state.selectedCardId = null;
  state.peekUnconvertedCards = new Set();
  state.gridCoins = new Set();
  state.collectedGridCoins = new Set();
  forbiddenDieSlots.clear();
  clearScoreExitTimers();
  if (settings.extendedGrid && settings.emptyCards) {
    for (const pos of [2, 5, 11, 12]) {
      const id = spawnEmptyCard();
      state.grid[pos] = id;
    }
  }
  initDiscards();
  const extraStartCount = getInitialStartCardCount() - 1;
  const initialCards = [];
  for (let i = 0; i <= extraStartCount; i++) {
    if (settings.diceDecks) {
      state.pendingCardSlotCount = drawFromCardDeck();
    }
    initialCards.push(spawnCard(settings.diceDecks ? state.pendingCardSlotCount : 3));
  }
  state.actionBarCards = initialCards;
  if (extraStartCount > 0) {
    state.newCards = new Set(initialCards.slice(1));
  }
  state.selectedCardId = initialCards[0];
  state.selectedDieId  = null;
  // diceDecks ON: preview starts empty; first card placement fills it (no dice round).
  // diceDecks OFF: pre-populate with a 3-die combo as before.
  state.previewOrder = settings.diceDecks ? [] : nextComboForSlotCount(3);
  render();
  maybeAutoplayFirstTwo();
}
