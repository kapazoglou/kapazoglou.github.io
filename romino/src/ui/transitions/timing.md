---
module: timing
layer: ui/transitions
v: 1.1
date: 2026-07-11
deps: []
---
# Timing — User Story

As an animator, I need a single source of truth for animation durations so that sweep, card, and preview animations stay visually consistent and can be adjusted in one place.

## Exports
- `BEAT_MS` (320) — pause before sweep animation starts
- `SWEEP_MS` (780) — duration of card sweep-out
- `PREVIEW_FADE_MS` (180) — upcoming-preview strip exit duration
- `CARD_PLACE_DELAY_MS` (220) — delay after card placement before fill pipeline
- `CONVERT_MS` (240) — card dice → filled animation duration
- `TRAY_STAGGER_MS` / `PREVIEW_STAGGER_MS` (60) — stagger between spawned elements
- `PIP_GAP_MS` (830) / `PIP_TAIL_MS` (990) — earn-coin pip animation spacing
- `BANK_PIP_*` — score → swept-points pip (2× earn duration); `BANK_PIP_GAP_MS` staggers at mid-travel

## Notes
All durations are in milliseconds at `--t: 1`. The `spd()` helper in `settings.js` applies the `fastAnimations` multiplier (0.5×) at call-time.

## Related
[[sweep-anim]] · [[card-anim]] · [[preview-anim]] · [[settings]]
