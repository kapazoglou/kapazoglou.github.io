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
