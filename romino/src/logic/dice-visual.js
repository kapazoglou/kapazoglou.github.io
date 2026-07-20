/* ── Die / tile visual constants (v2 colors, Square v1 die geometry) ── */

export const COLOR_BG = '#334466';
export const COLOR_ACCENT = '#FFE500';
export const COLOR_ACCENT_DARK = '#E5B800';
export const COLOR_TILE_BORDER = '#4c6699'; /* mirror --tile-border in base.css */
export const COLOR_ROLL_FACE = '#BFBFBF';
export const COLOR_OVERLAY = '#545454';

/** Face fill per die value (v2 palette) */
export const DIE_FACE_COLOR = {
  1: '#404A59', 2: '#906BFF', 3: '#E56700',
  4: '#71BD00', 5: '#00B6D6', 6: '#404A59',
};

export const PIP_POS = {
  tl: [31, 9], tr: [31, 31], ml: [20, 9], c: [20, 20], mr: [20, 31], bl: [9, 9], br: [9, 31],
};

export const PIP_PATTERN = {
  0: [], 1: ['c'], 2: ['tl', 'br'], 3: ['tr', 'c', 'bl'],
  4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'],
  6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
};

export const ALL_PIPS = ['tl', 'tr', 'ml', 'c', 'mr', 'bl', 'br'];

export const SUIT_LETTER = { 0: 'V', 1: 'V', 2: 'Z', 3: 'X', 4: 'Y', 5: 'W', 6: 'V' };

export const SUIT_COLOR = {
  V: '#E5B800', Z: '#906BFF', X: '#E56700', Y: '#71BD00', W: '#00B6D6',
};

export const SUIT_BADGE_ORDER = ['W', 'Y', 'Z', 'X'];

export const DISCARD_RANKS = ['★', 'A', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'aj', 'aa', 'ab', 'ac'];

export function rankGlyphFromSum(sum) {
  if (sum === 1) return 'A';
  if (sum < 2 || sum > 12) return '?';
  return DISCARD_RANKS[sum];
}

export function suitFromValue(value) {
  return SUIT_LETTER[value] ?? 'V';
}

export const JOKER_RANK = '*';

export function isInnerDie(value) {
  return value >= 2 && value <= 5;
}

/** Three distinct inner dice (2–5) — tricolor joker stack. */
export function isTricolorStack(values) {
  if (values.length !== 3) return false;
  if (!values.every(isInnerDie)) return false;
  return new Set(values).size === 3;
}

/** Tricolor joker with second + third summing to 7 (stricter tricolors variant). */
export function isTricolorSevensStack(values) {
  return isTricolorStack(values) && values[1] + values[2] === 7;
}

/** Missing value from {2,3,4,5} when three distinct inner dice are present. */
export function missingInnerDieFromTricolor(values) {
  for (let v = 2; v <= 5; v++) {
    if (!values.includes(v)) return v;
  }
  return null;
}

function jokerIdentityFromTricolor(values) {
  const missing = missingInnerDieFromTricolor(values);
  return {
    suit: suitFromValue(missing),
    rank: JOKER_RANK,
    rankSum: 0,
    bottomValue: values[0],
  };
}

function jokerIdentityFromTricolorSevens(values) {
  return {
    suit: suitFromValue(values[0]),
    rank: JOKER_RANK,
    rankSum: 0,
    bottomValue: values[0],
  };
}

/** Rank/suit identity for a completed 3-dice stack [bottom, mid, top]. */
export function tileIdentityFromStackValues(values, { tricolors = false, tricolorSevens = false } = {}) {
  if (tricolors) {
    if (tricolorSevens && isTricolorSevensStack(values)) {
      return jokerIdentityFromTricolorSevens(values);
    }
    if (!tricolorSevens && isTricolorStack(values)) {
      return jokerIdentityFromTricolor(values);
    }
  }
  const bottomValue = values[0];
  const isAce = (values[1] === 1 && values[2] === 6) || (values[1] === 6 && values[2] === 1);
  const rankSum = isAce ? 1 : values[1] + values[2];
  return {
    suit: suitFromValue(bottomValue),
    rank: rankGlyphFromSum(rankSum),
    rankSum,
    bottomValue,
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Raise HSL lightness by factor (1.5 = 50% more brightness). When ×factor would clip to white, use 50% of remaining headroom instead (keeps hue on bright faces like purple). */
export function brightenHex(hex, factor = 1.5) {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  let l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  const scaled = l * factor;
  l = scaled >= 1 ? l + (1 - l) * (factor - 1) : scaled;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}

/** Active dice (tray / this-turn row): face fill at +50% brightness. */
export function dieFaceBorderColor(value) {
  return brightenHex(DIE_FACE_COLOR[value] ?? '#404A59', 1.5);
}

/** Face 40×40; 4px border sits outside → 48×48 outer */
export const DIE_FACE = 40;
export const DIE_BORDER = 4;
export const DIE_OUTER = DIE_FACE + DIE_BORDER * 2;

/**
 * Colored face, white pips, 4px outside border ring (fill via CSS — see base.css).
 * Third arg: number (pip rotation deg) or { pipRotationDeg }.
 */
export function dieSVG(value, size = DIE_OUTER, opts = {}) {
  const pipRotationDeg = typeof opts === 'number' ? opts : (opts.pipRotationDeg ?? 90);
  const face = DIE_FACE_COLOR[value] ?? '#404A59';
  const active = new Set(PIP_PATTERN[value] ?? []);
  const center = DIE_FACE / 2 + DIE_BORDER;
  const circles = ALL_PIPS.filter(k => active.has(k)).map(k => {
    const [cx, cy] = PIP_POS[k];
    return `<circle cx="${cx + DIE_BORDER}" cy="${cy + DIE_BORDER}" r="5" fill="#FFFFFF"/>`;
  }).join('');
  const pips = circles
    ? `<g transform="rotate(${pipRotationDeg} ${center} ${center})">${circles}</g>`
    : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${DIE_OUTER} ${DIE_OUTER}" xmlns="http://www.w3.org/2000/svg" data-name="dice_filled_bg">
    <rect class="die-border-ring" width="${DIE_OUTER}" height="${DIE_OUTER}" rx="12"/>
    <rect x="${DIE_BORDER}" y="${DIE_BORDER}" width="${DIE_FACE}" height="${DIE_FACE}" rx="8" fill="${face}"/>
    ${pips}
  </svg>`;
}

/** Five-point star (Figma 5671:16172 — assets/figma/star.svg) */
export function starSVG(size = 32) {
  return `<svg class="star-icon" width="${size}" height="${size}" viewBox="0 0 30.1403 28.8611" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="${COLOR_ACCENT}" stroke-width="0" d="M14.1734 1.55743C14.5402 0.814187 15.6001 0.81419 15.9669 1.55744L19.5397 8.79687C19.6854 9.09202 19.967 9.29658 20.2927 9.34391L28.2819 10.5048C29.1021 10.624 29.4296 11.632 28.8361 12.2105L23.0551 17.8456C22.8194 18.0754 22.7118 18.4064 22.7675 18.7308L24.1322 26.6877C24.2723 27.5046 23.4148 28.1275 22.6812 27.7418L15.5355 23.9851C15.2441 23.8319 14.8961 23.8319 14.6048 23.9851L7.45904 27.7418C6.72541 28.1275 5.86798 27.5046 6.00809 26.6877L7.37281 18.7307C7.42844 18.4064 7.3209 18.0754 7.08521 17.8456L1.30417 12.2105C0.710657 11.632 1.03817 10.624 1.85839 10.5048L9.84758 9.34391C10.1733 9.29658 10.4549 9.09202 10.6005 8.79687L14.1734 1.55743Z"/>
  </svg>`;
}

/** Scroll chevron — hollow triangle (Figma Polygon 6/7) */
export function chevronSVG(direction = 'left', size = 48) {
  const rot = direction === 'left' ? -90 : 90;
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="transform:rotate(${rot}deg)">
    <path fill="none" stroke="${SUIT_COLOR.Z}" stroke-width="2.5" stroke-linejoin="round" d="M14 34 L34 14 L34 34Z"/>
  </svg>`;
}

/** Placement hint triangle (Figma regular-polygon, 48×48) */
export function hintTriangleSVG(direction = 'up', size = 48) {
  const up = direction === 'up';
  const points = up ? '24,6 42,38 6,38' : '24,42 6,10 42,10';
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="${points}" fill="${COLOR_ACCENT}"/>
  </svg>`;
}

/** Roll button inner face — 48×48 grey square (die outer size); accent inset ring via CSS when enabled */
export function rollButtonFaceSVG(size = DIE_OUTER) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${DIE_OUTER} ${DIE_OUTER}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="${DIE_OUTER}" height="${DIE_OUTER}" rx="12" fill="${COLOR_ROLL_FACE}"/>
  </svg>`;
}
