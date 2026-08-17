import { settings } from '../../logic/settings.js';

/** @type {AudioContext | null} */
let audioContext = null;
/** @type {GainNode | null} */
let musicGain = null;
/** @type {GainNode | null} */
let sfxGain = null;

/** @type {Set<() => void>} */
const unlockListeners = new Set();
/** @type {(() => void) | null} */
let unlockHandler = null;

/** Web Audio SFX loudness multiplier (HTML Audio caps at 1.0 per element). */
const SFX_GAIN_BOOST = 2.5;

function stepToGain(step) {
  return Math.min(1, Math.max(0, (step ?? 8) / 10));
}

/** Slider 0–10 → master multiplier; applied at each play (not only on bus). */
export function sfxStepToGain(step = settings.sfxVolume) {
  const s = Math.min(10, Math.max(0, step ?? 8));
  return (s / 10) * SFX_GAIN_BOOST;
}

export function syncMusicGain() {
  if (!musicGain) return;
  const gain = stepToGain(settings.musicVolume);
  const ctx = audioContext;
  if (ctx && ctx.state !== 'closed') {
    musicGain.gain.setValueAtTime(gain, ctx.currentTime);
  } else {
    musicGain.gain.value = gain;
  }
}

/** Singleton AudioContext — returns null when Web Audio is unavailable. */
export function getAudioContext() {
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioContext = new Ctx();
    musicGain = audioContext.createGain();
    sfxGain = audioContext.createGain();
    musicGain.connect(audioContext.destination);
    sfxGain.connect(audioContext.destination);
    syncMusicGain();
    syncSfxGain();
    return audioContext;
  } catch {
    return null;
  }
}

/** Music bus — connect BufferSourceNodes here. */
export function getMusicGainNode() {
  getAudioContext();
  return musicGain;
}

/** SFX bus — connect per-play gain nodes here. */
export function getSfxGainNode() {
  getAudioContext();
  return sfxGain;
}

export function syncSfxGain() {
  if (!sfxGain) return;
  // SFX master volume is applied per-play in sfx.js; bus stays unity.
  const gain = 1;
  const ctx = audioContext;
  if (ctx && ctx.state !== 'closed') {
    sfxGain.gain.setValueAtTime(gain, ctx.currentTime);
  } else {
    sfxGain.gain.value = gain;
  }
}

/** Resume suspended context after user gesture. Returns true when running. */
export async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'running') return true;
  try {
    await ctx.resume();
  } catch {
    return false;
  }
  return ctx.state === 'running';
}

/** Register callback fired once context resumes from a gesture. */
export function onAudioUnlock(fn) {
  unlockListeners.add(fn);
  return () => unlockListeners.delete(fn);
}

function notifyUnlockListeners() {
  for (const fn of unlockListeners) {
    try { fn(); } catch { /* ignore */ }
  }
}

/** One document-level unlock listener shared by music and SFX. */
export function setupAudioUnlock() {
  if (unlockHandler) return;

  unlockHandler = async () => {
    const ok = await resumeAudioContext();
    if (ok) notifyUnlockListeners();
  };
  document.addEventListener('pointerdown', unlockHandler, { passive: true, capture: true });
  document.addEventListener('keydown', unlockHandler, { capture: true });
}
