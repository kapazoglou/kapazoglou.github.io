// Edit SETTINGS_CONFIG to add/reorder/group toggles.
// Each group has a label and an items array; each item needs key, label, default.
export const SETTINGS_CONFIG = [
  {
    group: 'card-deck',
    label: 'Card Deck',
    items: [
      { key: 'diceDecks',        label: 'Dice Decks — variable slot cards',              default: false },
      { key: 'extendedCardDeck', label: 'Extended card deck (78)',                         default: true },
      { key: 'deckDice',         label: 'Dice decks — use decks (off = random)',          default: true  },
      { key: 'vSuitDominoFill',  label: 'Domino fill — 2-slot V keeps dice visible',     default: true  },
      { key: 'tricolor',         label: 'Tricolor sevens — rankless when rank dice sum to 7', default: true },
    ],
  },
  {
    group: 'grid',
    label: 'Grid',
    items: [
      { key: 'extendedGrid',      label: 'Extended grid (4 × 4)',                       default: false },
      { key: 'extraStartCards',   label: 'Extra start cards — +1 in 3×3, +2 in 4×4',   default: false },
      { key: 'square',            label: 'SQUARE — square card layout',                   default: true },
      { key: 'uniqueIndex',      label: 'Unique index — block duplicate dice on grid',              default: true  },
      { key: 'colorRestriction', label: 'Color restriction — treat 1 and 6 as equivalent (SQUARE)', default: false },
      { key: 'emptyCards',        label: 'Empty cards (diagonal blockers)',               default: false },
      { key: 'fastAnimations',    label: 'Fast animations (2×)',                         default: true  },
      { key: 'autoplayLongPress', label: 'Autoplay on long press',                       default: true  },
      { key: 'autoplayFirstTwo',  label: 'Autoplay first two cards',                     default: false  },
      { key: 'peekUnconvertedLayout', label: 'Peek unconverted — tap converted cards to toggle layout', default: true },
    ],
  },
  {
    group: 'dice-deck',
    label: 'Dice Deck',
    items: [
      { key: 'blankDie',        label: 'Blank die (no pips → V suit)',                   default: false },
      { key: 'blanksInRank',    label: 'Allow blank in rank (both slots must match)',     default: true  },
      { key: 'filterExtremes',  label: 'Remove all-1s/6s dice combos',                   default: true  },
      { key: 'sortDice',        label: 'Sort dice in action bar',                         default: false  },
    ],
  },
  {
    group: 'constraints',
    label: 'Constraints',
    items: [
      { key: 'forbiddenSlots', label: 'Forbidden slots — completely block placement',     default: true  },
      { key: 'paidSlots',      label: 'Paid slots — forbidden costs a coin',             default: false },
      { key: 'refundOnMove',   label: 'Refund coin when moving from paid slot',           default: false },
      { key: 'swapDice',       label: 'Swap placed dice by tapping one then the other',  default: false },
    ],
  },
  {
    group: 'scoring',
    label: 'Scoring',
    items: [
      { key: 'scoring',          label: 'Scoring — earn and spend coins',               default: false  },
      { key: 'scoreSuitRepeat',  label: 'Suit die scores when it matches an outer die',  default: true  },
      { key: 'scoreSuitExtreme', label: 'Suit die scores when extreme and card has 1 or 6', default: true },
      { key: 'scoreRankSum7',    label: 'Score when the two rank dice sum to 7',          default: true  },
    ],
  },
  {
    group: 'sweeps',
    label: 'Sweeps',
    items: [
      { key: 'set',        label: 'Set — same number',                                    default: true  },
      { key: 'runFlush',   label: 'Run flush — consecutive numbers, same suit',           default: true  },
      { key: 'runDiff',    label: 'Run diff — consecutive numbers, all diff suits',       default: true  },
      { key: 'runAny',     label: 'Run any — consecutive numbers, any suits',             default: false },
      { key: 'wildTarok',  label: 'Wild tarok — V counts as any suit in runs',            default: true  },
      { key: 'flush',      label: 'Flush — same suit',                                    default: false },
      { key: 'tarokFlush', label: 'Tarok flush — V suit sweep',                           default: false },
      { key: 'domino',     label: 'Domino — V suit horizontal chain (outer dice match)',  default: false  },
    ],
  },
];

export const settings = Object.fromEntries(
  SETTINGS_CONFIG.flatMap(g => g.items.map(i => [i.key, i.default]))
);

/** Return ms scaled by the current animation-speed setting (0.5× when fast). */
export function spd(ms) {
  return settings && settings.fastAnimations ? ms * 0.5 : ms;
}

/** Cards dealt into the action bar at reset (1, or 2/3 with extraStartCards). */
export function getInitialStartCardCount() {
  return 1 + (settings.extraStartCards ? (settings.extendedGrid ? 2 : 1) : 0);
}
