// v2 settings — steppers + toggles wired through SETTINGS_CONFIG
export const SETTINGS_CONFIG = [
  {
    group: 'counts',
    label: 'Counts',
    items: [
      { key: 'nSpots', label: 'N-spots',        default: 12, type: 'stepper', min: 1, max: 99 },
      { key: 'nDice',  label: 'N-dice (pool)',  default: 12, type: 'stepper', min: 1, max: 99 },
      { key: 'nRoll',  label: 'N-roll',         default: 4,  type: 'stepper', min: 1, max: 20 },
      { key: 'nPlace', label: 'N-place',        default: 3,  type: 'stepper', min: 1, max: 20 },
      { key: 'tileDealtEvery', label: 'Tile Dealt Every', default: 0, type: 'stepper', min: 0, max: 20 },
    ],
  },
  {
    group: 'rules',
    label: 'Rules',
    items: [
      { key: 'tileDealtChainDraw', label: 'Tile dealt chain draw', default: false, type: 'toggle' },
      { key: 'oneToOne',            label: '1to1 placement rules',  default: true,  type: 'toggle' },
      { key: 'suitRestriction',     label: 'Suit restriction',      default: false, type: 'toggle' },
      { key: 'consecutiveStars',    label: 'Consecutive star scoring', default: false, type: 'toggle' },
      { key: 'tricolors',           label: 'Tricolors',               default: false, type: 'toggle' },
      { key: 'tricolorSevens',      label: 'Tricolor Sevens',         default: false, type: 'toggle' },
      { key: 'jokerFlushOnly',      label: 'Joker flush only',        default: false, type: 'toggle' },
      { key: 'stackBottomUp',       label: 'Stack bottom-up',       default: true,  type: 'toggle' },
      { key: 'directPlacement',     label: 'Direct placement',      default: true,  type: 'toggle' },
      { key: 'fastAnimations',      label: 'Fast animations (2×)',  default: true,  type: 'toggle' },
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
}
