// Each card: { id, slotCount: 1|2|3|4, slots: [dieId|null, ...] }
// Portrait: slots[0]=outer-left rank, slots[1]=middle suit, slots[2]=outer-right rank
// Square:    slots[0]=top-left, slots[1]=top-right, slots[2]=bottom-right, slots[3]=bottom-left (fourSquare)
export const state = {
  grid:                      Array(9).fill(null), // grid[i] = cardId | null
  cards:                     [],
  actionBarCards:            [],                  // card ids awaiting placement
  dice:                      [],
  currentRoll:               [],                  // die ids belonging to the current roll
  trayOrder:                 [],
  phase:                     'place-card',        // 'place-card' | 'place-dice' | 'replay'
  discards:                  {},
  discoveredCards:           [],                  // unique card IDs in first-discovery order (game-over summary)
  discoveredKeys:            new Set(),           // cardIdentityKey values for dedup (snapshot at fill time)
  tickerTags:                [],
  stars:                     0,
  scoredSets:                [],
  coolOffCards:              [],
  coolOffPopping:            null,
  awaitingPostDiceGridPlace: false,
  scoringExit:               null,
  pendingLineSweeps:         [],
  sweepOverlay:              {},
  gridCoins:                 new Set(), // SQUARE: active coins — keys "gridA:gridB:slotA:slotB"
  collectedGridCoins:        new Set(), // SQUARE: collected pairs — no respawn until match breaks
  pendingPostSweepCards:     0,
  pendingSecondNewCard:      null,
  diceDeck:                  [],
  diceDeck2:                 [],   // 2-die pair deck (used when diceDecks is on)
  diceDeck1:                 [],   // 1-die options deck (used when diceDecks is on)
  cardDeck:                  [],   // shuffled slot-count deck: 15 cards (off) or 78 cards (extendedCardDeck on)
  pendingCardSlotCount:      3,    // slot count for the NEXT card to be spawned
  lastPlacedCardSlotCount:   3,    // slot count of the card most recently placed on the grid
  previewOrder:              [],
  score:                     0,
  sweptPoints:               0,
  cardsPlaced:               0,
  diceAccentActive:          true,
  // Animation flags (consumed on first render after spawn)
  newDice:                   null,
  newCards:                  null,
  newPreview:                null,
  newPreviewInCard:          null,
  newCardAfterPreview:       null,
  selectedDieId:             null,
  selectedCardId:            null,
  peekUnconvertedCards:      new Set(), // filled grid card ids showing pre-conversion layout
  // Phase/round flags
  fullGridDiceRound:         false,
  suppressPreviewDice:       false,
  suppressGhostAnimation:    false,
  ghostReverseIn:            false,
  showGameOverCard:          false, // stuck: clickable game-over card in ghost slot
  newGameOverCard:           false, // one-shot slide-in for game-over ghost card
  finalizingStuck:           false, // guard while finalizeFromStuck pipeline runs
  chooseDiceAwaitingCard:    false, // chooseDice: 3 placed, tray card pending grid placement
  chooseDiceAwaitingLastChance: false, // chooseDice: all 6 placed, awaiting Last Chance click
  chooseDicePostLastChance:    false, // chooseDice: after Last Chance — offer cards until 6 slots
  finalizingLastChance:        false,
  newLastChanceCard:           false,
  // Sweep exit timers (stored on state to allow mutation from any module)
  scoreExitBeatTimer:        null,
  scoreExitDoneTimer:        null,
};

export const forbiddenDieSlots = new Set();

export function clearScoreExitTimers() {
  if (state.scoreExitBeatTimer) clearTimeout(state.scoreExitBeatTimer);
  if (state.scoreExitDoneTimer) clearTimeout(state.scoreExitDoneTimer);
  state.scoreExitBeatTimer = null;
  state.scoreExitDoneTimer = null;
}
