/** @typedef {{ id: number, value: number }} Die */

/** @typedef {{ kind: 'stack', dice: number[], dominoKey?: string }} StackColumn */
/** @typedef {{ kind: 'tile', suit: string, rank: string, rankSum: number, bottomValue: number, flank?: boolean, dominoKey?: string }} TileColumn */
/** @typedef {StackColumn | TileColumn} Column */
/** @typedef {{ remaining: string[], top: object|null }} FlankStack */
/** @typedef {{ suit: string, rank: string, rankSum: number, bottomValue: number, stripId: number }} DealtStripTile */

export const EMPTY_SUIT_TALLY = () => ({ Z: 0, X: 0, Y: 0, W: 0, V: 0 });

export function createInitialState() {
  return {
    dicePool: 12,
    /** Virtual dice held by converted tiles when tileDiceHold ON (roll-button count only). */
    diceWithheld: 0,
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
    /** Suits that already produced a joker tile this session (one joker per suit per game). */
    jokerSuitsUsed: new Set(),
    phase: 'idle',
    selectedDieId: null,
    /** Set while a die is actively being dragged (UI only). */
    draggingDieId: null,
    /** Valid slot preview while snap ghost is visible (UI only). */
    snapGhostSlot: null,
    nextDieId: 0,
    hasPlacedFirstDie: false,
    /** Animation flags (transitions layer) */
    convertingCol: null,
    newTileCols: new Set(),
    newFlankSides: new Set(),
    newTrayDieIds: new Set(),
    /** Half-size tiles on row↔tray seam (tile-deck cadence deals). */
    /** @type {DealtStripTile[]} */
    dealtStrip: [],
    nextDealtStripId: 0,
    newDealtStripIds: new Set(),
    /** stripId set — transient warning-red border after duplicate-block attempt. */
    dealtStripWarningIds: new Set(),
    /** Row col keys — transient warning-red border on row tile after duplicate-block. */
    rowTileWarningCols: new Set(),
    tileDeckRemaining: [],
    /** Remaining deck conversions this session; null when deckSize setting is 0. */
    deckRemaining: null,
    /** Deck Flank — virtual 26-card stacks on row edges. */
    flankStackLeft: { remaining: [], top: null },
    flankStackRight: { remaining: [], top: null },
    /** Domino Roll — remaining pair combo keys (21 multiset pairs). */
    dominoPairPool: [],
    /** Domino Roll — remaining triple combo keys (56 multiset triples). */
    dominoTriplePool: [],
    /** Domino Roll — discarded pair combo keys (reshuffled on short draw when Domino Spots OFF; on sweep when ON). */
    dominoPairDiscard: [],
    /** Domino Roll — discarded triple combo keys (reshuffled on short draw when Domino Spots OFF; on sweep when ON). */
    dominoTripleDiscard: [],
    /** nRoll=4 domino quad: [[dieId, dieId], [dieId, dieId]] after roll. */
    dominoPairGroups: null,
    /** nRoll=4 domino quad: 0 | 1 | null — active pair after tray selection. */
    dominoChosenPairIndex: null,
    /** nRoll=4 domino quad: combo keys [keyA, keyB] drawn this roll (unused returned on confirm). */
    dominoPairComboKeys: null,
    /** nRoll=2 domino pair: one reroll offer per roll (↺ discards offer and redraws). */
    dominoPairRerollAvailable: false,
    /** Domino spots — combo keys offered this roll. */
    dominoOfferedKeys: [],
    /** Domino spots — spot 1: used domino key this roll. */
    dominoUsedKey: null,
    /** Domino spots — spot 2: unused domino key (nRoll=4). */
    dominoUnusedKey: null,
    /** Domino spots — column ids that received tray dice this turn, in first-use order. */
    dominoSpotCols: [],
    /** Domino spots — spot cols created this turn (deck tick on confirm). */
    dominoSpotsCreatedThisTurn: [],
    /** Domino spot strip — cols that just gained a seam domino (enter anim). */
    newDominoSpotCols: new Set(),
    /** UI — seam domino spot glyphs visible (toggle via deck badge tap). */
    dominoSpotsVisible: true,
    /** Domino spots — authoritative col→combo key until sweep (survives column recreate). */
    dominoSpotKeys: {},
    sweepExit: null,
    sweepExitBeatTimer: null,
    sweepExitDoneTimer: null,
    sweepExitPreludeTimer: null,
    /** Pair-sweep anim: strip tile + row col, no score. */
    pairSweepExit: null,
  };
}

export let state = createInitialState();

export function clearSweepExitTimers() {
  if (state.sweepExitBeatTimer) clearTimeout(state.sweepExitBeatTimer);
  if (state.sweepExitDoneTimer) clearTimeout(state.sweepExitDoneTimer);
  if (state.sweepExitPreludeTimer) clearTimeout(state.sweepExitPreludeTimer);
  state.sweepExitBeatTimer = null;
  state.sweepExitDoneTimer = null;
  state.sweepExitPreludeTimer = null;
}

export function resetStateObject() {
  state = createInitialState();
}
