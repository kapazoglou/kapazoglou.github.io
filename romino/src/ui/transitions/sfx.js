import manifest from '../../../assets/sfx/manifest.json';
import { settings } from '../../logic/settings.js';

const MAX_CONCURRENT = 6;
const SFX_DIR = 'assets/sfx';

/** Vite-resolved URLs so SFX ship in build output (same pattern as music). */
const SFX_FILE_URLS = import.meta.glob('../../../assets/sfx/*.{mp3,ogg,wav,m4a,MP3,OGG,WAV,M4A}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** @type {Map<string, string>} filename → resolved URL */
const fileUrlMap = new Map();

/** @type {Map<string, string | null>} null = known missing / unconfigured */
const resolvedUrlCache = new Map();
/** @type {Map<string, HTMLAudioElement>} warmed URL → template element */
const preloadPool = new Map();
/** @type {Promise<void> | null} */
let preloadPromise = null;
/** @type {HTMLAudioElement[]} */
const activeInstances = [];
let unlocked = false;

function resolveUrl(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.default === 'string') return value.default;
  return null;
}

function buildFileUrlMap() {
  fileUrlMap.clear();
  for (const [path, url] of Object.entries(SFX_FILE_URLS)) {
    const name = path.replace(/\\/g, '/').split('/').pop();
    const resolved = resolveUrl(url);
    if (name && resolved) fileUrlMap.set(name, resolved);
  }
}

buildFileUrlMap();

function masterGain() {
  const step = settings.sfxVolume ?? 8;
  return Math.min(1, Math.max(0, step / 10));
}

function entryFilename(entry) {
  const raw = entry?.file ?? entry?.url ?? '';
  return typeof raw === 'string' ? raw.trim() : '';
}

function resolveAssetUrl(path) {
  if (!path?.trim()) return null;
  const base = import.meta.env.BASE_URL ?? '/';
  return new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`).href;
}

/** Bare filename → Vite URL or assets/sfx/filename; full http(s) URL passthrough. */
function sfxFileUrl(filename) {
  const normalized = filename.replace(/\\/g, '/').trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('//')) return normalized;
  if (normalized.includes('/')) return resolveAssetUrl(normalized);
  return fileUrlMap.get(normalized) ?? resolveAssetUrl(`${SFX_DIR}/${normalized}`);
}

function resolveEntryUrl(id) {
  if (resolvedUrlCache.has(id)) {
    return resolvedUrlCache.get(id);
  }

  const entry = manifest[id];
  const filename = entryFilename(entry);
  if (!filename) {
    resolvedUrlCache.set(id, null);
    return null;
  }

  const href = sfxFileUrl(filename);
  resolvedUrlCache.set(id, href);
  return href;
}

function markUnavailable(id) {
  resolvedUrlCache.set(id, null);
}

function markUrlUnavailable(url) {
  for (const id of Object.keys(manifest)) {
    if (resolveEntryUrl(id) === url) markUnavailable(id);
  }
  preloadPool.delete(url);
}

function collectPreloadUrls() {
  const urls = new Set();
  for (const id of Object.keys(manifest)) {
    const href = resolveEntryUrl(id);
    if (href) urls.add(href);
  }
  return urls;
}

function preloadOne(url) {
  const existing = preloadPool.get(url);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const audio = new Audio();
    audio.preload = 'auto';

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('loadeddata', onReady);
      audio.removeEventListener('error', onFail);
      if (ok) {
        preloadPool.set(url, audio);
        resolve(audio);
      } else {
        markUrlUnavailable(url);
        resolve(null);
      }
    };
    const onReady = () => finish(true);
    const onFail = () => finish(false);

    audio.addEventListener('canplaythrough', onReady);
    audio.addEventListener('loadeddata', onReady);
    audio.addEventListener('error', onFail, { once: true });
    audio.src = url;
    audio.load();
  });
}

/** Warm all configured manifest clips at boot — gameplay never blocked on failure. */
export function preloadSfx() {
  if (!preloadPromise) {
    preloadPromise = Promise.all([...collectPreloadUrls()].map(preloadOne)).then(() => {});
  }
  return preloadPromise;
}

function ensureUnlocked() {
  if (unlocked) return true;
  const ua = navigator.userActivation;
  if (ua?.isActive || ua?.hasBeenActive) {
    unlocked = true;
    return true;
  }
  return false;
}

function trimActiveInstances() {
  while (activeInstances.length > MAX_CONCURRENT) {
    const stale = activeInstances.shift();
    stale?.pause();
  }
}

function playInstance(id, volumeScale = 1) {
  const entry = manifest[id];
  if (!entry || !entryFilename(entry)) return;

  const href = resolveEntryUrl(id);
  if (!href) return;

  try {
    const vol = Math.min(1, Math.max(0, (entry.volume ?? 1) * masterGain() * volumeScale));
    const warmed = preloadPool.get(href);
    const instance = warmed ? new Audio(warmed.src) : new Audio(href);
    instance.preload = 'auto';
    instance.volume = vol;

    const onEnd = () => {
      const idx = activeInstances.indexOf(instance);
      if (idx >= 0) activeInstances.splice(idx, 1);
      instance.removeEventListener('ended', onEnd);
      instance.removeEventListener('error', onError);
    };
    const onError = () => {
      markUnavailable(id);
      onEnd();
    };

    instance.addEventListener('ended', onEnd);
    instance.addEventListener('error', onError, { once: true });

    activeInstances.push(instance);
    trimActiveInstances();

    instance.play().catch(() => {
      onEnd();
    });
  } catch {
    markUnavailable(id);
  }
}

function unlockFromGesture() {
  unlocked = true;
}

/** Call once at boot — unlock audio on first user gesture (mobile autoplay policy). */
export function initSfx() {
  document.addEventListener('pointerdown', unlockFromGesture, { passive: true, capture: true });
  document.addEventListener('keydown', unlockFromGesture, { capture: true });
}

/** @param {string} id — manifest key */
export function playSfx(id, opts = {}) {
  if (!settings.sfxEnabled) return;
  if (!ensureUnlocked()) return;
  const { delay = 0, volumeScale = 1 } = opts;
  if (delay > 0) {
    setTimeout(() => playInstance(id, volumeScale), delay);
    return;
  }
  playInstance(id, volumeScale);
}

/** Even index → primary, odd → alt (0-based). Alt id defaults to `${primary}_2`. */
export function playSfxVariant(primary, alt, index, opts = {}) {
  const altId = alt ?? `${primary}_2`;
  playSfx(index % 2 === 0 ? primary : altId, opts);
}
