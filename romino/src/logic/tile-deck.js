import { state } from './state.js';
import { settings } from './settings.js';
import { JOKER_RANK, rankGlyphFromSum } from './dice-visual.js';

export const DECK_SUITS = ['Z', 'X', 'Y', 'W'];

const SUIT_TO_BOTTOM = { Z: 2, X: 3, Y: 4, W: 5 };

export function tileKey(tile) {
  return `${tile.suit}:${tile.rank}`;
}

export function decodeTileKey(key) {
  const sep = key.indexOf(':');
  const suit = key.slice(0, sep);
  const rank = key.slice(sep + 1);
  const bottomValue = SUIT_TO_BOTTOM[suit] ?? 2;
  if (rank === 'A') return { suit, rank, rankSum: 1, bottomValue };
  if (rank === JOKER_RANK) return { suit, rank: JOKER_RANK, rankSum: 0, bottomValue };
  for (let sum = 2; sum <= 12; sum++) {
    if (rankGlyphFromSum(sum) === rank) {
      return { suit, rank, rankSum: sum, bottomValue };
    }
  }
  return null;
}

export function buildFullDeck(tricolors) {
  const tiles = [];
  for (const suit of DECK_SUITS) {
    tiles.push({ suit, rank: 'A', rankSum: 1, bottomValue: SUIT_TO_BOTTOM[suit] });
    for (let sum = 2; sum <= 12; sum++) {
      tiles.push({
        suit,
        rank: rankGlyphFromSum(sum),
        rankSum: sum,
        bottomValue: SUIT_TO_BOTTOM[suit],
      });
    }
    if (tricolors) {
      tiles.push({ suit, rank: JOKER_RANK, rankSum: 0, bottomValue: SUIT_TO_BOTTOM[suit] });
    }
  }
  return tiles;
}

function shuffle(keys) {
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
}

export function initTileDeck() {
  if (settings.tileDealtEvery <= 0) {
    state.tileDeckRemaining = [];
    return;
  }
  const keys = buildFullDeck(settings.tricolors).map(tileKey);
  shuffle(keys);
  state.tileDeckRemaining = keys;
}

export function isDuplicateOnRow(tile) {
  for (const column of Object.values(state.row)) {
    if (column.kind === 'tile' && column.suit === tile.suit && column.rank === tile.rank) {
      return true;
    }
  }
  return false;
}

export function drawFromDeck() {
  if (!state.tileDeckRemaining.length) return null;
  const idx = Math.floor(Math.random() * state.tileDeckRemaining.length);
  const key = state.tileDeckRemaining.splice(idx, 1)[0];
  return decodeTileKey(key);
}

/**
 * @param {{ chainDraw: boolean }} opts
 * @returns {{ dealtTile: object|null, discardedTiles: object[], deckDepleted: boolean }}
 */
export function resolveCadenceDeal({ chainDraw }) {
  const discardedTiles = [];

  if (!state.tileDeckRemaining.length) {
    return { dealtTile: null, discardedTiles, deckDepleted: true };
  }

  if (!chainDraw) {
    const drawn = drawFromDeck();
    if (!drawn) return { dealtTile: null, discardedTiles, deckDepleted: true };
    if (isDuplicateOnRow(drawn)) {
      return { dealtTile: null, discardedTiles: [drawn], deckDepleted: false };
    }
    return { dealtTile: drawn, discardedTiles, deckDepleted: false };
  }

  while (true) {
    if (!state.tileDeckRemaining.length) {
      return { dealtTile: null, discardedTiles, deckDepleted: true };
    }
    const drawn = drawFromDeck();
    if (!drawn) return { dealtTile: null, discardedTiles, deckDepleted: true };
    if (isDuplicateOnRow(drawn)) {
      discardedTiles.push(drawn);
      continue;
    }
    return { dealtTile: drawn, discardedTiles, deckDepleted: false };
  }
}
