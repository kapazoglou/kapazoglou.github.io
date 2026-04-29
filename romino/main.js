/* ── Color & pip data ── */
const PIP_COLOR = {
  1: '#FFFFFF', 2: '#7161FF', 3: '#CC5529',
  4: '#5DB22D', 5: '#25A5CC', 6: '#FFFFFF', 7: '#CCB400',
};

/* Pip fill colors for the die SVG (white die face; 1&6 get dark pips) */
const DIE_PIP_COLOR = {
  1: '#070D1A', 2: '#7161FF', 3: '#CC5529',
  4: '#5DB22D', 5: '#25A5CC', 6: '#070D1A', 7: '#CCB400',
};

const PIP_POS = {
  tl:[31,9], tr:[31,31], ml:[20,9], c:[20,20], mr:[20,31], bl:[9,9], br:[9,31],
};
const JOKER_PIP_POS = {
  tl:[31,14], tr:[31,26], ml:[20,8], c:[20,20], mr:[20,32], bl:[9,14], br:[9,26],
};
const PIP_PATTERN = {
  1:['c'], 2:['tl','br'], 3:['tr','c','bl'],
  4:['tl','tr','bl','br'], 5:['tl','tr','c','bl','br'],
  6:['tl','tr','ml','mr','bl','br'],
  7:['tl','tr','ml','c','mr','bl','br'],
};
const ALL_PIPS = ['tl','tr','ml','c','mr','bl','br'];

function dieSVG(value, size = 40) {
  const s  = size / 40;
  const rx = Math.round((value === 7 ? 9 : 8) * s);
  const pr = 5 * s;
  const color  = DIE_PIP_COLOR[value];
  const active = new Set(PIP_PATTERN[value]);
  const pos    = value === 7 ? JOKER_PIP_POS : PIP_POS;
  const circles = ALL_PIPS.filter(k => active.has(k)).map(k => {
    const [cx, cy] = pos[k];
    const pipColor = value === 7 && k === 'c' ? DIE_PIP_COLOR[1] : color;
    return `<circle cx="${(cx*s).toFixed(1)}" cy="${(cy*s).toFixed(1)}" r="${pr.toFixed(1)}" fill="${pipColor}"/>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" data-name="dice_master"><rect width="${size}" height="${size}" rx="${rx}" fill="#FFFFFF"/>${circles}</svg>`;
}

function ndTranscribe(str) {
  return String(str).replace(/[0-9]/g, d => 'jabcdefghi'[+d]);
}

/* ── Suit / rank constants ── */
const SUIT_LETTER   = { 1:'V', 2:'Z', 3:'X', 4:'Y', 5:'W', 6:'V' };
const DISCARD_RANKS = ['★','A','b','c','d','e','f','g','h','i','aj','aa','ab','ac'];
const SUIT_COLOR    = { V:'#FFFFFF', Z:'#7161FF', X:'#CC5529', Y:'#5DB22D', W:'#25A5CC' };
const DISPLAY_SUITS = ['Z','X','Y','W'];

/* ── State ── */
// Each card: { id, slots: [dieId|null, dieId|null, dieId|null] }
// slots[0] = outer-left (rank), slots[1] = middle (suit), slots[2] = outer-right (rank)
const state = {
  grid:           Array(9).fill(null), // grid[i] = cardId | null
  cards:          [],
  actionBarCards: [],                  // card ids awaiting placement
  dice:           [],
  currentRoll:    [],                  // die ids belonging to the current roll
  trayOrder:      [],
  phase:          'place-card',        // 'place-card' | 'place-dice'
  discards:       {},
  tickerTags:     [],
  stars:          0,
  /** @type {{ ruleId: string, label: string, cardIds: number[], slotIndices: number[] }[]} Scored sets (UI removed for now; data kept for a future display). */
  scoredSets:     [],
  /** After a dice round, filled conversion waits until this hand card is placed on the grid. */
  awaitingPostDiceGridPlace: false,
  /** When set, grid slots still hold cards while a sweep-out animation runs. */
  scoringExit:      null,
  /** 6-dice endgame: deal a new hand card after scoring animations finish (if any line scored). */
  pendingSixDiceNewCard: false,
  /** Remaining shuffled 3-dice combinations; refilled from ALL_DICE_COMBOS when empty. */
  diceDeck: [],
  /** Running score from card-level scoring rules. */
  score: 0,
  /** Total cards placed from the action bar onto the grid (drives the 52-card countdown). */
  cardsPlaced: 0,
  /** Whether placed dice in the current roll show their accent border. Cleared when the next card is placed. */
  diceAccentActive: true,
};

let scoreExitBeatTimer = null;
let scoreExitDoneTimer = null;

function clearScoreExitTimers() {
  if (scoreExitBeatTimer) clearTimeout(scoreExitBeatTimer);
  if (scoreExitDoneTimer) clearTimeout(scoreExitDoneTimer);
  scoreExitBeatTimer = null;
  scoreExitDoneTimer = null;
}

/* ── Dice combination deck (all 56 unordered 3-dice combos, values 1–6) ── */
const ALL_DICE_COMBOS = (() => {
  const combos = [];
  for (let a = 1; a <= 6; a++)
    for (let b = a; b <= 6; b++)
      for (let c = b; c <= 6; c++)
        combos.push([a, b, c]);
  return combos; // 56 entries
})();

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawDiceCombination() {
  if (state.diceDeck.length === 0) {
    state.diceDeck = shuffleArray([...ALL_DICE_COMBOS]);
  }
  return state.diceDeck.pop();
}

/** Peek at the next combination without consuming it. Refills deck if empty. */
function peekNextDiceCombination() {
  if (state.diceDeck.length === 0) {
    state.diceDeck = shuffleArray([...ALL_DICE_COMBOS]);
  }
  return state.diceDeck[state.diceDeck.length - 1];
}

/* ── Card & die spawning ── */
function spawnCard() {
  const id = state.cards.length;
  state.cards.push({ id, slots: [null, null, null], filled: false });
  return id;
}

function spawnDice(count) {
  const nextId = state.dice.length;
  const ids = [];
  // Each draw produces 3 values; count is always 3 or 6
  const values = [];
  for (let ci = 0; ci < count / 3; ci++) {
    values.push(...drawDiceCombination());
  }
  for (let i = 0; i < count; i++) {
    const id = nextId + i;
    state.dice.push({ id, value: values[i] });
    ids.push(id);
  }
  state.newDice = new Set(ids); // consumed by renderActionBar on the next render
  return ids;
}

/* ── Card helpers ── */
function dieInCard(dieId) {
  for (const card of state.cards) {
    for (let si = 0; si < 3; si++) {
      if (card.slots[si] === dieId) return `${card.id}-${si}`;
    }
  }
  return null;
}

function cardSlotValue(cardId, si) {
  const id = state.cards[cardId]?.slots[si];
  return (id !== null && id !== undefined) ? state.dice[id].value : 0;
}

function isJokerCard(cardId) {
  const c = state.cards[cardId];
  if (!c || c.slots[0] === null || c.slots[2] === null) return false;
  const v0 = cardSlotValue(cardId, 0), v2 = cardSlotValue(cardId, 2);
  return (v0 === 1 && v2 === 6) || (v0 === 6 && v2 === 1);
}

function allThreeColoredCard(cardId) {
  const c = state.cards[cardId];
  if (!c) return false;
  const vals = c.slots.map(id => id !== null ? state.dice[id].value : null);
  if (vals.some(v => v === null || v < 2 || v > 5)) return false;
  return new Set(vals).size === 3;
}

function cardRank(cardId) {
  // if (allThreeColoredCard(cardId)) return 'A';
  if (isJokerCard(cardId)) return 'A';
  const sum = cardSlotValue(cardId, 0) + cardSlotValue(cardId, 2);
  return sum === 0 ? ' ' : ndTranscribe(sum);
}

function cardMiddleValue(cardId) {
  const id = state.cards[cardId]?.slots[1];
  return (id !== null && id !== undefined) ? state.dice[id].value : null;
}

function cardSuit(cardId) {
  const v = cardMiddleValue(cardId);
  return v !== null ? SUIT_LETTER[v] : '';
}

function cardColor(cardId) {
  const v = cardMiddleValue(cardId);
  return v !== null ? PIP_COLOR[v] : null;
}

/** Grid card may be moved to another slot until any die is placed on it. */
function cardIsGridRepositionable(cardId) {
  const c = state.cards[cardId];
  if (!c || c.filled) return false;
  return c.slots.every(s => s === null);
}

/* ── Scoring sets (3 filled cards in a line on the grid) ──
 * Presets bundle which rules are active and in what order (first match wins per line).
 * Switch at runtime for testing: __setScoringPreset('default' | 'triple_same_rank_only' | 'consecutive_suit_only')
 */
const GRID_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/** Sweep axis for CSS: rows → horizontal, cols → vertical, diagonals → along / or \\ */
function lineExitKey(line) {
  const key = line.join(',');
  if (key === '0,1,2' || key === '3,4,5' || key === '6,7,8') return 'h';
  if (key === '0,3,6' || key === '1,4,7' || key === '2,5,8') return 'v';
  if (key === '0,4,8') return 'd1';
  if (key === '2,4,6') return 'd2';
  return 'h';
}

function peekAnyScoringMatch() {
  for (const line of GRID_LINES) {
    if (findScoringMatchOnLine(line)) return true;
  }
  return false;
}

/** @type {Record<string, (cardIds: number[]) => boolean>} */
const SCORING_RULES = {
  triple_same_rank(cardIds) {
    const r0 = cardRank(cardIds[0]);
    const r1 = cardRank(cardIds[1]);
    const r2 = cardRank(cardIds[2]);
    return r0 !== '' && r0 === r1 && r1 === r2;
  },
  triple_consecutive_same_suit(cardIds) {
    const suits = cardIds.map(id => cardSuit(id));
    if (suits.some(s => !s)) return false;
    const allSame = suits.every(s => s === suits[0]);
    const allDiff = new Set(suits).size === 3;
    if (!allSame && !allDiff) return false;

    const indices = cardIds.map(id => DISCARD_RANKS.indexOf(cardRank(id)));
    if (indices.some(i => i <= 0)) return false; // ★ or not found
    // Circular positions: A(idx=1)→0, 2(idx=2)→1, …, 12(idx=12)→11
    const sorted = indices.map(i => i - 1).sort((a, b) => a - b);
    const [s0, s1, s2] = sorted;
    return (s1 === s0 + 1 && s2 === s1 + 1) // normal run
        || (s0 === 0 && s1 ===  1 && s2 === 11) // 12-A-2
        || (s0 === 0 && s1 === 10 && s2 === 11); // 11-12-A
  },
};

const SCORING_RULE_LABELS = {
  triple_same_rank: 'Same rank',
  triple_consecutive_same_suit: 'Run', // same suit OR all-different suits; A wraps
};

/** @type {Record<string, { id: string; label: string; ruleOrder: string[] }>} */
const SCORING_PRESETS = {
  default: {
    id: 'default',
    label: 'Default',
    ruleOrder: ['triple_same_rank', 'triple_consecutive_same_suit'],
  },
  triple_same_rank_only: {
    id: 'triple_same_rank_only',
    label: 'Same rank only',
    ruleOrder: ['triple_same_rank'],
  },
  consecutive_suit_only: {
    id: 'consecutive_suit_only',
    label: 'Consecutive suit only',
    ruleOrder: ['triple_consecutive_same_suit'],
  },
};

let activeScoringPresetId = 'default';

function getActiveScoringPreset() {
  return SCORING_PRESETS[activeScoringPresetId] || SCORING_PRESETS.default;
}

/**
 * @param {string} presetId
 * @returns {boolean}
 */
function setScoringPreset(presetId) {
  if (!SCORING_PRESETS[presetId]) return false;
  activeScoringPresetId = presetId;
  render();
  return true;
}

if (typeof window !== 'undefined') {
  window.__setScoringPreset = setScoringPreset;
  window.__getScoringPreset = () => activeScoringPresetId;
  window.__listScoringPresets = () => Object.keys(SCORING_PRESETS);
}

/**
 * @param {number[]} lineSlots
 * @returns {{ ruleId: string, cardIds: number[] } | null}
 */
function findScoringMatchOnLine(lineSlots) {
  const cardIds = lineSlots.map(i => state.grid[i]);
  if (cardIds.some(id => id === null || id === undefined)) return null;
  if (!cardIds.every(cid => state.cards[cid]?.filled)) return null;

  const preset = getActiveScoringPreset();
  for (const ruleId of preset.ruleOrder) {
    const fn = SCORING_RULES[ruleId];
    if (fn && fn(cardIds)) return { ruleId, cardIds };
  }
  return null;
}

function startScoringExitAnimation(lineSlots, ruleId, cardIds) {
  clearScoreExitTimers();
  state.scoringExit = {
    lineSlots: [...lineSlots],
    cardIds: [...cardIds],
    ruleId,
    lineKey: lineExitKey(lineSlots),
    phase: 'wait',
  };
  document.getElementById('app')?.classList.add('is-scoring-exit');
  render();

  const BEAT_MS = 320;
  const SWEEP_MS = 780;
  scoreExitBeatTimer = setTimeout(() => {
    scoreExitBeatTimer = null;
    if (!state.scoringExit) return;
    state.scoringExit.phase = 'run';
    render();
    scoreExitDoneTimer = setTimeout(() => {
      scoreExitDoneTimer = null;
      commitScoringExit();
    }, SWEEP_MS);
  }, BEAT_MS);
}

/** After sweep: clear grid slots, record score, chain further lines or 6-dice hand card. */
function commitScoringExit() {
  clearScoreExitTimers();
  const se = state.scoringExit;
  if (!se) return;

  for (const i of se.lineSlots) state.grid[i] = null;
  state.scoredSets.push({
    ruleId: se.ruleId,
    label: SCORING_RULE_LABELS[se.ruleId] || se.ruleId,
    cardIds: [...se.cardIds],
    slotIndices: [...se.lineSlots],
  });
  state.scoringExit = null;
  document.getElementById('app')?.classList.remove('is-scoring-exit');

  resolveAllScoringSets();

  if (!state.scoringExit && !peekAnyScoringMatch()) {
    if (state.pendingSixDiceNewCard) {
      // 6-dice path: offer 2 new cards to place
      state.pendingSixDiceNewCard = false;
      state.phase = 'place-card';
      const nc1 = spawnCard(), nc2 = spawnCard();
      state.actionBarCards = [nc1, nc2];
      state.newCards = new Set([nc1, nc2]);
    } else if (state.pendingSecondBatchAfterScoring) {
      // Full-grid first batch: scoring resolved — now spawn the second batch.
      state.pendingSecondBatchAfterScoring = false;
      spawnSecondDiceBatch();
      return;
    } else {
      // 3-dice path: scoring was triggered by placing the last grid card;
      // the phase transition was deferred — resume it now.
      // Grid slots were cleared by scoring so allSlotsFilled will be false → 3 dice.
      // Return early: checkPhaseTransition → renderWithPreviewFade already handles
      // rendering (immediately or after the 180 ms preview-fade delay). A second
      // render() here would fire before or after that window, consuming newDice /
      // newPreview flags and stripping the is-new animation classes from the DOM.
      checkPhaseTransition();
      return;
    }
  }
  render();
}

/** Start one scoring sweep if nothing is already animating; otherwise no-op. */
function resolveOneScoringSet() {
  if (state.scoringExit) return false;
  for (const line of GRID_LINES) {
    const match = findScoringMatchOnLine(line);
    if (!match) continue;
    startScoringExitAnimation(line, match.ruleId, match.cardIds);
    return true;
  }
  return false;
}

function resolveAllScoringSets() {
  if (state.scoringExit) return;
  resolveOneScoringSet();
}

/* ── Combo detection (2 tiles) ── */
function detectCombo(tiles) {
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

/* ── Card scoring rules ─ comment individual rules out to disable them ── */
const CARD_SCORE_RULES = [
  // The suit (single/middle) die scores exactly 1 point, but only when:
  //   • its value is not 1 or 6, AND
  //   • its value repeats within the card (matches slot 0 or slot 2), OR
  //   • it is the highest or lowest of all three dice AND the card contains a 1 or 6
  function ruleSuitDie(cardId) {
    const v0 = cardSlotValue(cardId, 0);
    const v1 = cardSlotValue(cardId, 1); // suit die
    const v2 = cardSlotValue(cardId, 2);
    if (!v0 || !v1 || !v2) return 0;
    if (v1 === 1 || v1 === 6) return 0;

    const repeats    = v1 === v0 || v1 === v2;
    const isExtreme  = v1 >= Math.max(v0, v2) || v1 <= Math.min(v0, v2);
    const hasOneOrSix = v0 === 1 || v0 === 6 || v2 === 1 || v2 === 6;

    return (repeats || (isExtreme && hasOneOrSix)) ? 1 : 0;
  },
];

function evaluateCardScore(cardId) {
  let pts = 0;
  for (const rule of CARD_SCORE_RULES) pts += rule(cardId);
  return pts;
}

/** Show/hide the score preview badge on a card based on current dice state. */
function updateScorePreview(cardId) {
  const card = state.cards[cardId];
  if (!card || card.filled || card.scoreQueued) return;
  const qualifies = card.slots.every(s => s !== null) && evaluateCardScore(cardId) > 0;
  if (qualifies && !card.showScorePreview) {
    card.showScorePreview = true;
    card.scorePreviewNew  = true;
    // Keep the flag alive for the full animation duration so re-renders within
    // that window still include the is-new class and the pop-in always completes.
    const cid = cardId;
    setTimeout(() => { const c = state.cards[cid]; if (c) c.scorePreviewNew = false; }, 260);
  } else if (!qualifies) {
    card.showScorePreview = false;
    card.scorePreviewNew  = false;
  }
}

/** Launch one score pip from fromRect toward toRect.
 *  Sequence: spawn → pop to 133% → back to 100% → travel to counter → fade out.
 *  Calls onArrival when it reaches the counter, onDone when fully faded. */
function launchPip(fromRect, toRect, onArrival, onDone) {
  const POP_UP_MS    = 110;
  const POP_DOWN_MS  = 130;
  const POP_TOTAL_MS = POP_UP_MS + POP_DOWN_MS;
  const TRAVEL_MS    = 550; // transform 0.55s
  const FADE_DONE_MS = 750; // opacity 0.15s delay + 0.6s

  const pip = document.createElement('div');
  pip.textContent = '🪙';
  Object.assign(pip.style, {
    position:      'fixed',
    left:          `${fromRect.left + fromRect.width  / 2}px`,
    top:           `${fromRect.top  + fromRect.height / 2}px`,
    transform:     'translate(-50%, -50%) scale(1)',
    fontSize:      '56px',
    lineHeight:    '1',
    pointerEvents: 'none',
    zIndex:        '9998',
    transition:    'none',
  });
  document.body.appendChild(pip);
  pip.getBoundingClientRect(); // force layout before first transition

  // Phase 1: pop up to 133%
  pip.style.transition = `transform ${POP_UP_MS}ms cubic-bezier(0.2, 0, 0.4, 1)`;
  pip.style.transform  = 'translate(-50%, -50%) scale(1.33)';

  // Phase 2: pop back to 100%
  setTimeout(() => {
    pip.style.transition = `transform ${POP_DOWN_MS}ms ease`;
    pip.style.transform  = 'translate(-50%, -50%) scale(1)';
  }, POP_UP_MS);

  // Phase 3: travel to score counter + fade
  const tx = (toRect.left + toRect.width  / 2) - (fromRect.left + fromRect.width  / 2);
  const ty = (toRect.top  + toRect.height / 2) - (fromRect.top  + fromRect.height / 2);
  setTimeout(() => {
    pip.style.transition = 'transform 0.55s cubic-bezier(0.2,0.8,0.3,1), opacity 0.6s ease 0.15s';
    pip.style.transform  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    pip.style.opacity    = '0';
    pip.addEventListener('transitionend', e => { if (e.propertyName === 'opacity') pip.remove(); });
  }, POP_TOTAL_MS);

  setTimeout(onArrival, POP_TOTAL_MS + TRAVEL_MS);
  setTimeout(onDone,    POP_TOTAL_MS + FADE_DONE_MS);
}

/** Fire pts pips one after the other (each waits for the previous to finish). */
function firePipsSequential(fromRect, toRect, pts, pipIndex, onAllDone) {
  if (pipIndex >= pts) { onAllDone(); return; }
  launchPip(fromRect, toRect,
    () => { state.score++; renderHUD(); },
    () => firePipsSequential(fromRect, toRect, pts, pipIndex + 1, onAllDone),
  );
}

/** Mutate one card to filled and record its discard tile. */
function fillOneCard(cardId) {
  const card = state.cards[cardId];
  if (!card) return;
  card.filled = true;
  card.scoreQueued = false;
  card.showScorePreview = false;
  const rank = cardRank(cardId);
  const suit = cardSuit(cardId);
  if (suit) {
    const col = DISCARD_RANKS.indexOf(rank);
    if (col >= 0) {
      if (!state.discards[col]) state.discards[col] = [];
      if (!state.discards[col].includes(suit)) state.discards[col].push(suit);
    }
  }
}

/** Animate and fill cards in queue one by one; calls onDone when the whole queue is done. */
function processCardFills(queue, index, onDone) {
  if (index >= queue.length) { setTimeout(() => onDone?.(), 420); return; }
  const { cardId, pts } = queue[index];

  const CONVERT_MS = 240;
  const next = () => {
    const cardEl = document.querySelector(`.converter-card[data-card-id="${cardId}"]`);
    if (cardEl) {
      cardEl.classList.add('is-converting');
      setTimeout(() => {
        fillOneCard(cardId);
        render();
        processCardFills(queue, index + 1, onDone);
      }, CONVERT_MS);
    } else {
      fillOneCard(cardId);
      render();
      processCardFills(queue, index + 1, onDone);
    }
  };

  if (pts === 0) { setTimeout(next, 320); return; }

  // Preview badge is already visible on the card (shown at die-placement time).
  // Fly the pip from the badge's position directly.
  const previewEl = document.querySelector(`.converter-card[data-card-id="${cardId}"] .score-preview`);
  const scoreEl   = document.getElementById('score-display');

  if (!previewEl || !scoreEl) {
    state.score += pts;
    renderHUD();
    next();
    return;
  }

  // Capture positions before the re-render detaches the badge element
  const fromRect = previewEl.getBoundingClientRect();
  const toRect   = scoreEl.getBoundingClientRect();

  // Hide the badge the moment the pip starts moving
  state.cards[cardId].showScorePreview = false;
  render();

  firePipsSequential(fromRect, toRect, pts, 0, next);
}

/* ── Phase management ── */
// Mark any grid card that has all 3 dice as filled, recording its tile in discards.
function convertFilledCards(onDone) {
  if (state.phase === 'place-dice')          { onDone?.(); return; }
  if (state.awaitingPostDiceGridPlace)       { onDone?.(); return; }

  const queue = [];
  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (card.filled || card.scoreQueued) continue; // scoreQueued prevents double-scoring during async pip animations
    if (card.slots.every(s => s !== null)) {
      card.scoreQueued = true;
      queue.push({ cardId, pts: evaluateCardScore(cardId) });
    }
  }

  if (queue.length === 0) { onDone?.(); return; }
  processCardFills(queue, 0, onDone);
}

function convertAllGridCards(onDone) {
  const scoreEl = document.getElementById('score-display');
  let pipDelay = 0; // cumulative stagger for pip launches
  // POP_TOTAL + FADE_DONE inside launchPip = 240 + 750 = 990 ms per pip tail
  const PIP_TAIL_MS = 990;
  const PIP_GAP_MS  = 830; // interval between consecutive pip starts

  for (const cardId of state.grid) {
    if (cardId === null) continue;
    const card = state.cards[cardId];
    if (!card) continue;

    if (!card.filled && !card.scoreQueued && card.slots.every(s => s !== null)) {
      card.scoreQueued = true;
      const pts = evaluateCardScore(cardId);
      if (pts > 0 && scoreEl) {
        const slotKey  = `${cardId}-1`;
        const holderEl = document.querySelector(`.holder-dice[data-slot="${slotKey}"]`);
        if (holderEl) {
          const fromRect = holderEl.getBoundingClientRect();
          const toRect   = scoreEl.getBoundingClientRect();
          for (let p = 0; p < pts; p++) {
            const d = pipDelay;
            setTimeout(() => launchPip(fromRect, toRect,
              () => { state.score++; renderHUD(); },
              () => {},
            ), d);
            pipDelay += PIP_GAP_MS;
          }
        } else {
          state.score += pts;
          renderHUD();
        }
      }
    }

    fillOneCard(cardId);
  }

  // Call onDone after the last pip animation finishes (or immediately if none)
  const totalMs = pipDelay > 0 ? (pipDelay - PIP_GAP_MS) + PIP_TAIL_MS + 80 : 0;
  if (onDone) setTimeout(onDone, totalMs);
}

function isAllDicePlaced() {
  return state.currentRoll.length > 0 &&
         state.currentRoll.every(id => dieInCard(id) !== null);
}

function isGridFullyFilled() {
  return state.grid.every(id => id !== null && state.cards[id]?.filled === true);
}

function showReplay() {
  state.phase = 'replay';
  render();
}

function renderWithPreviewFade() {
  const previewEl = document.querySelector('.upcoming-preview');
  if (previewEl) {
    previewEl.classList.add('is-exiting');
    setTimeout(() => render(), 180);
  } else {
    render();
  }
}

function spawnSecondDiceBatch() {
  state.isSecondDiceBatch = true;
  const ids = spawnDice(3);
  state.currentRoll = ids;
  state.trayOrder   = ids;
  state.diceAccentActive = true;
  state.newPreview = true;
  renderWithPreviewFade();
}

function checkPhaseTransition() {
  if (state.phase === 'place-card' && state.actionBarCards.length === 0) {
    // If a scoring animation is running, wait — commitScoringExit will call us again.
    if (state.scoringExit) return;

    // Before the very first dice round: show preview dice alongside a new card
    // rather than jumping straight to the dice phase. Only fires once (cardsPlaced === 1).
    if (state.currentRoll.length === 0 && state.cardsPlaced === 1) {
      const cardId = spawnCard();
      state.actionBarCards = [cardId];
      state.newCards = new Set([cardId]);
      state.newPreviewInCard = true; // preview dice appear from nothing — animate them in
      render();
      return;
    }

    state.phase = 'place-dice';
    state.awaitingPostDiceGridPlace = false;
    const allSlotsFilled = state.grid.every(id => id !== null);
    state.pendingSecondDiceBatch = allSlotsFilled;
    state.isSecondDiceBatch = false;
    const ids = spawnDice(3);
    state.currentRoll = ids;
    state.trayOrder   = ids;
    state.diceAccentActive = true;
    state.newPreview = true;
    renderWithPreviewFade();
  } else if (state.phase === 'place-dice' && isAllDicePlaced()) {
    if (state.isSecondDiceBatch) {
      // Second batch of the full-grid round — convert all cards, score, offer new cards.
      state.isSecondDiceBatch = false;
      convertAllGridCards(() => {
        const willScore = peekAnyScoringMatch();
        state.pendingSixDiceNewCard = !!willScore;
        resolveAllScoringSets();
        if (!state.scoringExit && isGridFullyFilled()) {
          showReplay();
          return;
        }
        render();
      });
      return;
    }
    if (state.pendingSecondDiceBatch) {
      // First batch of the full-grid round — convert any newly filled cards,
      // resolve scoring, then spawn the second batch.
      state.pendingSecondDiceBatch = false;
      const queue = [];
      for (const cardId of state.grid) {
        if (cardId === null) continue;
        const card = state.cards[cardId];
        if (card.filled || card.scoreQueued) continue;
        if (card.slots.every(s => s !== null)) {
          card.scoreQueued = true;
          queue.push({ cardId, pts: evaluateCardScore(cardId) });
        }
      }
      const afterConversion = () => {
        resolveAllScoringSets();
        if (state.scoringExit) {
          state.pendingSecondBatchAfterScoring = true;
        } else {
          spawnSecondDiceBatch();
        }
      };
      if (queue.length === 0) afterConversion();
      else processCardFills(queue, 0, afterConversion);
      return;
    }
    // Normal 3-dice path: offer a new hand card.
    state.phase = 'place-card';
    const cardId = spawnCard();
    state.actionBarCards = [cardId];
    state.newCards = new Set([cardId]);
    /* Filled conversion + scoring run only after this new card is placed on the grid. */
    state.awaitingPostDiceGridPlace = true;
    render();
  }
}

/* ── Rendering ── */
function renderHolderDice(cardId, si) {
  const card   = state.cards[cardId];
  const dieId  = card.slots[si];
  const slotKey = `${cardId}-${si}`;

  if (dieId === null) {
    return `<div class="holder-dice" data-slot="${slotKey}" data-card-id="${cardId}" data-slot-idx="${si}"></div>`;
  }

  // const joker = isJokerCard(cardId);
  let dv = state.dice[dieId].value;
  // if (joker && dv === 1) dv = 7;

  const locked = !state.currentRoll.includes(dieId);
  const isNew  = state.currentRoll.includes(dieId) && state.diceAccentActive;

  return `<div class="holder-dice${isNew ? ' is-new' : ''}" data-slot="${slotKey}" data-card-id="${cardId}" data-slot-idx="${si}">
    <div class="die-wrapper${locked ? ' is-locked' : ''}" data-name="dice_filled_pips" data-die-id="${dieId}" data-slot="${slotKey}"${locked ? ' data-locked="true"' : ''}>
      ${dieSVG(dv, 40)}
    </div>
  </div>`;
}

function renderCardHTML(cardId, inTray = false, gridDraggable = false) {
  const card      = state.cards[cardId];
  const rank      = cardRank(cardId);
  const suit      = cardSuit(cardId);
  const color     = cardColor(cardId);
  const textColor = color && color.toUpperCase() !== '#FFFFFF' ? color : '#D3D6E5';

  if (card.filled) {
    // Filled state: large centred index, no dice tiles
    return `<div class="converter-card converter-card--filled" data-card-id="${cardId}" style="color:${textColor}">
      <div class="card-index card-index--filled">
        <span class="card-rank card-rank--filled">${rank}</span>${suit ? `<span class="card-suit card-suit--filled">${suit}</span>` : ''}
      </div>
    </div>`;
  }

  const gridDragCls = gridDraggable ? ' converter-card--grid-draggable' : '';
  const selectedCls = state.selectedCardId === cardId ? ' is-selected' : '';

  const previewIsNew = !!card.scorePreviewNew;

  return `<div class="converter-card${inTray ? ' in-tray' : ''}${gridDragCls}${selectedCls}" data-card-id="${cardId}" style="color:${textColor}">
    ${card.showScorePreview ? `<div class="score-preview${previewIsNew ? ' is-new' : ''}">🪙</div>` : ''}
    <div class="card-index">
      <span class="card-rank">${rank}</span>${suit ? `<span class="card-suit">${suit}</span>` : ''}
    </div>
    <div class="card-dice">
      <div class="dice-tile dice-tile--top">${renderHolderDice(cardId, 1)}</div>
      <div class="dice-tile dice-tile--bottom">${renderHolderDice(cardId, 0)}${renderHolderDice(cardId, 2)}</div>
    </div>
  </div>`;
}

function renderGrid() {
  const el = document.getElementById('grid-container');
  const se = state.scoringExit;
  if (se?.phase === 'run') el.classList.add('is-scoring-sweep');
  else el.classList.remove('is-scoring-sweep');

  const tpl = document.querySelector('.template');
  if (se?.phase === 'run') tpl?.classList.add('template--score-sweep');
  else tpl?.classList.remove('template--score-sweep');

  el.innerHTML = Array(9).fill(0).map((_, i) => {
    const cardId = state.grid[i];
    const gridDrag = cardId !== null && cardIsGridRepositionable(cardId);
    let slotExtra = '';
    let slotStyle = '';
    if (se && cardId !== null && se.lineSlots.includes(i)) {
      const order = se.lineSlots.indexOf(i);
      slotStyle = ` style="--exit-order:${order}"`;
      if (se.phase === 'wait') {
        slotExtra = ' grid-slot--score-pending';
      } else if (se.phase === 'run') {
        slotExtra = ` grid-slot--score-sweep grid-slot--score-sweep--${se.lineKey}`;
      }
    }
    return `<div class="grid-slot${cardId !== null ? ' is-filled' : ''}${slotExtra}" data-grid-slot="${i}"${slotStyle}>
      ${cardId !== null ? renderCardHTML(cardId, false, gridDrag) : ''}
    </div>`;
  }).join('');
}

function renderActionBar() {
  const bar = document.getElementById('action-bar');
  bar.innerHTML = '';

  if (state.phase === 'replay') {
    bar.classList.remove('mode-dice');
    const btn = document.createElement('button');
    btn.id = 'replay-btn';
    btn.className = 'is-new';
    btn.textContent = 'REPLAY';
    bar.appendChild(btn);
    return;
  }

  if (state.phase === 'place-card') {
    bar.classList.remove('mode-dice');
    let newIdx = 0;
    state.actionBarCards.forEach(cardId => {
      const div = document.createElement('div');
      div.innerHTML = renderCardHTML(cardId, true);
      const el = div.firstElementChild;
      if (state.newCards?.has(cardId)) {
        el.classList.add('is-new');
        el.style.animationDelay = `${newIdx * 80}ms`;
        newIdx++;
      }
      bar.appendChild(el);
    });
    state.newCards?.clear();
  } else {
    bar.classList.add('mode-dice');
    const tray = document.createElement('div');
    tray.className = 'dice-tray';
    let newIdx = 0;
    state.trayOrder.forEach(dieId => {
      if (dieInCard(dieId) === null) {
        const w = document.createElement('div');
        w.className = 'die-wrapper';
        if (state.newDice?.has(dieId)) {
          w.classList.add('is-new');
          w.style.animationDelay = `${newIdx * 60}ms`;
          newIdx++;
        }
        w.dataset.name = 'dice_filled_pips';
        w.dataset.dieId = dieId;
        if (state.selectedDieId === dieId) w.classList.add('is-selected');
        w.innerHTML = dieSVG(state.dice[dieId].value, 40);
        tray.appendChild(w);
      }
    });
    bar.appendChild(tray);
    state.newDice?.clear(); // only animate on first render after spawn

    // Compute animation timing shared by the card ghost and preview dice.
    const isNewPreview = !!state.newPreview;
    state.newPreview = false;
    const playableCount = state.trayOrder.filter(id => dieInCard(id) === null).length;
    // Card ghost appears first, right after the last active die finishes animating in.
    const cardGhostDelay = isNewPreview ? (Math.max(playableCount, 1) - 1) * 60 + 320 : 0;
    // Preview dice follow after the card ghost animation completes + small gap.
    const basePreviewDelay = isNewPreview ? cardGhostDelay + 320 + 40 : 0;

    // Empty card ghost — preview of the next hand card, right side, below the dice.
    const cardGhostEl = document.createElement('div');
    cardGhostEl.className = `action-bar-card-ghost${isNewPreview ? ' is-new' : ''}`;
    if (isNewPreview) cardGhostEl.style.animationDelay = `${cardGhostDelay}ms`;
    cardGhostEl.innerHTML = `<div class="converter-card" style="color:#D3D6E5">
      <div class="card-index"><span class="card-rank"></span></div>
      <div class="card-dice">
        <div class="dice-tile dice-tile--top"><div class="holder-dice"></div></div>
        <div class="dice-tile dice-tile--bottom"><div class="holder-dice"></div><div class="holder-dice"></div></div>
      </div>
    </div>`;
    bar.appendChild(cardGhostEl);

    // Upcoming dice preview strip — animates in after the card ghost.
    const combo = peekNextDiceCombination();
    const preview = document.createElement('div');
    preview.className = 'upcoming-preview';
    preview.innerHTML = combo.map((v, idx) => {
      const cls = `die-wrapper${isNewPreview ? ' preview-is-new' : ''}`;
      const style = `pointer-events:none${isNewPreview ? `;animation-delay:${basePreviewDelay + idx * 60}ms` : ''}`;
      return `<div class="${cls}" style="${style}">${dieSVG(v, 40)}</div>`;
    }).join('');
    bar.appendChild(preview);
    return; // preview already appended; skip the block below
  }

  // Upcoming dice preview — place-card phase.
  // Hidden when no card is in the bar AND no dice round has started yet, to avoid
  // flashing during the 220 ms gap between card placement and checkPhaseTransition.
  if (state.phase !== 'replay' &&
      (state.actionBarCards.length > 0 && state.cardsPlaced > 0 || state.currentRoll.length > 0)) {
    const isNewPreview = !!state.newPreviewInCard;
    state.newPreviewInCard = false;
    // Card animates in at 0 ms; give it ~320 ms before preview dice stagger in.
    const combo = peekNextDiceCombination();
    const preview = document.createElement('div');
    preview.className = 'upcoming-preview';
    preview.innerHTML = combo.map((v, idx) => {
      const cls = `die-wrapper${isNewPreview ? ' preview-is-new' : ''}`;
      const style = `pointer-events:none${isNewPreview ? `;animation-delay:${320 + idx * 60}ms` : ''}`;
      return `<div class="${cls}" style="${style}">${dieSVG(v, 40)}</div>`;
    }).join('');
    bar.appendChild(preview);
  }
}

function renderDiscards() {
  const stacks = document.getElementById('discard-stacks');
  if (!stacks) return;
  stacks.innerHTML = DISCARD_RANKS.map((rank, i) => {
    const used = new Set(state.discards[i] || []);
    const entriesHTML = i === 0
      ? Array(4).fill(0).map((_, j) => {
          const converted = j < Math.min(used.size, 4);
          return `<span class="discard-entry${converted ? '' : ' is-dim'}" style="color:${SUIT_COLOR['V']}">V</span>`;
        }).join('')
      : DISPLAY_SUITS.map(suit => {
          const converted = used.has(suit);
          return `<span class="discard-entry${converted ? '' : ' is-dim'}" style="color:${SUIT_COLOR[suit]}">${suit}</span>`;
        }).join('');
    return `<div class="discard-suit">${entriesHTML}</div>`;
  }).join('');
}

function initDiscards() {
  const labels = document.getElementById('discard-labels');
  if (!labels) return;
  labels.innerHTML = ['V','A','2','3','4','5','6','7','8','9','10','aa','ab','ac']
    .map(l => `<div class="discard-label">${ndTranscribe(l)}</div>`).join('');
  renderDiscards();
}

function renderHUD() {
  const countEl = document.getElementById('card-count');
  const scoreEl = document.getElementById('score-display');
  if (countEl) countEl.textContent = Math.max(0, 52 - state.cardsPlaced);
  if (scoreEl) scoreEl.textContent = `${state.score} 🪙`;
}

function render() {
  renderGrid();
  renderActionBar();
  renderDiscards();
  renderHUD();
}


/* ── Game reset (shared by game-over overlay and REPLAY button) ── */
function resetGame() {
  state.grid           = Array(9).fill(null);
  state.cards          = [];
  state.actionBarCards = [];
  state.dice           = [];
  state.currentRoll    = [];
  state.trayOrder      = [];
  state.phase          = 'place-card';
  state.discards       = {};
  state.tickerTags     = [];
  state.stars          = 0;
  state.scoredSets     = [];
  state.awaitingPostDiceGridPlace = false;
  state.scoringExit = null;
  state.pendingSixDiceNewCard = false;
  state.pendingSecondDiceBatch = false;
  state.isSecondDiceBatch = false;
  state.pendingSecondBatchAfterScoring = false;
  state.diceDeck = [];
  state.score = 0;
  state.cardsPlaced = 0;
  state.diceAccentActive = true;
  state.newDice = null;
  state.newCards = null;
  state.newPreview = null;
  state.newPreviewInCard = null;
  state.selectedDieId = null;
  state.selectedCardId = null;
  clearScoreExitTimers();
  initDiscards();
  const c0 = spawnCard();
  state.actionBarCards = [c0];
  render();
}

/* ── Game over ── */
function showGameOver(reason) {
  document.getElementById('game-over-reason').textContent = reason;
  document.getElementById('game-over-overlay').classList.add('is-visible');
}

document.getElementById('game-over-restart').addEventListener('click', () => {
  document.getElementById('game-over-overlay').classList.remove('is-visible');
  resetGame();
});

document.addEventListener('click', e => {
  if (e.target.closest('#replay-btn')) { resetGame(); return; }

  // ── Tap-to-select / tap-to-place ──

  // Tray die: toggle selection
  const dieWrapper = e.target.closest('.die-wrapper');
  if (dieWrapper && !dieWrapper.dataset.locked && !dieWrapper.dataset.slot) {
    const dieId = parseInt(dieWrapper.dataset.dieId, 10);
    if (!isNaN(dieId) && dieInCard(dieId) === null) {
      state.selectedCardId = null;
      state.selectedDieId = state.selectedDieId === dieId ? null : dieId;
      render();
      return;
    }
  }

  // Holder-dice slot: place selected die
  const holderEl = e.target.closest('.holder-dice');
  if (holderEl) {
    if (state.selectedDieId !== null) {
      const slotKey = holderEl.dataset.slot;
      if (slotKey) {
        const [cidStr, siStr] = slotKey.split('-');
        const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
        const card = state.cards[cardId];
        if (card && card.slots[si] === null) {
          card.slots[si] = state.selectedDieId;
          state.selectedDieId = null;
          updateScorePreview(cardId);
          render();
          checkPhaseTransition();
          return;
        }
      }
    }
    // Occupied or no die selected — deselect
    state.selectedDieId = null;
    render();
    return;
  }

  // Tray card: toggle selection
  const cardEl = e.target.closest('.converter-card.in-tray');
  if (cardEl) {
    const cardId = parseInt(cardEl.dataset.cardId, 10);
    if (!isNaN(cardId)) {
      state.selectedDieId = null;
      state.selectedCardId = state.selectedCardId === cardId ? null : cardId;
      render();
      return;
    }
  }

  // Grid slot: place selected card
  const gridSlotEl = e.target.closest('.grid-slot');
  if (gridSlotEl && state.selectedCardId !== null) {
    const i = parseInt(gridSlotEl.dataset.gridSlot, 10);
    if (!isNaN(i) && state.grid[i] === null) {
      const placedCardId = state.selectedCardId;
      state.actionBarCards = state.actionBarCards.filter(id => id !== placedCardId);
      if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
      state.cardsPlaced++;
      state.grid[i] = placedCardId;
      state.diceAccentActive = false;
      state.selectedCardId = null;
      render();
      setTimeout(() => {
        convertFilledCards(() => {
          resolveAllScoringSets();
          render();
          checkPhaseTransition();
        });
      }, 220);
      return;
    }
    state.selectedCardId = null;
    render();
    return;
  }

  // Tapped elsewhere — clear selection
  if (state.selectedDieId !== null || state.selectedCardId !== null) {
    state.selectedDieId = null;
    state.selectedCardId = null;
    render();
  }
});

/* ── Drag & Drop ── */
const ghost = document.getElementById('drag-ghost');
let drag = null;
let dragStartX = 0, dragStartY = 0, dragCommitted = false;
const DRAG_THRESHOLD = 6;

document.addEventListener('pointerdown', e => {
  // ── Card drag (from action bar or repositionable grid card) ──
  const cardEl = e.target.closest('.converter-card.in-tray')
    || e.target.closest('.converter-card.converter-card--grid-draggable');
  if (cardEl) {
    e.preventDefault();
    const cardId = parseInt(cardEl.dataset.cardId, 10);
    const fromGrid = cardEl.classList.contains('converter-card--grid-draggable');
    const slotEl = fromGrid ? cardEl.closest('.grid-slot') : null;
    const fromGridIndex = slotEl ? parseInt(slotEl.dataset.gridSlot, 10) : null;
    if (fromGrid) {
      if (fromGridIndex === null || Number.isNaN(fromGridIndex)
          || state.grid[fromGridIndex] !== cardId || !cardIsGridRepositionable(cardId)) {
        return;
      }
    }
    drag = { type: 'card', cardId, originEl: cardEl, fromGrid, fromGridIndex };
    dragStartX = e.clientX; dragStartY = e.clientY; dragCommitted = false;
    cardEl.setPointerCapture(e.pointerId);
    return;
  }

  // ── Die drag ──
  const wrapper = e.target.closest('.die-wrapper');
  if (!wrapper || wrapper.dataset.locked) return;
  e.preventDefault();

  const dieId      = parseInt(wrapper.dataset.dieId, 10);
  const originSlot = wrapper.dataset.slot || null;

  drag = { type: 'die', dieId, originSlot, originEl: wrapper };
  dragStartX = e.clientX; dragStartY = e.clientY; dragCommitted = false;
  wrapper.setPointerCapture(e.pointerId);
}, { passive: false });

document.addEventListener('pointermove', e => {
  if (!drag) return;

  if (!dragCommitted) {
    const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
    if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
    // Threshold crossed — commit to drag, clear any selection
    dragCommitted = true;
    state.selectedDieId = null;
    state.selectedCardId = null;
    if (drag.type === 'card') {
      ghost.classList.remove('die-drag');
      ghost.innerHTML = renderCardHTML(drag.cardId);
      drag.originEl.classList.add('is-dragging');
    } else {
      ghost.classList.add('die-drag');
      ghost.innerHTML = dieSVG(state.dice[drag.dieId].value, 40);
      drag.originEl.classList.add('is-dragging');
    }
    ghost.style.left = e.clientX + 'px';
    ghost.style.top  = e.clientY + 'px';
    ghost.classList.add('is-visible');
  }

  ghost.style.left = e.clientX + 'px';
  ghost.style.top  = e.clientY + 'px';

  ghost.classList.remove('is-visible');
  if (drag.type === 'card') ghost.classList.remove('die-drag');
  const under = document.elementFromPoint(e.clientX, e.clientY);
  ghost.classList.add('is-visible');
  if (drag.type === 'die') ghost.classList.add('die-drag');

  if (drag.type === 'card') {
    document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
    const slot = under?.closest('.grid-slot');
    if (slot) {
      const gi = parseInt(slot.dataset.gridSlot, 10);
      const empty = state.grid[gi] === null;
      const origin = drag.fromGrid && drag.fromGridIndex === gi;
      if (empty || origin) slot.classList.add('drag-over');
    }
    return;
  }

  // die drag
  document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
  document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));

  const holderEl = under?.closest('.holder-dice');
  if (holderEl) {
    const slotKey = holderEl.dataset.slot;
    const [cidStr, siStr] = slotKey.split('-');
    const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
    const card = state.cards[cardId];
    const isLocked = card && card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
    if (!isLocked) holderEl.classList.add('drag-over');
  } else {
    const trayDie = under?.closest('.die-wrapper');
    if (trayDie && !trayDie.dataset.slot && parseInt(trayDie.dataset.dieId, 10) !== drag.dieId) {
      trayDie.classList.add('tray-swap-target');
    }
  }
}, { passive: true });

document.addEventListener('pointerup', e => {
  if (!drag) return;

  if (!dragCommitted) {
    // Tap — let the click event handle selection/placement
    drag = null;
    return;
  }

  ghost.classList.remove('is-visible');
  const under = document.elementFromPoint(e.clientX, e.clientY);
  ghost.classList.remove('is-visible');

  // ── Card drop ──
  if (drag.type === 'card') {
    document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
    const slot = under?.closest('.grid-slot');
    if (slot) {
      const i = parseInt(slot.dataset.gridSlot, 10);
      if (drag.fromGrid && drag.fromGridIndex === i) {
        if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
        drag = null;
        return;
      }
      if (state.grid[i] === null) {
        const fromGrid = drag.fromGrid;
        if (fromGrid) state.grid[drag.fromGridIndex] = null;
        else {
          state.actionBarCards = state.actionBarCards.filter(id => id !== drag.cardId);
          if (state.awaitingPostDiceGridPlace) state.awaitingPostDiceGridPlace = false;
          state.cardsPlaced++;
        }
        state.grid[i] = drag.cardId;
        drag = null;
        if (!fromGrid) state.diceAccentActive = false; // only drop accent on fresh placement, not grid repositions
        render(); // accent borders drop here; CSS transition plays
        setTimeout(() => {
          convertFilledCards(() => {
            resolveAllScoringSets();
            render();
            checkPhaseTransition();
          });
        }, 220); // wait for box-shadow transition to finish
        return;
      }
    }
    if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
    drag = null;
    return;
  }

  // ── Die drop ──
  document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
  document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));

  const holderEl   = under?.closest('.holder-dice');
  const trayDieEl  = !holderEl ? under?.closest('.die-wrapper') : null;
  const targetTrayId = trayDieEl && !trayDieEl.dataset.slot
    ? parseInt(trayDieEl.dataset.dieId, 10) : null;

  if (holderEl) {
    const slotKey = holderEl.dataset.slot;
    const [cidStr, siStr] = slotKey.split('-');
    const cardId = parseInt(cidStr, 10), si = parseInt(siStr, 10);
    const card = state.cards[cardId];
    if (!card) { drag = null; return; }

    // Illegal placement: never allow dropping onto an occupied holder.
    // Keep state unchanged so the die returns to where it came from.
    if (card.slots[si] !== null) {
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
      drag = null;
      return;
    }

    const isLocked = card.slots[si] !== null && !state.currentRoll.includes(card.slots[si]);
    if (isLocked) {
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
      drag = null;
      return;
    }

    // Remove die from its origin slot (if it came from a card slot)
    if (drag.originSlot) {
      const [ocStr, osiStr] = drag.originSlot.split('-');
      state.cards[parseInt(ocStr, 10)].slots[parseInt(osiStr, 10)] = null;
    }

    // Track origin card before clearing drag
    const originCardId = drag.originSlot
      ? parseInt(drag.originSlot.split('-')[0], 10) : null;

    card.slots[si] = drag.dieId;
    drag = null;

    // Show preview immediately on any affected card
    updateScorePreview(cardId);
    if (originCardId !== null && originCardId !== cardId) updateScorePreview(originCardId);
    render();
    checkPhaseTransition();

  } else if (targetTrayId !== null && targetTrayId !== drag.dieId) {
    // Swap tray order
    const ia = state.trayOrder.indexOf(drag.dieId);
    const ib = state.trayOrder.indexOf(targetTrayId);
    if (ia !== -1 && ib !== -1) {
      [state.trayOrder[ia], state.trayOrder[ib]] = [state.trayOrder[ib], state.trayOrder[ia]];
    }
    if (drag.originSlot) {
      const [ocStr, osiStr] = drag.originSlot.split('-');
      state.cards[parseInt(ocStr, 10)].slots[parseInt(osiStr, 10)] = null;
    }
    render();

  } else {
    // Drop onto nothing — return die to origin slot
    if (drag.originSlot) {
      // Origin state was never removed unless a legal target accepted the die,
      // so keep card slots unchanged and just re-render to restore visuals.
      render();
    } else {
      if (drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
    }
  }

  drag = null;
});

document.addEventListener('pointercancel', () => {
  if (!drag) return;
  if (dragCommitted && drag.originEl?.isConnected) drag.originEl.classList.remove('is-dragging');
  ghost.classList.remove('is-visible');
  ghost.classList.remove('die-drag');
  drag = null;
  document.querySelectorAll('.holder-dice').forEach(h => h.classList.remove('drag-over'));
  document.querySelectorAll('.die-wrapper').forEach(d => d.classList.remove('tray-swap-target'));
  document.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-over'));
});

/* ── Init ── */
initDiscards();
renderHUD();
const _c0 = spawnCard();
state.actionBarCards = [_c0];
render();
