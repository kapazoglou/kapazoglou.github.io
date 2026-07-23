/** Pause before sweep animation starts (beat). */
export const BEAT_MS = 320;

/** Duration of tile sweep-out animation (upward). */
export const SWEEP_MS = 780;

/** Remaining columns slide together after swept tiles leave. */
export const COL_COLLAPSE_MS = 100;

/** Fade duration for the outgoing upcoming-preview strip. */
export const PREVIEW_FADE_MS = 180;

/** Delay for the card-placement → fill pipeline. */
export const CARD_PLACE_DELAY_MS = 220;

/** Duration of the card conversion (dice → filled) animation. */
export const CONVERT_MS = 240;

/** Stack dice fly back to the roll button on convert. */
export const CONVERT_FLY_MS = 320;

/** Stagger between each convert fly-back (top die first). */
export const CONVERT_FLY_STAGGER_MS = 80;

/** Columns slide aside before a gap insert. */
export const COL_SPREAD_MS = 110;

/** Die flies from the tray into the opened gap. */
export const COL_DIE_IN_MS = 95;

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

/** HUD sweep bank: hold on `stars×mult` before showing product. */
export const SWEEP_MULT_EQ_HOLD_MS = 520;

/** HUD sweep bank: hold on product before pip fly to score. */
export const SWEEP_MULT_PRODUCT_HOLD_MS = 520;

/** HUD sweep bank: star pip fly after calculation reveal. */
export const SWEEP_MULT_BANK_FLY_MS = 587;

/** Row gap → HUD star collect pip. */
export const STAR_COLLECT_POP_UP_MS = 120;
export const STAR_COLLECT_POP_DOWN_MS = 140;
export const STAR_COLLECT_TRAVEL_MS = 600;
export const STAR_COLLECT_FADE_DONE_MS = 850;
export const STAR_COLLECT_FADE_MS = 680;
export const STAR_COLLECT_FADE_DELAY_MS = 170;
export const STAR_COLLECT_GAP_MS = STAR_COLLECT_POP_UP_MS + STAR_COLLECT_POP_DOWN_MS + STAR_COLLECT_TRAVEL_MS / 2;
