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
