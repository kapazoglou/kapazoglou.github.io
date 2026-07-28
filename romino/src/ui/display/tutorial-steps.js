import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { initialStarCount } from '../../logic/turn.js';

/**
 * @typedef {'info' | 'gate'} TutorialStepType
 * @typedef {{
 *   id: string,
 *   type: TutorialStepType,
 *   title: string,
 *   body: string,
 *   hint?: string,
 *   anchor?: string,
 *   centered?: boolean,
 *   final?: boolean,
 *   gate?: () => boolean,
 * }} TutorialStep
 */

/** @returns {TutorialStep[]} */
export function getTutorialSteps() {
  const nPlace = settings.nPlace;

  return [
    {
      id: 'welcome',
      type: 'info',
      centered: true,
      title: 'Welcome to römino',
      body: 'Place dice on the row, turn stacks into tiles, and sweep runs to score. This walkthrough takes about a minute.',
    },
    {
      id: 'goal',
      type: 'info',
      anchor: '#hud-points',
      title: 'Your score',
      body: 'Points (right) are what you’re chasing. Clear tile runs to bank stars into points. Higher is better.',
    },
    {
      id: 'stars',
      type: 'info',
      anchor: '#hud-stars',
      title: 'Stars',
      body: 'Stars (left) are spendable power. Match dice on the row to earn them. When you sweep, stars × multiplier become points — then stars reset to 0.',
    },
    {
      id: 'suits',
      type: 'info',
      anchor: '.hud-suit-row',
      title: 'Suits',
      body: 'Each sweep adds to these suit tallies. They track what you’ve cleared — useful for reading your run history.',
    },
    {
      id: 'row',
      type: 'info',
      anchor: '#placement-row',
      title: 'The row',
      body: 'Dice stack in columns. Three dice in one column become a tile. Tiles sit side by side — that’s where sweeps happen.',
    },
    {
      id: 'roll',
      type: 'gate',
      anchor: '#roll-btn',
      title: 'Roll dice',
      body: 'Tap Roll to draw dice from your pool into the tray. Each roll costs dice from the number on the button.',
      hint: 'Tap Roll now.',
      gate: () => state.phase === 'rolled',
    },
    {
      id: 'tray',
      type: 'info',
      anchor: '#action-bar-dice',
      title: 'Dice tray',
      body: 'Rolled dice land here. Tap a die to select it, then tap a yellow hint on the row — or drag the die onto a column.',
    },
    {
      id: 'place-one',
      type: 'gate',
      anchor: '#placement-row',
      title: 'Place a die',
      body: 'Put a die on the row. New columns start from the centre; later dice can stack or sit in gaps.',
      hint: 'Place one die on the row.',
      gate: () => state.placedThisTurn >= 1,
    },
    {
      id: 'place-n',
      type: 'gate',
      anchor: '#placement-row',
      title: 'N-place',
      body: `Each turn you must place ${nPlace} dice before you can confirm. The roll button stays inactive until you’re done.`,
      hint: `Place ${nPlace} dice this turn.`,
      gate: () => state.placedThisTurn >= nPlace,
    },
    {
      id: 'star-matches',
      type: 'info',
      anchor: '#placement-row',
      title: 'Earn stars',
      body: 'When two dice on the same row share a value (or consecutive values, depending on rules), you earn a star. ⭐ markers show where a match happened.',
    },
    {
      id: 'confirm',
      type: 'gate',
      anchor: '#roll-btn',
      title: 'Confirm your turn',
      body: 'When all dice are placed, Roll becomes Confirm. Unplaced tray dice return to the pool; stacks convert to tiles; sweeps resolve; then you roll again.',
      hint: 'Tap Confirm.',
      gate: () => state.phase !== 'rolled',
    },
    {
      id: 'convert',
      type: 'info',
      anchor: '#placement-row',
      title: 'Stacks → tiles',
      body: 'Three dice in one column convert into a single tile showing rank and suit. Ace and joker tiles may cost a star to convert — watch your balance.',
    },
    {
      id: 'sweeps',
      type: 'info',
      anchor: '#placement-row',
      title: 'Sweeps',
      body: '3+ adjacent tiles in a row sweep if they are: Equal — same rank; Consecutive — ascending or descending (ace can bridge ends); Flush — same suit (jokers follow special rules). Swept tiles disappear and columns collapse.',
    },
    {
      id: 'multiplier',
      type: 'info',
      anchor: '#hud-stars',
      title: 'Sweep multiplier',
      body: 'A 3-tile sweep uses ×1. Each extra tile adds +1 to the multiplier (4 tiles → ×2, 5 → ×3). Your stars × best multiplier fly into points.',
    },
    {
      id: 'stay-alive',
      type: 'info',
      anchor: '#roll-btn',
      title: 'Don’t get stuck',
      body: 'Game over when: the dice pool can’t afford another roll; no legal slot exists for tray dice (red roll border — tap to end); a dealt tile has nowhere legal to go (when tile deals are enabled). Plan ahead so every roll still has room to breathe.',
    },
    {
      id: 'done',
      type: 'info',
      centered: true,
      final: true,
      title: 'You’re set',
      body: 'Triple-tap the HUD score anytime to open Settings. Toggle Tutoria off when you don’t need this again — turn it back on to replay the walkthrough. Advanced rules: settings toggles change placement, star matching, tricolor jokers, reroll-outer, and more.',
    },
  ];
}

/** @returns {boolean} */
export function hasEarnedStarSinceStart() {
  return state.stars > initialStarCount();
}
