import { state } from './state.js';
import { settings } from './settings.js';

const LOG_KEY = 'romino-v2-game-log';
const LIFETIME_KEY = 'romino-v2-lifetime-stats';
const MAX_LOG_ENTRIES = 100;

function newEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Stable id for a settings snapshot — same config always maps to the same key. */
export function settingsConfigId(settingsObj) {
  const keys = Object.keys(settingsObj).sort();
  let str = '';
  for (const k of keys) str += `${k}:${JSON.stringify(settingsObj[k])};`;
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function emptyDiceFrequency() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

function createEmptyLifetime() {
  return {
    gamesPlayed: 0,
    totalScore: 0,
    totalRolls: 0,
    totalSweepRuns: 0,
    totalBankPoints: 0,
    totalStarsEarned: 0,
    totalStarsSpent: 0,
    totalTilesCreated: 0,
    diceFrequency: emptyDiceFrequency(),
    tileCounts: {},
    sweepPatternCounts: {},
    sweepTileCounts: {},
    lastUpdated: null,
  };
}

/** Ordered suit:rank keys joined — column order preserved. */
export function sweepSignature(tiles) {
  return tiles.map(t => `${t.suit}:${t.rank}`).join('|');
}

export function tileCountKey(suit, rank) {
  return `${suit}:${rank}`;
}

function createSession() {
  return {
    diceFrequency: emptyDiceFrequency(),
    starsEarned: 0,
    starsSpent: 0,
    tilesCreated: [],
    bankEvents: [],
    pendingBank: null,
  };
}

/** @type {ReturnType<typeof createSession>} */
let session = createSession();

export function snapshotSettings() {
  return { ...settings };
}

export function resetGameLog() {
  session = createSession();
}

export function recordDiceOutcome(value) {
  if (value >= 1 && value <= 6) {
    session.diceFrequency[value] += 1;
  }
}

export function recordStarsEarned(count) {
  if (count > 0) session.starsEarned += count;
}

export function recordStarSpent(_reason) {
  session.starsSpent += 1;
}

/** @param {{ suit: string, rank: string, rankSum: number }} tile */
export function recordTileCreated(tile, col) {
  session.tilesCreated.push({
    suit: tile.suit,
    rank: tile.rank,
    rankSum: tile.rankSum,
    col,
  });
}

export function beginBankCycle(starsAtStart) {
  session.pendingBank = { starsBanked: starsAtStart, sweeps: [] };
}

/** @param {Array<{ suit: string, rank: string, rankSum: number }>} tiles */
export function recordSweepRun(tiles, multiplier) {
  if (!session.pendingBank) return;
  session.pendingBank.sweeps.push({
    cardCount: tiles.length,
    multiplier,
    tiles: tiles.map(t => ({
      suit: t.suit,
      rank: t.rank,
      rankSum: t.rankSum,
    })),
  });
}

export function commitBankCycle(maxMult, starsBanked) {
  if (!session.pendingBank?.sweeps.length) {
    session.pendingBank = null;
    return;
  }
  session.bankEvents.push({
    starsBanked,
    multiplier: maxMult,
    pointsGained: starsBanked * maxMult,
    sweeps: session.pendingBank.sweeps,
  });
  session.pendingBank = null;
}

export function cancelBankCycle() {
  session.pendingBank = null;
}

export function getSessionSnapshot() {
  return {
    diceFrequency: { ...session.diceFrequency },
    starsEarned: session.starsEarned,
    starsSpent: session.starsSpent,
    tilesCreated: [...session.tilesCreated],
    bankEvents: session.bankEvents.map(e => ({
      ...e,
      sweeps: e.sweeps.map(s => ({ ...s, tiles: [...s.tiles] })),
    })),
  };
}

/** @param {{ reason?: string }} opts */
export function buildGameRecord({ reason = '' } = {}) {
  return {
    id: newEntryId(),
    at: new Date().toISOString(),
    gameOverReason: reason,
    score: state.points,
    rolls: state.rollCount,
    starsEarned: session.starsEarned,
    starsSpent: session.starsSpent,
    diceFrequency: { ...session.diceFrequency },
    tilesCreated: session.tilesCreated.map(t => ({ ...t })),
    bankEvents: session.bankEvents.map(e => ({
      starsBanked: e.starsBanked,
      multiplier: e.multiplier,
      pointsGained: e.pointsGained,
      sweeps: e.sweeps.map(s => ({
        cardCount: s.cardCount,
        multiplier: s.multiplier,
        tiles: s.tiles.map(t => ({ ...t })),
      })),
    })),
    settings: snapshotSettings(),
  };
}

/** @param {unknown} record */
function isValidGameRecord(record) {
  return (
    record != null &&
    typeof record === 'object' &&
    typeof record.id === 'string' &&
    typeof record.at === 'string' &&
    typeof record.score === 'number' &&
    typeof record.rolls === 'number'
  );
}

function saveGameLog(entries) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch { /* ignore quota / private mode */ }
}

export function getGameLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidGameRecord);
  } catch {
    return [];
  }
}

export function getGameLogEntry(id) {
  return getGameLog().find(e => e.id === id) ?? null;
}

/** @param {ReturnType<typeof buildGameRecord>} record */
export function appendGameRecord(record) {
  const log = [...getGameLog(), record];
  saveGameLog(log.slice(-MAX_LOG_ENTRIES));
}

function parseLifetimeStats(parsed) {
  const base = createEmptyLifetime();
  if (parsed == null || typeof parsed !== 'object') return base;
  base.gamesPlayed = Number(parsed.gamesPlayed) || 0;
  base.totalScore = Number(parsed.totalScore) || 0;
  base.totalRolls = Number(parsed.totalRolls) || 0;
  base.totalSweepRuns = Number(parsed.totalSweepRuns) || 0;
  base.totalBankPoints = Number(parsed.totalBankPoints) || 0;
  base.totalStarsEarned = Number(parsed.totalStarsEarned) || 0;
  base.totalStarsSpent = Number(parsed.totalStarsSpent) || 0;
  base.totalTilesCreated = Number(parsed.totalTilesCreated) || 0;
  base.lastUpdated = typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : null;
  for (let n = 1; n <= 6; n++) {
    base.diceFrequency[n] = Number(parsed.diceFrequency?.[n]) || 0;
  }
  if (parsed.tileCounts && typeof parsed.tileCounts === 'object') {
    for (const [key, val] of Object.entries(parsed.tileCounts)) {
      base.tileCounts[key] = Number(val) || 0;
    }
  }
  if (parsed.sweepPatternCounts && typeof parsed.sweepPatternCounts === 'object') {
    for (const [key, val] of Object.entries(parsed.sweepPatternCounts)) {
      base.sweepPatternCounts[key] = Number(val) || 0;
    }
  }
  if (parsed.sweepTileCounts && typeof parsed.sweepTileCounts === 'object') {
    for (const [key, val] of Object.entries(parsed.sweepTileCounts)) {
      base.sweepTileCounts[key] = Number(val) || 0;
    }
  }
  return base;
}

/** @returns {Record<string, { settings: object, stats: ReturnType<typeof createEmptyLifetime> }>} */
function loadLifetimeMap() {
  try {
    const raw = localStorage.getItem(LIFETIME_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return {};
    if (typeof parsed.gamesPlayed === 'number' && parsed.stats == null) {
      return {};
    }
    const map = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (entry?.stats != null) {
        map[id] = {
          settings: entry.settings ?? {},
          stats: parseLifetimeStats(entry.stats),
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

/** @param {Record<string, { settings: object, stats: object }>} map */
function saveLifetimeMap(map) {
  try {
    localStorage.setItem(LIFETIME_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

/** @param {ReturnType<typeof createEmptyLifetime>} lifetime */
/** @param {ReturnType<typeof buildGameRecord>} record */
function mergeRecordIntoLifetime(lifetime, record) {
  lifetime.gamesPlayed += 1;
  lifetime.totalScore += record.score;
  lifetime.totalRolls += record.rolls;
  lifetime.totalStarsEarned += record.starsEarned;
  lifetime.totalStarsSpent += record.starsSpent;
  lifetime.totalTilesCreated += record.tilesCreated.length;

  for (const event of record.bankEvents) {
    lifetime.totalBankPoints += event.pointsGained;
    lifetime.totalSweepRuns += event.sweeps.length;
    for (const sweep of event.sweeps) {
      const sig = sweepSignature(sweep.tiles);
      lifetime.sweepPatternCounts[sig] = (lifetime.sweepPatternCounts[sig] ?? 0) + 1;
      for (const tile of sweep.tiles) {
        const key = tileCountKey(tile.suit, tile.rank);
        lifetime.sweepTileCounts[key] = (lifetime.sweepTileCounts[key] ?? 0) + 1;
      }
    }
  }

  for (let n = 1; n <= 6; n++) {
    lifetime.diceFrequency[n] += record.diceFrequency[n] ?? 0;
  }

  for (const tile of record.tilesCreated) {
    const key = tileCountKey(tile.suit, tile.rank);
    lifetime.tileCounts[key] = (lifetime.tileCounts[key] ?? 0) + 1;
  }

  lifetime.lastUpdated = new Date().toISOString();
}

/** Lifetime stats for one settings configuration (empty if none played yet). */
export function getLifetimeStats(settingsObj = snapshotSettings()) {
  const id = settingsConfigId(settingsObj);
  const map = loadLifetimeMap();
  return map[id]?.stats ?? createEmptyLifetime();
}

/** Config bucket for settings, or null if no game logged under that config. */
export function getLifetimeConfig(settingsObj = snapshotSettings()) {
  const id = settingsConfigId(settingsObj);
  return loadLifetimeMap()[id] ?? null;
}

/** All config buckets that have at least one logged game. */
export function listLifetimeConfigs() {
  return loadLifetimeMap();
}

/** @param {ReturnType<typeof buildGameRecord>} record */
export function updateLifetimeStats(record) {
  const id = settingsConfigId(record.settings);
  const map = loadLifetimeMap();
  if (!map[id]) {
    map[id] = { settings: { ...record.settings }, stats: createEmptyLifetime() };
  }
  mergeRecordIntoLifetime(map[id].stats, record);
  saveLifetimeMap(map);
}

export function rebuildLifetimeStatsFromLog() {
  const map = {};
  for (const record of getGameLog()) {
    if (!record.settings) continue;
    const id = settingsConfigId(record.settings);
    if (!map[id]) {
      map[id] = { settings: { ...record.settings }, stats: createEmptyLifetime() };
    }
    mergeRecordIntoLifetime(map[id].stats, record);
  }
  saveLifetimeMap(map);
  return map;
}

/** @param {ReturnType<typeof getLifetimeStats>} lifetime */
export function getLifetimeDerived(lifetime) {
  const games = lifetime.gamesPlayed || 1;
  const diceTotal = Object.values(lifetime.diceFrequency).reduce((a, b) => a + b, 0);
  const dicePct = {};
  for (let n = 1; n <= 6; n++) {
    dicePct[n] = diceTotal > 0 ? (lifetime.diceFrequency[n] / diceTotal) * 100 : 0;
  }
  return {
    avgScore: lifetime.totalScore / games,
    avgRolls: lifetime.totalRolls / games,
    avgSweepRuns: lifetime.totalSweepRuns / games,
    avgStarsEarned: lifetime.totalStarsEarned / games,
    diceTotal,
    dicePct,
  };
}

export function exportGameLogJSON() {
  return JSON.stringify(getGameLog(), null, 2);
}
