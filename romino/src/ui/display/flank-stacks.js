import { state } from '../../logic/state.js';
import { settings } from '../../logic/settings.js';
import { tileHTML } from '../../logic/dice-visual.js';
import { flankStackCount, flankStackTop } from '../../logic/deck-flank.js';

/** Flex column markup for one flank stack (empty string when hidden). */
export function flankStackColHTML(side) {
  if (!settings.deckFlank) return '';

  const count = flankStackCount(side);
  const top = flankStackTop(side);
  if (!count || !top) return '';

  const se = state.sweepExit;
  let colClass = 'placement-col placement-col--flank-stack placement-col--tile';
  let colStyle = '';
  let sweepExtra = '';
  const tileIsNew = state.newFlankSides?.has(side);

  if (se?.flankSides?.includes(side)) {
    if (se.phase === 'wait') colClass += ' placement-col--sweep-pending';
    else if (se.phase === 'run') {
      colClass += ' placement-col--sweep';
      colStyle = ` style="--exit-order:0"`;
    }
  }

  if (se?.flankSides?.includes(side)) {
    if (se.phase === 'wait') sweepExtra = ' placement-tile--sweep-pending';
    else if (se.phase === 'run') sweepExtra = ' placement-tile--sweep-exit';
  }

  return `<div class="${colClass}" data-flank-stack-col="${side}"${colStyle}>
    <span class="flank-stack-count">${count}</span>
    ${tileHTML(top, {
      classExtra: `flank-stack-tile${sweepExtra}`,
      isNew: tileIsNew,
      attrs: ` data-flank-stack="${side}"`,
    })}
  </div>`;
}

export function flankStackElement(side) {
  return document.querySelector(`[data-flank-stack="${side}"]`);
}

/** Spread-offset map keys for flank stack columns (not player col indices). */
export const FLANK_SPREAD_LEFT = 'flank-left';
export const FLANK_SPREAD_RIGHT = 'flank-right';

export function flankStackColElement(inner, side) {
  return inner?.querySelector(`[data-flank-stack-col="${side}"]`) ?? null;
}

/** Resolve player col index or flank spread key to a placement column element. */
export function spreadColumnElement(inner, key) {
  if (key === FLANK_SPREAD_LEFT) return flankStackColElement(inner, 'left');
  if (key === FLANK_SPREAD_RIGHT) return flankStackColElement(inner, 'right');
  return inner?.querySelector(`.placement-col[data-col="${key}"]`) ?? null;
}
