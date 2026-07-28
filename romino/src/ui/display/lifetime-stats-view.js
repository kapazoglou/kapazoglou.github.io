import { getLifetimeStats, getLifetimeDerived } from '../../logic/game-log.js';
import { SUIT_COLOR, DISCARD_RANKS, JOKER_RANK } from '../../logic/dice-visual.js';

/** 13 rank rows: A + 2–12 + joker. */
const LIFETIME_TILE_RANKS = ['A', ...DISCARD_RANKS.slice(2, 13), JOKER_RANK];
/** Suit columns left → right: Z, X, Y, W. */
const LIFETIME_TILE_SUITS = ['Z', 'X', 'Y', 'W'];

export function formatAvg(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function lifetimeTileMatrixHTML(tileCounts) {
  const headerCells = LIFETIME_TILE_SUITS.map(suit => {
    const color = SUIT_COLOR[suit] ?? 'var(--text-dim)';
    return `<th class="go-tile-matrix-suit" scope="col" style="color:${color}">${suit}</th>`;
  }).join('');

  const bodyRows = LIFETIME_TILE_RANKS.map(rank => {
    const cells = LIFETIME_TILE_SUITS.map(suit => {
      const count = tileCounts[`${suit}:${rank}`] ?? 0;
      const filled = count > 0 ? ' go-tile-matrix-cell--filled' : '';
      return `<td class="go-tile-matrix-cell${filled}">${count}</td>`;
    }).join('');
    return `<tr>
      <th class="go-tile-matrix-rank" scope="row">${rank}</th>
      ${cells}
    </tr>`;
  }).join('');

  return `<table class="go-tile-matrix">
    <thead>
      <tr>
        <th class="go-tile-matrix-corner" scope="col"></th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

export function lifetimeDiceBarsHTML(dicePct) {
  const maxPct = Math.max(...Object.values(dicePct), 1);
  let bars = '';
  for (let n = 1; n <= 6; n++) {
    const pct = dicePct[n] ?? 0;
    const height = Math.max(4, Math.round((pct / maxPct) * 100));
    bars += `<div class="go-dice-bar-col">
      <div class="go-dice-bar" style="height:${height}%"></div>
      <span class="go-dice-bar-label">${n}</span>
    </div>`;
  }
  return `<div class="go-dice-bars">${bars}</div>`;
}

function sweepCountFromRecord(record) {
  return record.bankEvents.reduce((sum, e) => sum + e.sweeps.length, 0);
}

export function updateMatrixSegUI(segEl, mode) {
  if (!segEl) return;
  for (const btn of segEl.querySelectorAll('.go-tile-matrix-seg-btn[data-mode]')) {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }
}

/**
 * @param {{
 *   settingsObj: object,
 *   summaryId: string,
 *   starsId: string,
 *   diceId: string,
 *   tilesId: string,
 *   compareId?: string | null,
 *   compareRecord?: object | null,
 *   matrixMode?: 'converted' | 'swept',
 *   matrixSegId?: string | null,
 * }} opts
 */
export function renderLifetimeStatsView(opts) {
  const {
    settingsObj,
    summaryId,
    starsId,
    diceId,
    tilesId,
    compareId = null,
    compareRecord = null,
    matrixMode = 'converted',
    matrixSegId = null,
  } = opts;

  const lifetime = getLifetimeStats(settingsObj);
  const derived = getLifetimeDerived(lifetime);

  const summaryEl = document.getElementById(summaryId);
  if (summaryEl) {
    summaryEl.textContent = `${lifetime.gamesPlayed} games · avg ${formatAvg(derived.avgScore)} pts · ${lifetime.totalRolls} rolls`;
  }

  const starsEl = document.getElementById(starsId);
  if (starsEl) {
    starsEl.textContent = `⭐ ${lifetime.totalStarsEarned} earned · ${lifetime.totalStarsSpent} spent`;
  }

  if (compareId && compareRecord) {
    const compareEl = document.getElementById(compareId);
    const runSweeps = sweepCountFromRecord(compareRecord);
    if (compareEl) {
      compareEl.innerHTML = `
      <div class="go-compare-row">
        <span class="go-compare-label">score</span>
        <span class="go-compare-run">${compareRecord.score}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgScore)} avg</span>
      </div>
      <div class="go-compare-row">
        <span class="go-compare-label">rolls</span>
        <span class="go-compare-run">${compareRecord.rolls}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgRolls)} avg</span>
      </div>
      <div class="go-compare-row">
        <span class="go-compare-label">sweeps</span>
        <span class="go-compare-run">${runSweeps}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgSweepRuns)} avg</span>
      </div>
      <div class="go-compare-row">
        <span class="go-compare-label">stars</span>
        <span class="go-compare-run">${compareRecord.starsEarned}</span>
        <span class="go-compare-vs">vs</span>
        <span class="go-compare-avg">${formatAvg(derived.avgStarsEarned)} avg</span>
      </div>`;
    }
  }

  const diceEl = document.getElementById(diceId);
  if (diceEl) diceEl.innerHTML = lifetimeDiceBarsHTML(derived.dicePct);

  const counts = matrixMode === 'swept' ? lifetime.sweepTileCounts : lifetime.tileCounts;
  const tilesEl = document.getElementById(tilesId);
  if (tilesEl) tilesEl.innerHTML = lifetimeTileMatrixHTML(counts);

  if (matrixSegId) {
    updateMatrixSegUI(document.getElementById(matrixSegId), matrixMode);
  }

  return lifetime;
}
