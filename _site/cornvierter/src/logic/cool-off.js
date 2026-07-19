import { state } from './state.js';
import { settings } from './settings.js';
import { cardRank, DISCARD_RANKS } from './cards.js';

export function isCoolOffActive() {
  return settings.coolOff && settings.fourSquare && settings.square;
}

function rankDistanceFromCenter(rank) {
  const t = DISCARD_RANKS.indexOf(rank);
  return t < 0 ? 999 : Math.abs(t + 2 - 7);
}

function rankDiscardIndex(rank) {
  const t = DISCARD_RANKS.indexOf(rank);
  return t >= 0 ? t : 99;
}

export function isRankCoolOffBlocked(cardId) {
  if (!isCoolOffActive() || !state.coolOffCards.length) return false;
  const rank = cardRank(cardId);
  return state.coolOffCards.some(id => cardRank(id) === rank);
}

export function addCoolOffSweepCards(cardIds) {
  if (!isCoolOffActive() || !cardIds.length) return;
  const sorted = [...cardIds].sort((a, b) => {
    const ra = cardRank(a);
    const rb = cardRank(b);
    const da = rankDistanceFromCenter(ra);
    const db = rankDistanceFromCenter(rb);
    if (da !== db) return da - db;
    return rankDiscardIndex(ra) - rankDiscardIndex(rb);
  });
  state.coolOffCards.push(...sorted);
}
