const STORAGE_KEY = 'romino-v2-highscores';
const MAX_ENTRIES = 10;

/** @typedef {{ id: string, score: number, rolls: number, sweeps: number, at: string }} HighscoreEntry */

function newEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** @param {HighscoreEntry[]} entries */
function sortHighscores(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.rolls !== b.rolls) return a.rolls - b.rolls;
    if (a.sweeps !== b.sweeps) return a.sweeps - b.sweeps;
    return b.at.localeCompare(a.at);
  });
}

/** @returns {HighscoreEntry[]} */
export function getHighscores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortHighscores(parsed.filter(isValidEntry));
  } catch {
    return [];
  }
}

/** @param {unknown} entry */
function isValidEntry(entry) {
  return (
    entry != null &&
    typeof entry === 'object' &&
    typeof entry.id === 'string' &&
    typeof entry.score === 'number' &&
    typeof entry.rolls === 'number' &&
    typeof entry.sweeps === 'number' &&
    typeof entry.at === 'string'
  );
}

function saveHighscores(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore quota / private mode */ }
}

/**
 * Append a run, keep top 10, persist.
 * @param {{ score: number, rolls: number, sweeps: number }} run
 * @returns {{ entry: HighscoreEntry, rank: number|null, saved: boolean }}
 */
export function recordHighscore(run) {
  const entry = {
    id: newEntryId(),
    score: run.score,
    rolls: run.rolls,
    sweeps: run.sweeps,
    at: new Date().toISOString(),
  };

  const merged = sortHighscores([...getHighscores(), entry]);
  const top = merged.slice(0, MAX_ENTRIES);
  saveHighscores(top);

  const rankIndex = top.findIndex(e => e.id === entry.id);
  return {
    entry,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    saved: rankIndex >= 0,
  };
}
