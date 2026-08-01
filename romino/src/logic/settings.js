// v2 settings — steppers + toggles wired through SETTINGS_CONFIG
export const SETTINGS_CONFIG = [
  {
    group: 'counts',
    label: 'Counts',
    items: [
      { key: 'nSpots', label: 'N-spots',        default: 12, type: 'stepper', min: 1, max: 24 },
      { key: 'nDice',  label: 'N-dice (pool)',  default: 12, type: 'stepper', min: 1, max: 24 },
      { key: 'nRoll',  label: 'N-roll',         default: 3,  type: 'stepper', min: 1, max: 6 },
      { key: 'nPlace', label: 'N-place',        default: 2,  type: 'stepper', min: 1, max: 6 },
      { key: 'tileDealtEvery', label: 'Tile Dealt Every', default: 0, type: 'stepper', min: 0, max: 6 },
      { key: 'deckSize',       label: 'Deck Size',        default: 52, type: 'stepper', min: 0, max: 108 },
    ],
  },
  {
    group: 'rules',
    label: 'Rules',
    items: [
      { key: 'deckFlank',             label: 'Deck Flank',              default: false, type: 'toggle' },
      { key: 'oneToOne',            label: '1to1 placement rules',  default: true,  type: 'toggle' },
      { key: 'suitRestriction',     label: 'Suit restriction',      default: false, type: 'toggle' },
      { key: 'consecutiveStars',    label: 'Consecutive star scoring', default: false, type: 'toggle' },
      { key: 'verticalStars',       label: 'Vertical Stars',            default: false, type: 'toggle' },
      { key: 'aceJokerStarCost',    label: 'Ace/joker star cost',       default: false,  type: 'toggle' },
      { key: 'rerollOuter',         label: 'Reroll Outer',              default: true, type: 'toggle' },
      { key: 'dominoRoll',          label: 'Domino Roll',               default: false, type: 'toggle' },
      { key: 'tricolors',           label: 'Tricolors',               default: true, type: 'toggle' },
      { key: 'tricolorRestriction', label: 'Tricolor Restrictions',    default: true,  type: 'toggle' },
      { key: 'tricolorSevens',      label: 'Tricolor Sevens',         default: false, type: 'toggle' },
      { key: 'jokerFlushOnly',      label: 'Joker flush only',        default: true, type: 'toggle' },
      { key: 'stackBottomUp',       label: 'Stack bottom-up',       default: true,  type: 'toggle' },
      { key: 'directPlacement',     label: 'Direct placement',      default: true,  type: 'toggle' },
      { key: 'snapping',            label: 'Snapping',              default: false, type: 'toggle' },
      { key: 'fastAnimations',      label: 'Fast animations (2×)',  default: true,  type: 'toggle' },
      { key: 'tutoria',             label: 'Tutorial',               default: false, type: 'toggle' },
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

export function clampSettings() {
  if (settings.nPlace > settings.nRoll) settings.nPlace = settings.nRoll;
  if (settings.nRoll > settings.nDice) settings.nRoll = settings.nDice;
  if (settings.deckFlank) settings.tileDealtEvery = 0;
  if (settings.tileDealtEvery > 0) settings.deckFlank = false;
}
