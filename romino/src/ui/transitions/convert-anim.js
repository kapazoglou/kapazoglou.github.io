import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { getConvertibleCols, convertColumn, convertRequiresStar, isSwitcherConvertCol } from '../../logic/convert.js';
import { findFlankSidesWithTopMatch } from '../../logic/deck-flank.js';
import {
  dieSVG,
  DIE_OUTER,
  DIE_BORDER,
  tileIdentityFromStackValues,
  cubeTileRankGlyph,
  rankCubeShellSVG,
  SUIT_COLOR,
  JOKER_RANK,
  missingInnerDieFromTricolor,
  isTricolorSevensStack,
  isSwitcherTricolorStack,
} from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { renderHUD } from '../display/hud-v2.js';
import { payStarForConvert } from './pip-anim.js';
import { animateFlankStackSweep } from './sweep-anim.js';
import {
  CONVERT_MS,
  CONVERT_FLY_MS,
  CONVERT_FLY_STAGGER_MS,
  CUBE_FLY_SCALE_MS,
  CUBE_FLY_ARC_MS,
  CUBE_MERGE_MS,
  CUBE_REPLACE_MS,
  CUBE_WRAP_MS,
} from './timing.js';

const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';
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
function arcControlPoint(start, target) {
  const dx = target.left - start.left;
  const dy = target.top - start.top;
  const dist = Math.hypot(dx, dy) || 1;
  const bulge = Math.min(72, dist * 0.38);
  return {
    left: (start.left + target.left) / 2,
    top: (start.top + target.top) / 2 - bulge,
  };
}

function viewportScale() {
  const root = document.querySelector('.viewport-inner');
  if (!root?.offsetWidth) return 1;
  return root.getBoundingClientRect().width / root.offsetWidth;
}

function toDesignPx(screenPx, scale) {
  return screenPx / scale;
}

function flyLayer() {
  return document.querySelector('.viewport-inner');
}

/** Top die first — matches placement-row hint anchoring. */
function topFirstDice(colNode) {
  const dice = [...colNode.querySelectorAll('.die--placed')];
  if (!dice.length) return dice;
  return settings.stackBottomUp ? dice.reverse() : dice;
}

function rollBtnTargetXY(layerRect, scale) {
  const face = document.querySelector('.roll-btn-face');
  if (!face) return null;
  const r = face.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - layerRect.left, scale) + (toDesignPx(r.width, scale) - DIE_OUTER) / 2,
    top: toDesignPx(r.top - layerRect.top, scale) + (toDesignPx(r.height, scale) - DIE_OUTER) / 2,
  };
}

/** Vertical step between stacked dice (overlap by one border width). */
const DIE_STACK_STEP = DIE_OUTER - DIE_BORDER;

/** Visual bottom / mid / top — matches placement-row hint anchoring. */
function visualStackRoles(colNode) {
  const dice = [...colNode.querySelectorAll('.die--placed')];
  if (dice.length !== 3) return null;
  const bottom = settings.stackBottomUp ? dice[0] : dice[2];
  const top = settings.stackBottomUp ? dice[2] : dice[0];
  const mid = dice[1];
  return { bottom, mid, top };
}

function buildRankCubeNode(glyph, { muted = true } = {}) {
  const rankCube = document.createElement('div');
  rankCube.className = 'rank-cube cube-convert-rank';
  const glyphClass = muted ? 'rank-cube-glyph rank-cube-glyph--muted' : 'rank-cube-glyph';
  rankCube.innerHTML = `${rankCubeShellSVG()}<span class="${glyphClass}">${glyph}</span>`;
  return rankCube;
}

function captureFlyStarts(flyEls, layerRect, scale) {
  return flyEls.map(el => {
    const r = el.getBoundingClientRect();
    return {
      value: state.dice[el.dataset.dieId].value,
      left: toDesignPx(r.left - layerRect.left, scale),
      top: toDesignPx(r.top - layerRect.top, scale),
    };
  });
}

function captureRankCubeFlyStart(rankCube, container, scale) {
  const containerR = container.getBoundingClientRect();
  const r = rankCube.getBoundingClientRect();
  return {
    left: toDesignPx(r.left - containerR.left, scale),
    top: toDesignPx(r.top - containerR.top, scale),
  };
}

/** Absolute overlay aligned to a stack die — design px inside container. */
function positionOverlayOnDie(overlay, dieEl, container, scale) {
  const containerR = container.getBoundingClientRect();
  const r = dieEl.getBoundingClientRect();
  overlay.style.left = `${toDesignPx(r.left - containerR.left, scale)}px`;
  overlay.style.top = `${toDesignPx(r.top - containerR.top, scale)}px`;
}

function assembleCubeConvertShell(colNode, bottom, rankCube, rankOverlay, suitColor) {
  const shell = document.createElement('div');
  shell.className = 'cube-convert-shell';
  shell.style.setProperty('--cube-suit-color', suitColor);

  const suitWrap = document.createElement('div');
  suitWrap.className = 'suit-die';

  colNode.insertBefore(shell, bottom);
  shell.appendChild(rankCube);
  shell.appendChild(suitWrap);
  suitWrap.appendChild(bottom);
  rankOverlay.remove();

  return shell;
}

function flyValuesFromStack(colNode) {
  const flyEls = topFirstDice(colNode).slice(0, Math.max(0, colNode.querySelectorAll('.die--placed').length - 1));
  return flyEls.map(el => state.dice[el.dataset.dieId].value);
}

function flyValuesJokerFromStack(colNode) {
  return topFirstDice(colNode).map(el => state.dice[el.dataset.dieId].value);
}

/** Suit die value for joker cube tile / convert fade-in (matches rank-cube suit). */
function jokerFadeInDieValue(stackValues) {
  if (settings.tricolorSevens && isTricolorSevensStack(stackValues)) {
    return stackValues[0];
  }
  return missingInnerDieFromTricolor(stackValues);
}

function commitJokerSuitDie(bottomEl, value) {
  bottomEl.innerHTML = dieSVG(value, DIE_OUTER);
  bottomEl.style.opacity = '';
  bottomEl.style.transition = '';
  bottomEl.style.visibility = '';
}

/** Fly from pre-captured design px coords (container-local). */
function animateDiceFlyFromStarts(flyStarts, container, scale, target, onDone, { flyerClass = '' } = {}) {
  if (!target || !flyStarts.length) {
    onDone();
    return;
  }

  const flyMs = spd(CONVERT_FLY_MS);
  const staggerMs = spd(CONVERT_FLY_STAGGER_MS);
  let completed = 0;
  const total = flyStarts.length;

  flyStarts.forEach((start, i) => {
    setTimeout(() => {
      const dx = target.left - start.left;
      const dy = target.top - start.top;
      const fadeMs = Math.round(flyMs * 0.55);
      const fadeDelay = Math.round(flyMs * 0.45);

      const flyer = document.createElement('div');
      flyer.className = ['placement-die-flyer', flyerClass].filter(Boolean).join(' ');
      flyer.innerHTML = dieSVG(start.value, DIE_OUTER);
      flyer.style.left = `${start.left}px`;
      flyer.style.top = `${start.top}px`;
      flyer.style.transform = 'translate(0, 0)';
      container.appendChild(flyer);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flyer.style.transition =
            `transform ${flyMs}ms ${FLY_EASING}, opacity ${fadeMs}ms ease ${fadeDelay}ms`;
          flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.88)`;
          flyer.style.opacity = '0';
        });
      });

      setTimeout(() => {
        flyer.remove();
        completed++;
        if (completed >= total) onDone();
      }, flyMs);
    }, i * staggerMs);
  });
}

/** Dice & Cubes: scale down at rank cube, then quadratic arc to roll button. */
function animateCubeDiceArcFlyFromStarts(flyStarts, container, target, { flyerClass = '' } = {}) {
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

function animateDiceFlyToRoll(flyEls, layer, layerRect, scale, target, onDone) {
  const starts = captureFlyStarts(flyEls, layerRect, scale);
  flyEls.forEach(el => { el.style.visibility = 'hidden'; });
  animateDiceFlyFromStarts(starts, layer, scale, target, onDone);
}

/** Fly stack dice to roll button (top die first), then call onDone. */
function animateConvertFlyBack(col, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  const layer = flyLayer();
  const colNode = inner?.querySelector(`.placement-col[data-col="${col}"]`);
  if (!layer || !colNode) {
    onDone();
    return;
  }

  const scale = viewportScale();
  const layerRect = layer.getBoundingClientRect();
  const target = rollBtnTargetXY(layerRect, scale);
  const diceEls = topFirstDice(colNode);
  const flyEls = settings.tileDiceHold && diceEls.length > 0
    ? diceEls.slice(0, diceEls.length - 1)
    : diceEls;

  if (settings.tileDiceHold && diceEls.length > 0) {
    diceEls[diceEls.length - 1].style.visibility = 'hidden';
  }

  animateDiceFlyToRoll(flyEls, layer, layerRect, scale, target, onDone);
}

function previewTileFromCol(col) {
  const column = state.row[col];
  if (!column || column.kind !== 'stack' || column.dice.length !== 3) return null;
  const values = column.dice.map(id => state.dice[id].value);
  return tileIdentityFromStackValues(values, {
    tricolors: settings.tricolors,
    tricolorSevens: settings.tricolorSevens,
  });
}

/**
 * Dice & Cubes joker convert.
 * 1. Top → mid merge; rank cube fade begins
 * 2. Mid + top collapse to bottom; missing-suit die crossfades in at bottom suit slot
 * 3. Scale-down + arc fly from bottom suit die for all three stack dice + glyph color + inset stroke
 */
function animateCubeJokerConvert(col, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  const layer = flyLayer();
  const colNode = inner?.querySelector(`.placement-col[data-col="${col}"]`);
  if (!layer || !colNode) {
    onDone();
    return;
  }

  const roles = visualStackRoles(colNode);
  const tilePreview = previewTileFromCol(col);
  if (!roles || !tilePreview) {
    onDone();
    return;
  }

  const column = state.row[col];
  const stackValues = column.dice.map(id => state.dice[id].value);
  const fadeInValue = jokerFadeInDieValue(stackValues);
  const { bottom, mid, top } = roles;
  const glyph = cubeTileRankGlyph(tilePreview);
  const suitColor = SUIT_COLOR[tilePreview.suit] ?? '#404A59';
  const scale = viewportScale();
  const mergeMs = spd(CUBE_MERGE_MS);
  const replaceMs = spd(CUBE_REPLACE_MS);
  const wrapMs = spd(CUBE_WRAP_MS);

  const rankCube = buildRankCubeNode(glyph, { muted: true });
  const rankOverlay = document.createElement('div');
  rankOverlay.className = 'cube-convert-rank-overlay';
  rankOverlay.appendChild(rankCube);
  colNode.appendChild(rankOverlay);
  positionOverlayOnDie(rankOverlay, mid, colNode, scale);

  const missingOverlay = document.createElement('div');
  missingOverlay.className = 'cube-convert-missing-overlay';
  missingOverlay.innerHTML = dieSVG(fadeInValue, DIE_OUTER);
  colNode.appendChild(missingOverlay);
  positionOverlayOnDie(missingOverlay, bottom, colNode, scale);

  let shell = null;

  top.classList.add('die--cube-merge', 'die--cube-merge-blend');
  top.style.transition = `transform ${mergeMs}ms ${FLY_EASING}`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      top.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
      rankCube.classList.add('cube-convert-rank--revealed');
    });
  });

  setTimeout(() => {
    mid.style.transition = `transform ${replaceMs}ms ${FLY_EASING}`;
    top.style.transition = `transform ${replaceMs}ms ${FLY_EASING}`;
    bottom.style.transition = `opacity ${replaceMs}ms ease`;
    missingOverlay.style.transition = `opacity ${replaceMs}ms ease`;

    requestAnimationFrame(() => {
      mid.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
      top.style.transform = `translate(0, ${2 * DIE_STACK_STEP}px)`;
      bottom.style.opacity = '0';
      missingOverlay.style.opacity = '1';
    });
  }, mergeMs);

  const collapseMs = mergeMs + replaceMs;
  setTimeout(() => {
    top.classList.remove('die--cube-merge-blend');
    mid.style.display = 'none';
    top.style.display = 'none';
    missingOverlay.remove();
    commitJokerSuitDie(bottom, fadeInValue);
    shell = assembleCubeConvertShell(colNode, bottom, rankCube, rankOverlay, suitColor);
  }, collapseMs);

  setTimeout(() => {
    if (!shell) {
      missingOverlay.remove();
      commitJokerSuitDie(bottom, fadeInValue);
      shell = assembleCubeConvertShell(colNode, bottom, rankCube, rankOverlay, suitColor);
      mid.style.display = 'none';
      top.style.display = 'none';
    }

    const layerRect = layer.getBoundingClientRect();
    const bottomStart = captureRankCubeFlyStart(bottom, layer, scale);
    const flyValues = flyValuesJokerFromStack(colNode);
    const flyStarts = flyValues.map(value => ({ value, ...bottomStart }));
    const flyTarget = rollBtnTargetXY(layerRect, scale);

    shell.classList.add('cube-convert-shell--wrap');
    rankCube.querySelector('.rank-cube-glyph')?.classList.remove('rank-cube-glyph--muted');

    const flyTotalMs = animateCubeDiceArcFlyFromStarts(
      flyStarts,
      layer,
      flyTarget,
      { flyerClass: 'placement-die-flyer--cube-convert' },
    );
    const tailMs = Math.max(wrapMs, flyTotalMs);

    setTimeout(onDone, tailMs);
  }, collapseMs);
}

/**
 * Switcher Jokers convert — stripped cube-joker motion (no rank cube, no shell stroke).
 * 1. Top → mid merge
 * 2. Mid + top collapse to bottom; missing-suit die crossfades in
 * 3. Arc fly mid + top to roll; bottom die stays as switched color
 */
function animateSwitcherJokerConvert(col, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  const layer = flyLayer();
  const colNode = inner?.querySelector(`.placement-col[data-col="${col}"]`);
  if (!layer || !colNode) {
    onDone();
    return;
  }

  const roles = visualStackRoles(colNode);
  if (!roles) {
    onDone();
    return;
  }

  const column = state.row[col];
  const stackValues = column.dice.map(id => state.dice[id].value);
  if (!isSwitcherTricolorStack(stackValues)) {
    onDone();
    return;
  }

  const fadeInValue = missingInnerDieFromTricolor(stackValues);
  const { bottom, mid, top } = roles;
  const scale = viewportScale();
  const mergeMs = spd(CUBE_MERGE_MS);
  const replaceMs = spd(CUBE_REPLACE_MS);

  const missingOverlay = document.createElement('div');
  missingOverlay.className = 'cube-convert-missing-overlay';
  missingOverlay.innerHTML = dieSVG(fadeInValue, DIE_OUTER);
  colNode.appendChild(missingOverlay);
  positionOverlayOnDie(missingOverlay, bottom, colNode, scale);

  top.classList.add('die--cube-merge', 'die--cube-merge-blend');
  top.style.transition = `transform ${mergeMs}ms ${FLY_EASING}`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      top.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
    });
  });

  setTimeout(() => {
    mid.style.transition = `transform ${replaceMs}ms ${FLY_EASING}`;
    top.style.transition = `transform ${replaceMs}ms ${FLY_EASING}`;
    bottom.style.transition = `opacity ${replaceMs}ms ease`;
    missingOverlay.style.transition = `opacity ${replaceMs}ms ease`;

    requestAnimationFrame(() => {
      mid.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
      top.style.transform = `translate(0, ${2 * DIE_STACK_STEP}px)`;
      bottom.style.opacity = '0';
      missingOverlay.style.opacity = '1';
    });
  }, mergeMs);

  const collapseMs = mergeMs + replaceMs;
  setTimeout(() => {
    top.classList.remove('die--cube-merge-blend');
    mid.style.display = 'none';
    top.style.display = 'none';
    missingOverlay.remove();
    commitJokerSuitDie(bottom, fadeInValue);
  }, collapseMs);

  setTimeout(() => {
    const layerRect = layer.getBoundingClientRect();
    const bottomStart = captureRankCubeFlyStart(bottom, layer, scale);
    const flyValues = [stackValues[1], stackValues[2]];
    const flyStarts = flyValues.map(value => ({ value, ...bottomStart }));
    const flyTarget = rollBtnTargetXY(layerRect, scale);

    const flyTotalMs = animateCubeDiceArcFlyFromStarts(
      flyStarts,
      layer,
      flyTarget,
      { flyerClass: 'placement-die-flyer--cube-convert' },
    );

    setTimeout(onDone, flyTotalMs);
  }, collapseMs);
}

/**
 * Dice & Cubes convert — single shell for phases 2–4 (no overlay/shell swap).
 * 1. Top die (overlay blend) → mid; rank cube fade begins in parallel
 * 2. Merge ends → mid/top removed; rank fade may still be finishing
 * 3. Rank fade done → scale-down + arc fly + glyph color + inset stroke (parallel)
 */
function animateCubeConvert(col, onDone) {
  const inner = document.querySelector('.placement-row-inner');
  const layer = flyLayer();
  const colNode = inner?.querySelector(`.placement-col[data-col="${col}"]`);
  if (!layer || !colNode) {
    onDone();
    return;
  }

  const roles = visualStackRoles(colNode);
  const tilePreview = previewTileFromCol(col);
  if (!roles || !tilePreview) {
    onDone();
    return;
  }

  if (tilePreview.rank === JOKER_RANK) {
    animateCubeJokerConvert(col, onDone);
    return;
  }

  const { bottom, mid, top } = roles;
  const glyph = cubeTileRankGlyph(tilePreview);
  const suitColor = SUIT_COLOR[tilePreview.suit] ?? '#404A59';
  const scale = viewportScale();
  const mergeMs = spd(CUBE_MERGE_MS);
  const replaceMs = spd(CUBE_REPLACE_MS);
  const wrapMs = spd(CUBE_WRAP_MS);
  const flyValues = flyValuesFromStack(colNode);

  const rankCube = buildRankCubeNode(glyph, { muted: true });
  const rankOverlay = document.createElement('div');
  rankOverlay.className = 'cube-convert-rank-overlay';
  rankOverlay.appendChild(rankCube);
  colNode.appendChild(rankOverlay);
  positionOverlayOnDie(rankOverlay, mid, colNode, scale);

  let shell = null;

  top.classList.add('die--cube-merge', 'die--cube-merge-blend');
  top.style.transition = `transform ${mergeMs}ms ${FLY_EASING}`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      top.style.transform = `translate(0, ${DIE_STACK_STEP}px)`;
      rankCube.classList.add('cube-convert-rank--revealed');
    });
  });

  setTimeout(() => {
    top.classList.remove('die--cube-merge-blend');
    mid.style.display = 'none';
    top.style.display = 'none';
    shell = assembleCubeConvertShell(colNode, bottom, rankCube, rankOverlay, suitColor);
  }, mergeMs);

  const flyWrapMs = Math.max(replaceMs, mergeMs);
  setTimeout(() => {
    if (!shell) {
      shell = assembleCubeConvertShell(colNode, bottom, rankCube, rankOverlay, suitColor);
      top.style.display = 'none';
      mid.style.display = 'none';
    }

    const layerRect = layer.getBoundingClientRect();
    const rankStart = captureRankCubeFlyStart(rankCube, layer, scale);
    const flyStarts = flyValues.map(value => ({ value, ...rankStart }));
    const flyTarget = rollBtnTargetXY(layerRect, scale);

    shell.classList.add('cube-convert-shell--wrap');
    rankCube.querySelector('.rank-cube-glyph')?.classList.remove('rank-cube-glyph--muted');

    const flyTotalMs = animateCubeDiceArcFlyFromStarts(
      flyStarts,
      layer,
      flyTarget,
      { flyerClass: 'placement-die-flyer--cube-convert' },
    );
    const tailMs = Math.max(wrapMs, flyTotalMs);

    setTimeout(onDone, tailMs);
  }, flyWrapMs);
}

function mergeWellDone(a, b) {
  return a === 'well-done' || b === 'well-done' ? 'well-done' : null;
}

function afterConvertTile(col, cols, index, onDone, wellDoneResult) {
  const tile = state.row[col];
  const flankSides = settings.deckFlank && tile?.kind === 'tile'
    ? findFlankSidesWithTopMatch(tile.suit, tile.rank)
    : [];

  const advance = (flankResult) => {
    processConverts(cols, index + 1, onDone, mergeWellDone(wellDoneResult, flankResult));
  };

  if (flankSides.length) {
    animateFlankStackSweep(flankSides, advance);
    return;
  }
  advance(null);
}

function finishConvert(col, cols, index, onDone, wellDoneResult) {
  const switcher = isSwitcherConvertCol(col);
  const convertResult = convertColumn(col);
  const mergedWellDone = mergeWellDone(wellDoneResult, convertResult);
  state.convertingCol = null;
  const skipTilePop = settings.diceAndCubes || switcher;
  if (!skipTilePop) state.newTileCols.add(col);
  render();
  const tailMs = skipTilePop ? 0 : spd(CONVERT_MS);
  setTimeout(() => {
    if (!skipTilePop) state.newTileCols.delete(col);
    renderHUD();
    afterConvertTile(col, cols, index, onDone, mergedWellDone);
  }, tailMs);
}

/** Sequentially animate full stacks → tiles; calls onDone when queue is empty. */
export function processConverts(cols, index, onDone, wellDoneResult = null) {
  if (index >= cols.length) {
    setTimeout(() => onDone?.(wellDoneResult), spd(120));
    return;
  }

  const col = cols[index];
  state.convertingCol = col;
  render();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const runConvertAnim = () => {
        const onAnimDone = () => finishConvert(col, cols, index, onDone, wellDoneResult);
        if (isSwitcherConvertCol(col)) {
          animateSwitcherJokerConvert(col, onAnimDone);
        } else if (settings.diceAndCubes) {
          animateCubeConvert(col, onAnimDone);
        } else {
          animateConvertFlyBack(col, onAnimDone);
        }
      };

      if (convertRequiresStar(col)) {
        payStarForConvert(col, runConvertAnim);
      } else {
        runConvertAnim();
      }
    });
  });
}

/** Run convert animations for every full stack on the row. */
export function animateConverts(onDone) {
  const cols = getConvertibleCols();
  if (!cols.length) {
    onDone?.(null);
    return;
  }
  processConverts(cols, 0, onDone, null);
}
