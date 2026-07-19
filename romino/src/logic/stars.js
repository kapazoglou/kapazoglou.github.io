import { state } from './state.js';
import { getOccupiedCols, dieValueAt, stackHeight } from './row.js';

export function detectAndAddStars() {
  const cols = getOccupiedCols();
  for (let i = 0; i < cols.length - 1; i++) {
    const a = cols[i];
    const b = cols[i + 1];
    const maxRows = Math.max(stackHeight(a), stackHeight(b));
    for (let row = 0; row < maxRows; row++) {
      const va = dieValueAt(a, row);
      const vb = dieValueAt(b, row);
      if (va != null && vb != null && va === vb) {
        state.stars++;
      }
    }
  }
}
