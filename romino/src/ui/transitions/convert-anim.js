import { state } from '../../logic/state.js';
import { spd } from '../../logic/settings.js';
import { getConvertibleCols, convertColumn } from '../../logic/convert.js';
import { render } from '../display/render.js';
import { CONVERT_MS } from './timing.js';

/** Sequentially animate full stacks → tiles; calls onDone when queue is empty. */
export function processConverts(cols, index, onDone) {
  if (index >= cols.length) {
    setTimeout(() => onDone?.(), spd(120));
    return;
  }

  const col = cols[index];
  state.convertingCol = col;
  render();

  setTimeout(() => {
    convertColumn(col);
    state.convertingCol = null;
    state.newTileCols.add(col);
    render();
    setTimeout(() => {
      state.newTileCols.delete(col);
      processConverts(cols, index + 1, onDone);
    }, spd(CONVERT_MS));
  }, spd(CONVERT_MS));
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
