import { spd } from '../../logic/settings.js';
import { playSfxVariant } from './sfx.js';

const PULSE_MS = 420;
const SFX_STAGGER_MS = 72;

/** Monotonic per confirm cycle — alternates pool-return clips across converts/sweeps. */
let poolReturnSeq = 0;

export function resetPoolReturnSfxSeq() {
  poolReturnSeq = 0;
}

/** Roll-button pulse + staggered alternating dice_pool_return / dice_pool_return_2. */
export function triggerPoolReturnEffect(count = 1) {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return;

  pulseRollButton();

  for (let i = 0; i < n; i++) {
    const seq = poolReturnSeq++;
    playSfxVariant('dice_pool_return', 'dice_pool_return_2', seq, {
      delay: spd(i * SFX_STAGGER_MS),
    });
  }
}

function pulseRollButton() {
  const wrap = document.querySelector('.roll-btn-wrap');
  if (!wrap) return;
  wrap.classList.remove('roll-btn-wrap--pool-return');
  void wrap.offsetWidth;
  wrap.classList.add('roll-btn-wrap--pool-return');
  setTimeout(() => wrap.classList.remove('roll-btn-wrap--pool-return'), spd(PULSE_MS));
}
