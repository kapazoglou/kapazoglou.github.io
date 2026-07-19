/** Pause before sweep animation starts (beat). */
export const BEAT_MS = 320;

/** Duration of card sweep-out animation. */
export const SWEEP_MS = 780;

/** Fade duration for the outgoing upcoming-preview strip. */
export const PREVIEW_FADE_MS = 180;

/** Delay for the card-placement → fill pipeline. */
export const CARD_PLACE_DELAY_MS = 220;

/** Duration of the card conversion (dice → filled) animation. */
export const CONVERT_MS = 240;

/** Stagger between each tray die sliding in. */
export const TRAY_STAGGER_MS = 60;

/** Stagger between each preview die sliding in. */
export const PREVIEW_STAGGER_MS = 60;

/** Delay between pip launches when chaining multiple coins. */
export const PIP_GAP_MS = 830;

/** Total duration from last pip launch until done callback fires. */
export const PIP_TAIL_MS = 990;

/** Bank pip (score → swept points): 2× earn-pip duration (half speed). */
export const BANK_PIP_POP_UP_MS = 220;
export const BANK_PIP_POP_DOWN_MS = 260;
export const BANK_PIP_TRAVEL_MS = 1100;
export const BANK_PIP_FADE_DONE_MS = 1500;
export const BANK_PIP_FADE_MS = 1200;
export const BANK_PIP_FADE_DELAY_MS = 300;

/** Launch next bank pip midway through the previous pip's travel phase. */
export const BANK_PIP_GAP_MS = BANK_PIP_POP_UP_MS + BANK_PIP_POP_DOWN_MS + BANK_PIP_TRAVEL_MS / 2;
