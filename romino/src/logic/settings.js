// Edit SETTINGS_CONFIG to add/reorder/group toggles.
// Each group has a label and an items array; each item needs key, label, default.
export const SETTINGS_CONFIG = [
  {
    group: 'square',
    label: 'Square v1',
    items: [
      { key: 'deckDice',         label: 'Dice decks/Random',                         default: false  },
      { key: 'coinFlipDice',   label: 'Flip dice for coin',                          default: false },
      { key: 'extendedGrid',      label: 'Extended grid (4 × 4)',                    default: false },
      { key: 'extraStartCards',   label: 'Extra start cards',                        default: false },
      { key: 'square',            label: 'SQUARE — square card layout',              default: true },
      { key: 'fourSquare',        label: '4-square — 4 slot card',                   default: true },
      { key: 'fillDiscovery',     label: 'Fill Discovery',                           default: true },
      { key: 'oneToOne',          label: 'One-to-one — combo fixes card identity',   default: false },
      { key: 'forbidThirdExtreme', label: 'Forbid 1/6 as third die',                default: false },
      { key: 'progressiveDicePlacement', label: 'Progressive dice placement',         default: true },
      { key: 'progressiveSuitJoker',   label: 'Progressive suit joker',             default: true },
      { key: 'coolOff',           label: 'Sweep cool-off ',                          default: false },
      { key: 'uniqueIndex',      label: 'Unique index',                              default: true  },
      { key: 'partialUniqueIndex', label: 'Partial unique index',                    default: false },
      { key: 'peekUnconvertedLayout', label: 'Peek unconverted',                     default: true },
      { key: 'placementRestrictions', label: 'Placement restrictions',               default: false },
      { key: 'forbiddenSlots', label: 'Forbidden slots',                             default: true  },
      { key: 'scoring',          label: 'Earn coins',                                default: true  },
      { key: 'gridCoinsExcludeConverted', label: 'Coins exclude converted',          default: true  },
      { key: 'gridCoinsSum7',           label: 'Coins diff/same numbers',            default: true },
      { key: 'set',        label: 'Set same number',                                 default: true  },
      { key: 'runFlush',   label: 'Run flush — consecutive numbers, same suit',      default: true  },
      { key: 'runDiff',    label: 'Run diff — consecutive numbers, all diff suits',  default: true  },
      { key: 'runAny',     label: 'Run any — consecutive numbers, any suits',        default: true },
      { key: 'flush',      label: 'Flush — same suit',                               default: false },
    ],
  },
  {
    group: 'card-deck',
    label: 'Card Deck',
    items: [
      { key: 'diceDecks',        label: 'Dice Decks — variable slot cards',              default: false },
      { key: 'extendedCardDeck', label: 'Extended card deck (78)',                         default: true },
      { key: 'vSuitDominoFill',  label: 'Domino fill — 2-slot V keeps dice visible',     default: true  },
      { key: 'tricolor',         label: 'Tricolor sevens — rankless when rank dice sum to 7', default: true },
    ],
  },
  {
    group: 'grid',
    label: 'Grid',
    items: [
      { key: 'colorRestriction', label: 'Color restriction — treat 1 and 6 as equivalent (SQUARE)', default: false },
      { key: 'emptyCards',        label: 'Empty cards (diagonal blockers)',               default: false },
      { key: 'sweepThreeInRow',   label: '3-in-a-row sweeps (4×4)',                       default: false },
      { key: 'fastAnimations',    label: 'Fast animations (2×)',                         default: true  },
      { key: 'autoplayLongPress', label: 'Autoplay on long press',                       default: true  },
      { key: 'autoplayFirstTwo',  label: 'Autoplay first two cards',                     default: false  },
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
      { key: 'paidSlots',      label: 'Paid slots — forbidden costs a coin',             default: false },
      { key: 'refundOnMove',   label: 'Refund coin when moving from paid slot',           default: false },
      { key: 'swapDice',       label: 'Swap placed dice by tapping one then the other',  default: false },
    ],
  },
  {
    group: 'scoring',
    label: 'Scoring',
    items: [
      { key: 'scoreSuitRepeat',  label: 'Suit die scores when it matches an outer die',  default: true  },
      { key: 'scoreSuitExtreme', label: 'Suit die scores when extreme and card has 1 or 6', default: true },
      { key: 'scoreRankSum7',    label: 'Score when the two rank dice sum to 7',          default: true  },
    ],
  },
  {
    group: 'sweeps',
    label: 'Sweeps',
    items: [
      { key: 'wildTarok',  label: 'Wild tarok — V counts as any suit in runs',            default: true  },
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
