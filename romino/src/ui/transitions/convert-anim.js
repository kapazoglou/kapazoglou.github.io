import { state } from '../../logic/state.js';
import { settings, spd } from '../../logic/settings.js';
import { getConvertibleCols, convertColumn, convertRequiresStar } from '../../logic/convert.js';
import { dieSVG, DIE_OUTER } from '../../logic/dice-visual.js';
import { render } from '../display/render.js';
import { renderHUD } from '../display/hud-v2.js';
import { payStarForConvert } from './pip-anim.js';
import { CONVERT_MS, CONVERT_FLY_MS, CONVERT_FLY_STAGGER_MS } from './timing.js';

const FLY_EASING = 'cubic-bezier(0.05, 0.75, 0.15, 1)';

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

  if (!target || !diceEls.length) {
    onDone();
    return;
  }

  const flyMs = spd(CONVERT_FLY_MS);
  const staggerMs = spd(CONVERT_FLY_STAGGER_MS);
  let completed = 0;
  const total = diceEls.length;

  diceEls.forEach((dieEl, i) => {
    const dieId = dieEl.dataset.dieId;
    const die = state.dice[dieId];
    const startR = dieEl.getBoundingClientRect();
    const start = {
      left: toDesignPx(startR.left - layerRect.left, scale),
      top: toDesignPx(startR.top - layerRect.top, scale),
    };

    setTimeout(() => {
      dieEl.style.visibility = 'hidden';

      const dx = target.left - start.left;
      const dy = target.top - start.top;
      const fadeMs = Math.round(flyMs * 0.55);
      const fadeDelay = Math.round(flyMs * 0.45);

      const flyer = document.createElement('div');
      flyer.className = 'placement-die-flyer';
      flyer.innerHTML = dieSVG(die.value, DIE_OUTER);
      flyer.style.left = `${start.left}px`;
      flyer.style.top = `${start.top}px`;
      flyer.style.transform = 'translate(0, 0)';
      layer.appendChild(flyer);

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

/** Sequentially animate full stacks → tiles; calls onDone when queue is empty. */
export function processConverts(cols, index, onDone) {
  if (index >= cols.length) {
    setTimeout(() => onDone?.(), spd(120));
    return;
  }

  const col = cols[index];
  state.convertingCol = col;
  render();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const runFlyBack = () => {
        animateConvertFlyBack(col, () => {
          convertColumn(col);
          state.convertingCol = null;
          state.newTileCols.add(col);
          render();
          setTimeout(() => {
            state.newTileCols.delete(col);
            renderHUD();
            processConverts(cols, index + 1, onDone);
          }, spd(CONVERT_MS));
        });
      };

      if (convertRequiresStar(col)) {
        payStarForConvert(col, runFlyBack);
      } else {
        runFlyBack();
      }
    });
  });
}

/** Run convert animations for every full stack on the row. */
export function animateConverts(onDone) {
  const cols = getConvertibleCols();
  if (!cols.length) {
    onDone?.();
    return;
  }
  processConverts(cols, 0, onDone);
}
