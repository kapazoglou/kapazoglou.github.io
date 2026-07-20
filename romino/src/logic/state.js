/** @typedef {{ id: number, value: number }} Die */

/** @typedef {{ kind: 'stack', dice: number[] }} StackColumn */
/** @typedef {{ kind: 'tile', suit: string, rank: string, rankSum: number, bottomValue: number }} TileColumn */
/** @typedef {StackColumn | TileColumn} Column */

export const EMPTY_SUIT_TALLY = () => ({ Z: 0, X: 0, Y: 0, W: 0, V: 0 });

export function createInitialState() {
  return {
    dicePool: 12,
    actionBar: [],
    dice: {},
    /** @type {Record<number, Column>} colIndex → column (0 = center) */
    row: {},
    placedThisTurn: 0,
    placedDieIds: new Set(),
    stars: 0,
    points: 0,
    suitTally: EMPTY_SUIT_TALLY(),
    /** Swept tile runs for game-over summary (each run = tile snapshots). */
    sweepHistory: [],
    /** Successful rollDice() calls this session (game-over stat). */
    rollCount: 0,
    phase: 'idle',
    selectedDieId: null,
    /** Set while a die is actively being dragged (UI only). */
    draggingDieId: null,
    nextDieId: 0,
    hasPlacedFirstDie: false,
    /** Animation flags (transitions layer) */
    convertingCol: null,
    newTileCols: new Set(),
    newTrayDieIds: new Set(),
    sweepExit: null,
    sweepExitBeatTimer: null,
    sweepExitDoneTimer: null,
  };
}

export let state = createInitialState();

export function clearSweepExitTimers() {
  if (state.sweepExitBeatTimer) clearTimeout(state.sweepExitBeatTimer);
  if (state.sweepExitDoneTimer) clearTimeout(state.sweepExitDoneTimer);
  state.sweepExitBeatTimer = null;
  state.sweepExitDoneTimer = null;
}

export function resetStateObject() {
  state = createInitialState();
}
