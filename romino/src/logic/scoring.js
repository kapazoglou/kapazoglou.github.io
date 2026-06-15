import { state } from './state.js';
import { settings, spd } from './settings.js';
import { cardSlotValue, cardRank, cardSuit, DISCARD_RANKS, squareSuitSlot, squareRankSlots, isCardPlayableFull } from './cards.js';

/* ── Combo detection (2 tiles) ── */
export function detectCombo(tiles) {
  if (tiles.length < 2) return { tag: '///', stars: 0 };
  const sorted = [...tiles].sort((a, b) => DISCARD_RANKS.indexOf(a.rank) - DISCARD_RANKS.indexOf(b.rank));
  const sNums  = sorted.map(t => DISCARD_RANKS.indexOf(t.rank));
  const sSuits = sorted.map(t => t.suit);
  const sRanks = sorted.map(t => t.rank);
  const consecutive = sNums[1] === sNums[0] + 1;
  const sameSuit    = sSuits[0] === sSuits[1];
  const sameNum     = sNums[0]  === sNums[1];
  if (consecutive && sameSuit) return { tag: `${sSuits[0]} ${sRanks.join(' ')}`, stars: 3 };
  if (sameNum)   return { tag: sRanks.join(' '), stars: 3 };
  if (consecutive) return { tag: sRanks.join(' '), stars: 2 };
  if (sameSuit)  return { tag: sSuits.join(' '), stars: 2 };
  return { tag: '///', stars: 0 };
}

/* ── Card scoring rules ── */
export const CARD_SCORE_RULES = [
  function ruleSuitDie(cardId) {
    if (settings.square) {
      const suitSlot = squareSuitSlot(cardId);
      if (suitSlot === null) return 0;
      const vSuit = cardSlotValue(cardId, suitSlot);
      const rankSlots = squareRankSlots(cardId);
      if (!rankSlots) return 0;
      const vA = cardSlotValue(cardId, rankSlots[0]);
      const vB = cardSlotValue(cardId, rankSlots[1]);
      if (!vA || !vB) return 0;
      const repeats   = settings.scoreSuitRepeat  && (vSuit === vA || vSuit === vB);
      const isExtreme = vSuit >= Math.max(vA, vB) || vSuit <= Math.min(vA, vB);
      const hasOneOrSix = vA === 1 || vA === 6 || vB === 1 || vB === 6;
      const extreme   = settings.scoreSuitExtreme && isExtreme && hasOneOrSix;
      return (repeats || extreme) ? 1 : 0;
    }
    const v0 = cardSlotValue(cardId, 0);
    const v1 = cardSlotValue(cardId, 1);
    const v2 = cardSlotValue(cardId, 2);
    if (!v0 || !v1 || !v2) return 0;
    if (v1 === 1 || v1 === 6) return 0;

    const repeats     = settings.scoreSuitRepeat  && (v1 === v0 || v1 === v2);
    const isExtreme   = v1 >= Math.max(v0, v2) || v1 <= Math.min(v0, v2);
    const hasOneOrSix = v0 === 1 || v0 === 6 || v2 === 1 || v2 === 6;
    const extreme     = settings.scoreSuitExtreme && isExtreme && hasOneOrSix;

    return (repeats || extreme) ? 1 : 0;
  },
  function ruleRankSum7(cardId) {
    if (!settings.scoreRankSum7) return 0;
    if (settings.square) {
      const suitSlot = squareSuitSlot(cardId);
      if (suitSlot === null) return 0;
      const rankSlots = squareRankSlots(cardId);
      if (!rankSlots) return 0;
      const vA = cardSlotValue(cardId, rankSlots[0]);
      const vB = cardSlotValue(cardId, rankSlots[1]);
      if (!vA || !vB) return 0;
      return vA + vB === 7 ? 1 : 0;
    }
    const v0 = cardSlotValue(cardId, 0);
    const v2 = cardSlotValue(cardId, 2);
    if (!v0 || !v2) return 0;
    return v0 + v2 === 7 ? 1 : 0;
  },
];

export function evaluateCardScore(cardId) {
  if (!settings.scoring || settings.square) return 0;
  return CARD_SCORE_RULES.some(rule => rule(cardId) > 0) ? 1 : 0;
}

/** Show/hide the score preview badge on a card based on current dice state. */
export function updateScorePreview(cardId) {
  const card = state.cards[cardId];
  if (!card || card.filled || card.scoreQueued) return;
  if (!settings.scoring || settings.square) {
    card.showScorePreview = false;
    card.scorePreviewNew  = false;
    return;
  }
  const qualifies = isCardPlayableFull(cardId) && evaluateCardScore(cardId) > 0;
  if (qualifies && !card.showScorePreview) {
    card.showScorePreview = true;
    card.scorePreviewNew  = true;
    const cid = cardId;
    setTimeout(() => { const c = state.cards[cid]; if (c) c.scorePreviewNew = false; }, spd(260));
  } else if (!qualifies) {
    card.showScorePreview = false;
    card.scorePreviewNew  = false;
  }
}
