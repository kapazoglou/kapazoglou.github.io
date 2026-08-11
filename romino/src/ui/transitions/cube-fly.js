import { spd } from '../../logic/settings.js';
import { dieSVG, DIE_OUTER, rankCubeShellSVG } from '../../logic/dice-visual.js';
import {
  CONVERT_FLY_STAGGER_MS,
  CUBE_FLY_SCALE_MS,
  CUBE_FLY_ARC_MS,
} from './timing.js';

export const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';

const CUBE_FLY_SCALE_READY = 0.72;
const CUBE_FLY_SCALE_END = 0.55;
const CUBE_FLY_OPACITY = 0.5;

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function quadAt(t, a, b, c) {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

/** Upward-bulging control point for rank-cube → roll arc (design px). */
export function arcControlPoint(start, target) {
  const dx = target.left - start.left;
  const dy = target.top - start.top;
  const dist = Math.hypot(dx, dy) || 1;
  const bulge = Math.min(72, dist * 0.38);
  return {
    left: (start.left + target.left) / 2,
    top: (start.top + target.top) / 2 - bulge,
  };
}

export function viewportScale() {
  const root = document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

export function toDesignPx(screenPx, scale) {
  return screenPx / scale;
}

export function flyLayer() {
  return document.querySelector('.viewport-inner');
}

export function rollBtnTargetXY(layerRect, scale) {
  const face = document.querySelector('.roll-btn-face');
  if (!face) return null;
  const r = face.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - layerRect.left, scale) + (toDesignPx(r.width, scale) - DIE_OUTER) / 2,
    top: toDesignPx(r.top - layerRect.top, scale) + (toDesignPx(r.height, scale) - DIE_OUTER) / 2,
  };
}

export function buildRankCubeNode(glyph, { muted = true } = {}) {
  const rankCube = document.createElement('div');
  rankCube.className = 'rank-cube cube-convert-rank';
  const glyphClass = muted ? 'rank-cube-glyph rank-cube-glyph--muted' : 'rank-cube-glyph';
  rankCube.innerHTML = `${rankCubeShellSVG()}<span class="${glyphClass}">${glyph}</span>`;
  return rankCube;
}

/** Design-px origin of an element, relative to a container (usually fly layer). */
export function captureElementFlyStart(el, container, scale) {
  const containerR = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - containerR.left, scale),
    top: toDesignPx(r.top - containerR.top, scale),
  };
}

/** Absolute overlay aligned to a stack die — design px inside container. */
export function positionOverlayOnDie(overlay, dieEl, container, scale) {
  const containerR = container.getBoundingClientRect();
  const r = dieEl.getBoundingClientRect();
  overlay.style.left = `${toDesignPx(r.left - containerR.left, scale)}px`;
  overlay.style.top = `${toDesignPx(r.top - containerR.top, scale)}px`;
}

/** Dice & Cubes: scale down at start, then quadratic arc to roll button. */
export function animateCubeDiceArcFlyFromStarts(flyStarts, container, target, { flyerClass = '' } = {}) {
  if (!target || !flyStarts.length) return 0;

  const scaleMs = spd(CUBE_FLY_SCALE_MS);
  const arcMs = spd(CUBE_FLY_ARC_MS);
  const staggerMs = spd(CONVERT_FLY_STAGGER_MS);

  flyStarts.forEach((start, i) => {
    setTimeout(() => {
      const flyer = document.createElement('div');
      flyer.className = ['placement-die-flyer', flyerClass].filter(Boolean).join(' ');
      flyer.innerHTML = dieSVG(start.value, DIE_OUTER);
      flyer.style.left = `${start.left}px`;
      flyer.style.top = `${start.top}px`;
      flyer.style.transform = 'translate(0, 0) scale(1)';
      flyer.style.transition = 'none';
      flyer.style.opacity = String(CUBE_FLY_OPACITY);
      container.appendChild(flyer);

      const control = arcControlPoint(start, target);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flyer.style.transition = `transform ${scaleMs}ms ${FLY_EASING}`;
          flyer.style.transform = `translate(0, 0) scale(${CUBE_FLY_SCALE_READY})`;
        });
      });

      setTimeout(() => {
        flyer.style.transition = 'none';
        const t0 = performance.now();

        function arcFrame(now) {
          const raw = Math.min(1, (now - t0) / arcMs);
          const t = easeOutCubic(raw);
          const px = quadAt(t, start.left, control.left, target.left);
          const py = quadAt(t, start.top, control.top, target.top);
          const x = px - start.left;
          const y = py - start.top;
          const s = CUBE_FLY_SCALE_READY + (CUBE_FLY_SCALE_END - CUBE_FLY_SCALE_READY) * t;
          const opacity = raw > 0.42
            ? CUBE_FLY_OPACITY * (1 - (raw - 0.42) / 0.58)
            : CUBE_FLY_OPACITY;

          flyer.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
          flyer.style.opacity = String(Math.max(0, opacity));

          if (raw < 1) requestAnimationFrame(arcFrame);
          else flyer.remove();
        }

        requestAnimationFrame(arcFrame);
      }, scaleMs);
    }, i * staggerMs);
  });

  return scaleMs + arcMs + Math.max(0, flyStarts.length - 1) * staggerMs;
}
