import { spd } from '../../logic/settings.js';
import { render } from '../display/render.js';

/** Fade out the existing upcoming-preview strip before calling render(). */
export function renderWithPreviewFade() {
  const previewEl = document.querySelector('.upcoming-preview');
  if (previewEl) {
    previewEl.classList.add('is-exiting');
    setTimeout(() => render(), spd(180));
  } else {
    render();
  }
}

/** Slide the in-tray card out (reverse of deal-in) before applying state and re-rendering. */
export function renderWithCardRevert(applyState) {
  const cardEl = document.querySelector('.action-bar .converter-card.in-tray');
  if (cardEl) {
    cardEl.classList.add('is-reverting');
    setTimeout(() => {
      applyState();
      render();
    }, spd(320));
  } else {
    applyState();
    render();
  }
}
