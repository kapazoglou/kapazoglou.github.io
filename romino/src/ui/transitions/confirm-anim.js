import { findStarMatches } from '../../logic/stars.js';
import { state } from '../../logic/state.js';
import { recordStarsEarned } from '../../logic/game-log.js';
import { render } from '../display/render.js';
import { getStarMatchRects } from '../display/placement-row.js';
import { animateConverts } from './convert-anim.js';
import { resolveSweepsAnimated } from './sweep-anim.js';
import { collectStarsToHUD } from './pip-anim.js';

/** Post-confirm animation pipeline: stars → convert → sweep → bank. */
export function runConfirmAnimations(onDone) {
  const newDieIds = state.starNewDieIds ?? new Set();
  delete state.starNewDieIds;

  render();
  requestAnimationFrame(() => {
    const matches = findStarMatches(newDieIds);
    const count = matches.length;
    const fromRects = getStarMatchRects(matches);

    const afterConvert = () => {
      animateConverts(convertResult => {
        resolveSweepsAnimated(sweepResult => {
          const result = convertResult === 'well-done' || sweepResult === 'well-done'
            ? 'well-done'
            : sweepResult;
          onDone?.(result);
          render();
        });
      });
    };

    if (count <= 0) {
      afterConvert();
      return;
    }

    state.stars += count;
    recordStarsEarned(count);
    collectStarsToHUD(count, fromRects, () => {
      render();
      afterConvert();
    });
  });
}
