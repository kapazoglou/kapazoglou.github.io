---
module: timing
layer: ui/transitions
v: 1.9
date: 2026-08-10
deps: []
---
# Timing — User Story

As an animator, I need a single source of truth for animation durations so that sweep, card, and preview animations stay visually consistent and can be adjusted in one place.

## Exports
- `BEAT_MS` (320) — pause before sweep animation starts
- `SWEEP_MS` (780) — duration of upward tile sweep-out
- `COL_COLLAPSE_MS` (100) — remaining columns slide together after sweep
- `PREVIEW_FADE_MS` (180) — upcoming-preview strip exit duration
- `CARD_PLACE_DELAY_MS` (220) — delay after card placement before fill pipeline
- `CONVERT_MS` (240) — tile enter pop after convert
- `CONVERT_FLY_MS` (320) — stack dice fly to roll button
- `CONVERT_FLY_STAGGER_MS` (80) — stagger between convert fly-backs (top first)
- `CUBE_FLY_SCALE_MS` (90) — Dice & Cubes: in-place scale-down at rank cube before arc
- `CUBE_FLY_ARC_MS` (280) — Dice & Cubes: quadratic arc to roll button
- `CUBE_MERGE_MS` (140) — Dice & Cubes: top die travels to middle die
- `CUBE_REPLACE_MS` (200) — rank cube appears; glyph color resolve
- `CUBE_WRAP_MS` (240) — outer wrapper stroke conjoins rank cube + bottom die
- `COL_SPREAD_MS` (110) — columns slide aside before gap insert
- `COL_DIE_IN_MS` (95) — die flies tray → gap (fast start, ease-out landing)
- `TRAY_STAGGER_MS` / `PREVIEW_STAGGER_MS` (60) — stagger between spawned elements
- `PIP_GAP_MS` (830) / `PIP_TAIL_MS` (990) — legacy earn-coin pip spacing (unused in row v2)
- `BANK_PIP_*` / `STAR_COLLECT_*` — legacy pop-travel pip timings; row v2 collect/convert pips use `CONVERT_FLY_MS` via [[pip-anim]]
- `SWEEP_MULT_EQ_HOLD_MS` (520) / `SWEEP_MULT_PRODUCT_HOLD_MS` (520) / `SWEEP_MULT_BANK_FLY_MS` (587) — sweep bank calculation reveal on HUD

## Notes
All durations are in milliseconds at `--t: 1`. The `spd()` helper in `settings.js` applies the `fastAnimations` multiplier (0.5×) at call-time.

## Related
[[sweep-anim]] · [[convert-anim]] · [[pip-anim]] · [[settings]]
