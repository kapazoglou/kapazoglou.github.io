import manifest from '../../../assets/music/manifest.json';
import { settings } from '../../logic/settings.js';

const LOFI_SUFFIX = ' LoFi';
const LOAD_TIMEOUT_MS = 120_000;
const DEFAULT_LOOP_END_PADDING = 0.02;

/** Vite-resolved URLs so music ships in build output. */
const MUSIC_FILE_URLS = import.meta.glob('../../../assets/music/*.ogg', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** @type {Map<string, string>} filename → resolved URL */
const fileUrlMap = new Map();

/**
 * @typedef {object} CatalogEntry
 * @property {string} id
 * @property {string} label
 * @property {string} file
 * @property {number | undefined} loopStart
 * @property {number | undefined} loopEnd
 * @property {number | undefined} loopEndPadding
 */

/**
 * @typedef {object} LoopMix
 * @property {AudioBuffer} buffer
 * @property {number} loopStart
 * @property {number} loopEnd
 * @property {AudioBufferSourceNode | null} source
 * @property {number} startedAt
 * @property {number} offset
 * @property {boolean} playing
 */

/**
 * @typedef {object} TrackPlayer
 * @property {LoopMix} main
 * @property {LoopMix | null} lofi
 */

/** @type {Map<string, CatalogEntry>} */
const catalog = new Map();
/** @type {Map<string, TrackPlayer>} */
const trackPlayers = new Map();
/** @type {Map<string, Promise<TrackPlayer | null>>} */
const loadPromises = new Map();

/** @type {Set<() => void>} */
const loadListeners = new Set();

/** @type {AudioContext | null} */
let audioContext = null;
/** @type {GainNode | null} */
let masterGain = null;

let unlocked = false;
let booted = false;
let currentTrackId = 'off';
/** @type {(() => void) | null} */
let unlockHandler = null;
/** @type {string | null} track id currently being fetched/decoded */
let loadingTrackId = null;
let overlayActive = false;
/** @type {MutationObserver | null} */
let overlayObserver = null;

function resolveUrl(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.default === 'string') return value.default;
  return null;
}

function buildFileUrlMap() {
  fileUrlMap.clear();
  for (const [path, url] of Object.entries(MUSIC_FILE_URLS)) {
    const name = path.replace(/\\/g, '/').split('/').pop();
    const resolved = resolveUrl(url);
    if (name && resolved) fileUrlMap.set(name, resolved);
  }
}

function musicMasterGain() {
  const step = settings.musicVolume ?? 8;
  return Math.min(1, Math.max(0, step / 10));
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioContext = new Ctx();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    syncMasterGain();
    return audioContext;
  } catch {
    return null;
  }
}

function syncMasterGain() {
  if (masterGain) masterGain.gain.value = musicMasterGain();
}

function syncAllPlayerVolumes() {
  syncMasterGain();
}

function notifyLoadChange() {
  for (const fn of loadListeners) {
    try { fn(); } catch { /* ignore */ }
  }
}

function initCatalog() {
  catalog.clear();
  const entries = Array.isArray(manifest?.tracks) ? manifest.tracks : [];
  for (const entry of entries) {
    if (!entry?.id || !entry?.file?.trim()) continue;
    const file = entry.file.trim();
    if (!hasLofiFile(file)) continue;
    const baseLabel = entry.label?.trim() || entry.id;
    const label = `${baseLabel} +LoFi`;
    catalog.set(entry.id, {
      id: entry.id,
      label,
      file,
      loopStart: typeof entry.loopStart === 'number' ? entry.loopStart : undefined,
      loopEnd: typeof entry.loopEnd === 'number' ? entry.loopEnd : undefined,
      loopEndPadding: typeof entry.loopEndPadding === 'number' ? entry.loopEndPadding : undefined,
    });
  }
}

function resolveAssetUrl(path) {
  if (!path?.trim()) return null;
  const base = import.meta.env.BASE_URL ?? '/';
  return new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`).href;
}

function musicFileUrl(filename) {
  const normalized = filename.replace(/\\/g, '/');
  return fileUrlMap.get(normalized) ?? resolveAssetUrl(`assets/music/${normalized}`);
}

function lofiFileCandidates(mainFile) {
  const dot = mainFile.lastIndexOf('.');
  if (dot <= 0) return [];
  const base = mainFile.slice(0, dot);
  const ext = mainFile.slice(dot);
  return [
    `${base}.LoFi${ext}`,
    `${base}${LOFI_SUFFIX}${ext}`,
  ];
}

function hasLofiFile(mainFile) {
  return lofiFileCandidates(mainFile).some((path) => fileUrlMap.has(path));
}

function resolveLoopPoints(entry, buffer) {
  const duration = buffer.duration;
  const loopStart = entry.loopStart ?? 0;
  let loopEnd;
  if (entry.loopEnd != null) {
    loopEnd = entry.loopEnd;
  } else {
    const padding = entry.loopEndPadding ?? DEFAULT_LOOP_END_PADDING;
    loopEnd = duration - padding;
  }
  loopEnd = Math.max(loopStart + 0.001, Math.min(loopEnd, duration));
  return { loopStart, loopEnd };
}

function loopSpan(mix) {
  return mix.loopEnd - mix.loopStart;
}

function wrapLoopTime(mix, time) {
  const span = loopSpan(mix);
  if (span <= 0) return mix.loopStart;
  const rel = ((time - mix.loopStart) % span + span) % span;
  return mix.loopStart + rel;
}

function getMixTime(mix) {
  if (!mix.playing || !audioContext) return mix.offset;
  const elapsed = audioContext.currentTime - mix.startedAt;
  const span = loopSpan(mix);
  const rel = ((mix.offset - mix.loopStart + elapsed) % span + span) % span;
  return mix.loopStart + rel;
}

function stopMix(mix) {
  const t = getMixTime(mix);
  if (mix.playing && mix.source) {
    try { mix.source.stop(); } catch { /* already stopped */ }
    mix.source.disconnect();
    mix.source = null;
    mix.playing = false;
  }
  mix.offset = t;
  return t;
}

function startMix(mix) {
  const ctx = getAudioContext();
  if (!ctx || !masterGain || !mix.buffer) return;

  if (mix.playing) stopMix(mix);

  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const source = ctx.createBufferSource();
  source.buffer = mix.buffer;
  source.loop = true;
  source.loopStart = mix.loopStart;
  source.loopEnd = mix.loopEnd;
  source.connect(masterGain);

  const startAt = wrapLoopTime(mix, mix.offset);
  source.start(0, startAt);

  mix.source = source;
  mix.startedAt = ctx.currentTime;
  mix.offset = startAt;
  mix.playing = true;

  source.onended = () => {
    if (mix.source !== source) return;
    mix.playing = false;
    mix.source = null;
  };
}

function createMix(decoded) {
  return {
    buffer: decoded.buffer,
    loopStart: decoded.loopStart,
    loopEnd: decoded.loopEnd,
    source: null,
    startedAt: 0,
    offset: decoded.loopStart,
    playing: false,
  };
}

async function decodeTrackAudio(url, entry) {
  const ctx = getAudioContext();
  if (!ctx) throw new Error('Web Audio unavailable');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('audio fetch failed');
    const data = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(data);
    const { loopStart, loopEnd } = resolveLoopPoints(entry, buffer);
    return { buffer, loopStart, loopEnd };
  } finally {
    clearTimeout(timer);
  }
}

async function attachLofiVariant(trackId, mainFile, entry, player) {
  for (const lofiPath of lofiFileCandidates(mainFile)) {
    const lofiUrl = musicFileUrl(lofiPath);
    if (!lofiUrl) continue;
    try {
      const decoded = await decodeTrackAudio(lofiUrl, entry);
      player.lofi = createMix(decoded);
      if (currentTrackId === trackId) syncOverlayPlayback();
      return;
    } catch { /* optional LoFi */ }
  }
}

async function loadTrackPlayer(trackId) {
  if (trackPlayers.has(trackId)) return trackPlayers.get(trackId);
  if (loadPromises.has(trackId)) return loadPromises.get(trackId);

  const entry = catalog.get(trackId);
  if (!entry) return null;

  const promise = (async () => {
    loadingTrackId = trackId;
    notifyLoadChange();

    try {
      const mainUrl = musicFileUrl(entry.file);
      if (!mainUrl) return null;

      const decoded = await decodeTrackAudio(mainUrl, entry);
      const player = { main: createMix(decoded), lofi: null };
      trackPlayers.set(trackId, player);

      if (currentTrackId === trackId) {
        syncOverlayPlayback();
        tryAutoplayUnlock();
      }

      attachLofiVariant(trackId, entry.file, entry, player);

      return player;
    } catch {
      return null;
    } finally {
      if (loadingTrackId === trackId) loadingTrackId = null;
      notifyLoadChange();
    }
  })();

  loadPromises.set(trackId, promise);
  try {
    return await promise;
  } finally {
    loadPromises.delete(trackId);
  }
}

export function isMusicLoading() {
  return loadingTrackId != null;
}

export function getMusicLoadProgress() {
  return { loaded: loadingTrackId ? 0 : 1, total: 1 };
}

export function onMusicLoadChange(fn) {
  loadListeners.add(fn);
  return () => loadListeners.delete(fn);
}

export function isMusicAvailable() {
  return catalog.size > 0;
}

/** Dropdown options — catalog is instant; loading only while the active track fetches. */
export function getMusicSelectOptions() {
  const options = [];
  if (loadingTrackId) {
    options.push({ value: '__loading__', label: 'Loading…', disabled: true });
  }
  options.push({ value: 'off', label: 'Off' });
  for (const entry of catalog.values()) {
    options.push({ value: entry.id, label: entry.label });
  }
  return options;
}

export function clampMusicTrackSetting() {
  if (settings.musicTrack === 'off') return;
  if (!catalog.has(settings.musicTrack)) settings.musicTrack = 'off';
}

function pauseAllPlayers() {
  for (const player of trackPlayers.values()) {
    stopMix(player.main);
    if (player.lofi) stopMix(player.lofi);
  }
}

function pickActiveMix(player) {
  if (overlayActive && player.lofi) return player.lofi;
  return player.main;
}

function syncOverlayPlayback() {
  if (currentTrackId === 'off') return;
  const player = trackPlayers.get(currentTrackId);
  if (!player) return;

  const want = pickActiveMix(player);
  const idle = want === player.main ? player.lofi : player.main;

  if (idle?.playing) {
    const t = stopMix(idle);
    if (want.playing) stopMix(want);
    want.offset = t;
    syncMasterGain();
    if (!want.playing) startMix(want);
    return;
  }

  syncMasterGain();
  if (!want.playing) startMix(want);
}

function setOverlayActive(on) {
  if (overlayActive === on) return;
  overlayActive = on;
  syncOverlayPlayback();
}

function probeOverlayState() {
  const settingsOpen = document.getElementById('settings-panel')?.classList.contains('is-open');
  const gameOverOpen = document.getElementById('game-over-overlay')?.classList.contains('is-visible');
  const suitDiscoveryOpen = !!document.getElementById('suit-discovery-overlay');
  setOverlayActive(!!settingsOpen || !!gameOverOpen || suitDiscoveryOpen);
}

/** Re-probe overlay DOM (settings, game-over, suit-discovery hold). */
export function syncMusicOverlayState() {
  probeOverlayState();
}

function watchOverlays() {
  const targets = [
    document.getElementById('settings-panel'),
    document.getElementById('game-over-overlay'),
  ].filter(Boolean);
  if (!targets.length) return;

  overlayObserver?.disconnect();
  overlayObserver = new MutationObserver(probeOverlayState);
  for (const el of targets) {
    overlayObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }
  probeOverlayState();
}

function beginTrackPlayback(trackId) {
  if (trackId === 'off' || !catalog.has(trackId)) {
    currentTrackId = 'off';
    pauseAllPlayers();
    return;
  }

  pauseAllPlayers();
  currentTrackId = trackId;

  const player = trackPlayers.get(trackId);
  if (player) syncOverlayPlayback();
}

async function playTrack(trackId) {
  if (trackId === 'off' || !catalog.has(trackId)) {
    beginTrackPlayback('off');
    return;
  }

  beginTrackPlayback(trackId);

  if (trackPlayers.has(trackId)) return;

  const player = await loadTrackPlayer(trackId);
  if (!player || currentTrackId !== trackId) return;

  syncOverlayPlayback();
}

function removeUnlockListener() {
  if (!unlockHandler) return;
  document.removeEventListener('pointerdown', unlockHandler, true);
  document.removeEventListener('keydown', unlockHandler, true);
  unlockHandler = null;
}

/** Resume AudioContext when allowed; prime graph already running while suspended. */
async function tryAutoplayUnlock() {
  if (unlocked || currentTrackId === 'off') return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    await ctx.resume();
  } catch { return; }
  if (ctx.state !== 'running') return;
  unlocked = true;
  removeUnlockListener();
  syncOverlayPlayback();
}

function setupUnlockListener() {
  if (unlockHandler) return;

  unlockHandler = () => { tryAutoplayUnlock(); };
  document.addEventListener('pointerdown', unlockHandler, { passive: true, capture: true });
  document.addEventListener('keydown', unlockHandler, { capture: true });
}

/** After persisted settings load: preload selected track and start playback. */
export function bootstrapMusic() {
  if (!booted || !catalog.size) return;
  clampMusicTrackSetting();
  applyMusicTrack();
  tryAutoplayUnlock();
  window.addEventListener('load', () => tryAutoplayUnlock(), { once: true });
}

/** Preload a track (main first; LoFi follows). Never throws. */
export function preloadMusic(trackId = settings.musicTrack) {
  if (trackId === 'off') return Promise.resolve();
  return loadTrackPlayer(trackId).then(() => {});
}

/** Load track if needed — safe when settings opens. */
export function ensureMusicPreload(trackId = settings.musicTrack) {
  if (!catalog.size || trackId === 'off') return Promise.resolve();
  return preloadMusic(trackId);
}

/** Draft preview while settings is open — load + play when gesture-unlocked. */
export function previewMusicTrack(trackId) {
  if (trackId === 'off') {
    beginTrackPlayback('off');
    return;
  }
  if (!catalog.has(trackId)) return;

  beginTrackPlayback(trackId);

  const player = trackPlayers.get(trackId);
  if (player) {
    syncOverlayPlayback();
    tryAutoplayUnlock();
    return;
  }

  loadTrackPlayer(trackId);
}

export function applyMusicVolume() {
  syncAllPlayerVolumes();
}

export function applyMusicTrack() {
  clampMusicTrackSetting();
  const id = settings.musicTrack;
  if (id === 'off') {
    beginTrackPlayback('off');
    return;
  }
  if (!unlocked) {
    currentTrackId = id;
    preloadMusic(id).then(() => {
      syncOverlayPlayback();
      tryAutoplayUnlock();
    });
    tryAutoplayUnlock();
    return;
  }

  const player = trackPlayers.get(id);
  currentTrackId = id;
  if (player) {
    pauseAllPlayers();
    syncOverlayPlayback();
    return;
  }

  playTrack(id);
}

/** Boot: build catalog + overlay watcher. Tracks decode on demand via Web Audio. */
export function initMusic() {
  if (booted) return;
  booted = true;
  buildFileUrlMap();
  initCatalog();

  if (!catalog.size) return;

  watchOverlays();
  setupUnlockListener();
}
