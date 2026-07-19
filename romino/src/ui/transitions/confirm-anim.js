import { detectAndAddStars } from '../../logic/stars.js';
import { render } from '../display/render.js';
import { animateConverts } from './convert-anim.js';
import { resolveSweepsAnimated } from './sweep-anim.js';

/** Post-confirm animation pipeline: convert → stars → sweep → bank. */
export function runConfirmAnimations(onDone) {
  animateConverts(() => {
    detectAndAddStars();
    render();
    resolveSweepsAnimated(() => {
      onDone?.();
      render();
    });
  });
}
