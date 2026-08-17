/** Decorative Dicier-icon texture — bidirectional row stream + oscillating rotation, clipped by viewport. */

import { settings, spd } from '../../logic/settings.js';
import { state } from '../../logic/state.js';

const FONT_FAMILY_LIGHT = 'Dicier Round Light';
const FONT_FAMILY_DARK = 'Dicier Round Dark';
const COL_PX = 25;
const ROW_PX = 20;
const FONT_PX = 10;
const SCROLL_PX_PER_S = 3.2;
const ROT_DEG_PER_S = 0.4;
const ROT_TURN_MIN_DEG = 60;
const ROT_TURN_MAX_DEG = 90;
const RAMP_MS = 3000;
/** Max speed boost when dice pool is empty (1 = baseline at full pool). */
const POOL_SPEED_BOOST = 0.25;

/** @returns {number} */
function randomTurnLimitDeg() {
  return ROT_TURN_MIN_DEG + Math.random() * (ROT_TURN_MAX_DEG - ROT_TURN_MIN_DEG);
}

/** Distance covered during one sin/cos speed ramp (deg or px). */
function rampDistance(speedPerS, rampSec) {
  return speedPerS * rampSec * 2 / Math.PI;
}

/** @param {number} t 0..1 within ramp — 0 at start, 1 at end */
function accelVelFactor(t) {
  return Math.sin(Math.PI * 0.5 * t);
}

/** @param {number} t 0..1 within ramp — 1 at start, 0 at end */
function decelVelFactor(t) {
  return Math.cos(Math.PI * 0.5 * t);
}

/** @param {number} rampSec @param {number} covered @param {number} total */
function rampPhaseTime(rampSec, covered, total) {
  if (total <= 0) return 0;
  const u = Math.max(0, Math.min(1, covered / total));
  return rampSec * Math.acos(Math.max(-1, 1 - u)) * 2 / Math.PI;
}
const ROW_BUFFER = 8;
const SYMBOL_CYCLE_MIN_MS = 12000;
const SYMBOL_CYCLE_MAX_MS = 45000;
const CODES_URL = 'assets/Dicier v1_5_4/Dicier codes v1_5_4.txt';
/** dlig codes — not used; keep Round Light default ligatures only */
const ROUND_LIGHT_SKIP = new Set(['16', '32', '64']);

const OFFSCREEN_PAD_ROWS = 4;

/** @param {string} line */
function isRoundLightCode(line) {
  if (!line || line.endsWith(':') || line.includes('etc.')) return false;
  if (/^[a-zà-ÿ\s\-]+:$/u.test(line)) return false;
  if (ROUND_LIGHT_SKIP.has(line)) return false;
  if (/^[\u0590-\u05FF]+$/u.test(line)) return false;
  return /^[A-ZÀ-ÖØ-Þ0-9][A-ZÀ-ÖØ-Þ0-9_]*$/u.test(line);
}

/** @returns {Promise<string[]>} */
async function loadDicierCodes() {
  try {
    const res = await fetch(CODES_URL);
    if (!res.ok) throw new Error(String(res.status));
    const core = (await res.text()).split(/^FRANÇAIS:/m)[0].split(/^season suits:/m)[0];
    const seen = new Set();
    const codes = [];
    for (const raw of core.split('\n')) {
      const line = raw.trim();
      if (!isRoundLightCode(line) || seen.has(line)) continue;
      seen.add(line);
      codes.push(line);
    }
    return codes;
  } catch {
    return FALLBACK_CODES;
  }
}

const FALLBACK_CODES = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'D6', 'D20', 'D4', 'D8', 'D10', 'D12', 'D2', 'BARREL',
  'YES', 'NO', 'PLUS', 'MINUS', 'HEADS', 'TAILS',
  'ACE_HEARTS', 'KING_SPADES', 'JOKER', '3_5', '6_6', 'ANY_ANY',
  'HEAVEN', 'FIRE', 'WATER', 'CROSS', 'CHECK', 'QUESTION',
  'NUN', 'GIMEL', 'Z_STAR', 'Z_CIRCLE', 'EVEN', 'ODD',
];

/** Standalone suits + value_suit combos use Round Dark. */
const STANDALONE_SUITS = new Set(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES']);
const SUIT_SUFFIX = /_(HEARTS|DIAMONDS|CLUBS|SPADES)$/;

/** @param {string} code */
function isSuitCode(code) {
  return STANDALONE_SUITS.has(code) || SUIT_SUFFIX.test(code);
}

/** @param {HTMLElement} cell @param {string} code */
function setCellCode(cell, code) {
  cell.textContent = code;
  cell.classList.toggle('dicier--dark', isSuitCode(code));
}

/** @param {string[]} codes @returns {string} */
function pickCode(codes) {
  return codes[Math.floor(Math.random() * codes.length)];
}

/** @param {string[]} codes @param {string} current */
function pickCodeExcept(codes, current) {
  if (codes.length <= 1) return pickCode(codes);
  let next = pickCode(codes);
  for (let i = 0; i < 8 && next === current; i++) next = pickCode(codes);
  return next;
}

function randomSymbolCycleMs() {
  const min = spd(SYMBOL_CYCLE_MIN_MS);
  const max = spd(SYMBOL_CYCLE_MAX_MS);
  return min + Math.random() * (max - min);
}

/** Full pool = 1×; empty pool = up to 1 + POOL_SPEED_BOOST. */
function poolSpeedMult() {
  const cap = Math.max(1, settings.nDice);
  const ratio = Math.max(0, Math.min(1, state.dicePool / cap));
  return 1 + POOL_SPEED_BOOST * (1 - ratio);
}

/** @type {WeakMap<HTMLElement, { idleRemainingS: number }>} */
const cellSymbolState = new WeakMap();

/** @param {HTMLElement} cell */
function initCellSymbolCycle(cell) {
  cellSymbolState.set(cell, {
    idleRemainingS: randomSymbolCycleMs() / 1000,
  });
}

/**
 * Per-cell symbol swaps on independent random timers (no per-cell opacity — master layer owns fill/blend).
 * @param {HTMLElement} grid
 * @param {number} dt wall seconds
 * @param {number} poolMult dice-pool speed scale
 * @param {string[]} codes
 */
function tickSymbolCycles(grid, dt, poolMult, codes) {
  const vfxDt = dt * poolMult;
  const cells = grid.querySelectorAll('.bg-dicier-vfx__cell');

  for (const raw of cells) {
    if (!(raw instanceof HTMLElement)) continue;
    let meta = cellSymbolState.get(raw);
    if (!meta) {
      initCellSymbolCycle(raw);
      meta = cellSymbolState.get(raw);
      if (!meta) continue;
    }

    meta.idleRemainingS -= vfxDt;
    if (meta.idleRemainingS <= 0) {
      setCellCode(raw, pickCodeExcept(codes, raw.textContent ?? ''));
      meta.idleRemainingS = randomSymbolCycleMs() / 1000;
    }
  }
}

/** @type {Promise<void> | null} */
let fontReady = null;

/** @type {HTMLElement | null} */
let vfxMount = null;

/** @type {{ pause(): void; resume(): void } | null} */
let vfxAnim = null;

/** Show or hide the Dicier background layer per `settings.vfxEnabled`. */
export function applyBgDicierVfx() {
  if (!vfxMount) return;
  const on = settings.vfxEnabled !== false;
  vfxMount.hidden = !on;
  if (on) vfxAnim?.resume();
  else vfxAnim?.pause();
}

function loadDicierFont() {
  if (!fontReady) {
    fontReady = Promise.all([
      document.fonts.load(`${FONT_PX}px ${FONT_FAMILY_LIGHT}`),
      document.fonts.load(`${FONT_PX}px ${FONT_FAMILY_DARK}`),
    ]).catch(() => {});
  }
  return fontReady;
}

/** @param {number} cols @param {string[]} codes */
function createRow(cols, codes) {
  const row = document.createElement('div');
  row.className = 'bg-dicier-vfx__row';
  for (let c = 0; c < cols; c++) {
    const cell = document.createElement('span');
    cell.className = 'bg-dicier-vfx__cell dicier';
    setCellCode(cell, pickCode(codes));
    initCellSymbolCycle(cell);
    row.appendChild(cell);
  }
  return row;
}

/** @param {HTMLElement} mount */
function getGridExtents(mount) {
  const row = document.getElementById('placement-row');
  const host = mount.parentElement;
  const designW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--design-width')) || 733;
  const designH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--design-height')) || 412;
  let reach = Math.hypot(designW, designH) * 0.5;

  if (row && host) {
    const hRect = host.getBoundingClientRect();
    const rRect = row.getBoundingClientRect();
    const cx = rRect.left + rRect.width * 0.5;
    const cy = rRect.top + rRect.height * 0.5;
    for (const [x, y] of [
      [hRect.left, hRect.top], [hRect.right, hRect.top],
      [hRect.left, hRect.bottom], [hRect.right, hRect.bottom],
    ]) {
      reach = Math.max(reach, Math.hypot(x - cx, y - cy));
    }
  }

  reach += ROW_PX * OFFSCREEN_PAD_ROWS;
  return {
    cols: Math.ceil((2 * reach) / COL_PX) + 4,
    rows: Math.ceil((2 * reach) / ROW_PX) + ROW_BUFFER * 2,
  };
}

/** @param {HTMLElement} row @param {HTMLElement} mount @param {number} margin */
function isRowOffScreen(row, mount, margin) {
  const clip = mount.getBoundingClientRect();
  const box = row.getBoundingClientRect();
  return box.bottom < clip.top - margin
    || box.top > clip.bottom + margin
    || box.right < clip.left - margin
    || box.left > clip.right + margin;
}

/**
 * @param {HTMLElement} mount
 * @param {string[]} codes
 */
function startStream(mount, codes) {
  let { cols, rows: rowCount } = getGridExtents(mount);

  const motion = document.createElement('div');
  motion.className = 'bg-dicier-vfx__motion';

  const grid = document.createElement('div');
  grid.className = 'bg-dicier-vfx__grid dicier';
  grid.style.setProperty('--bg-dicier-cols', String(cols));
  grid.style.setProperty('--bg-dicier-col-pitch', `${COL_PX}px`);
  grid.style.setProperty('--bg-dicier-row-pitch', `${ROW_PX}px`);

  for (let r = 0; r < rowCount; r++) {
    grid.appendChild(createRow(cols, codes));
  }

  motion.appendChild(grid);
  mount.replaceChildren(motion);

  /** Pivot rotation on #placement-row center; refresh grid span if layout shifts. */
  function updatePivot() {
    const row = document.getElementById('placement-row');
    const host = mount.parentElement;
    if (!row || !host) return;
    const hRect = host.getBoundingClientRect();
    const rRect = row.getBoundingClientRect();
    motion.style.left = `${rRect.left + rRect.width * 0.5 - hRect.left}px`;
    motion.style.top = `${rRect.top + rRect.height * 0.5 - hRect.top}px`;

    const next = getGridExtents(mount);
    if (next.cols > cols) {
      const add = next.cols - cols;
      cols = next.cols;
      grid.style.setProperty('--bg-dicier-cols', String(cols));
      for (const rowEl of grid.querySelectorAll('.bg-dicier-vfx__row')) {
        for (let i = 0; i < add; i++) {
          const cell = document.createElement('span');
          cell.className = 'bg-dicier-vfx__cell dicier';
          setCellCode(cell, pickCode(codes));
          initCellSymbolCycle(cell);
          rowEl.appendChild(cell);
        }
      }
    }
    while (grid.childElementCount < next.rows) {
      grid.appendChild(createRow(cols, codes));
    }
  }

  updatePivot();
  requestAnimationFrame(updatePivot);

  const rowEl = document.getElementById('placement-row');
  if (rowEl && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(updatePivot);
    ro.observe(rowEl);
    ro.observe(mount.parentElement ?? mount);
  } else {
    window.addEventListener('resize', updatePivot);
  }

  let scrollY = 0;
  let motionDir = Math.random() < 0.5 ? 1 : -1;
  let turnLimitDeg = randomTurnLimitDeg();
  let legFrom = -motionDir * turnLimitDeg;
  let legTo = motionDir * turnLimitDeg;
  let rotation = legFrom + (legTo - legFrom) * (0.04 + Math.random() * 0.92);
  let motionSign = Math.sign(legTo - legFrom) || 1;
  /** @type {'accel' | 'cruise' | 'decel'} */
  let legPhase = 'cruise';
  let phaseTime = 0;
  let lastTs = 0;
  let rafId = 0;
  let paused = false;

  {
    const rampSec = spd(RAMP_MS) / 1000;
    const rampDist = rampDistance(ROT_DEG_PER_S, rampSec);
    const distFrom = Math.abs(rotation - legFrom);
    const distTo = Math.abs(legTo - rotation);
    const legSpan = Math.abs(legTo - legFrom);
    if (legSpan <= rampDist * 2) {
      legPhase = distTo <= distFrom ? 'decel' : 'accel';
      phaseTime = rampPhaseTime(
        rampSec,
        legPhase === 'accel' ? distFrom : rampDist - distTo,
        rampDist,
      );
    } else if (distFrom < rampDist) {
      legPhase = 'accel';
      phaseTime = rampPhaseTime(rampSec, distFrom, rampDist);
    } else if (distTo < rampDist) {
      legPhase = 'decel';
      phaseTime = rampPhaseTime(rampSec, rampDist - distTo, rampDist);
    }
  }

  motion.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

  /** Flip scroll + spawn/cull ends; pick next turn limit for the following leg. */
  function reverseMotion() {
    motionDir *= -1;
    turnLimitDeg = randomTurnLimitDeg();
  }

  function beginLeg(from, to) {
    legFrom = from;
    legTo = to;
    motionSign = Math.sign(legTo - legFrom) || motionSign;
    legPhase = 'accel';
    phaseTime = 0;
  }

  /** @param {number} ts */
  function frame(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    const animScale = 1000 / spd(1000);
    const poolMult = poolSpeedMult();
    const rampSec = spd(RAMP_MS) / 1000;
    const rotSpeed = ROT_DEG_PER_S * animScale * poolMult;
    const scrollSpeed = SCROLL_PX_PER_S * animScale * poolMult;
    const rampDist = rampDistance(rotSpeed, rampSec);

    if (legPhase === 'accel') {
      const t = Math.min(1, phaseTime / rampSec);
      const vel = accelVelFactor(t);
      rotation += motionSign * rotSpeed * dt * vel;
      scrollY += motionDir * scrollSpeed * dt * vel;
      phaseTime += dt;
      if (phaseTime >= rampSec) {
        legPhase = 'cruise';
        phaseTime = 0;
      }
    } else if (legPhase === 'cruise') {
      rotation += motionSign * rotSpeed * dt;
      scrollY += motionDir * scrollSpeed * dt;
      if (Math.abs(legTo - rotation) <= rampDist) {
        legPhase = 'decel';
        phaseTime = 0;
      }
    } else {
      const t = Math.min(1, phaseTime / rampSec);
      const vel = decelVelFactor(t);
      rotation += motionSign * rotSpeed * dt * vel;
      scrollY += motionDir * scrollSpeed * dt * vel;
      phaseTime += dt;
      if (phaseTime >= rampSec || (motionSign > 0 ? rotation >= legTo : rotation <= legTo)) {
        rotation = legTo;
        reverseMotion();
        beginLeg(legTo, motionDir * turnLimitDeg);
      }
    }

    if (motionDir > 0) {
      while (scrollY >= ROW_PX) {
        const first = grid.firstElementChild;
        if (!(first instanceof HTMLElement) || !isRowOffScreen(first, mount, ROW_PX * 2)) break;
        scrollY -= ROW_PX;
        grid.removeChild(first);
        grid.appendChild(createRow(cols, codes));
      }
    } else {
      while (scrollY <= -ROW_PX) {
        const last = grid.lastElementChild;
        if (!(last instanceof HTMLElement) || !isRowOffScreen(last, mount, ROW_PX * 2)) break;
        scrollY += ROW_PX;
        grid.removeChild(last);
        grid.prepend(createRow(cols, codes));
      }
    }

    tickSymbolCycles(grid, dt, poolMult, codes);

    motion.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    grid.style.transform = `translateY(${-scrollY}px)`;
    rafId = requestAnimationFrame(frame);
  }

  function pause() {
    if (paused) return;
    paused = true;
    cancelAnimationFrame(rafId);
    lastTs = 0;
  }

  function resume() {
    if (!paused) return;
    if (document.hidden || settings.vfxEnabled === false) return;
    paused = false;
    lastTs = 0;
    rafId = requestAnimationFrame(frame);
  }

  vfxAnim = { pause, resume };
  rafId = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else resume();
  });
}

export async function initBgDicierVfx() {
  vfxMount = document.getElementById('bg-dicier-vfx');
  if (!vfxMount) return;
  await loadDicierFont();
  const codes = await loadDicierCodes();
  if (!codes.length) return;
  startStream(vfxMount, codes);
  applyBgDicierVfx();
}
