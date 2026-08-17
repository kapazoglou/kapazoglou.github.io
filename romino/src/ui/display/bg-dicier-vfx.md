---
v: 2.28
date: 2026-08-17
layer: ui/display
---

# bg-dicier-vfx

Decorative background texture: Dicier icon rows scroll vertically (generative/destructive ends swap on reversal) while the layer oscillates ±60–90° — ~3s ease ramps at each inflection, constant speed between; viewport `overflow: hidden` clips rows. Each grid cell independently cycles symbols on a random 12–45s timer. Suit glyphs (standalone `HEARTS`/`DIAMONDS`/`CLUBS`/`SPADES` and value_suit combos) render in **Dicier Round Dark**; all other codes stay **Round Light**. Entire layer speed scales with dice pool: full pool = baseline, empty pool = up to +25% faster (scroll, rotation, symbol cycles). **Single master** fill (`--bg-dicier-fill`), opacity (`--bg-dicier-opacity`), and blend (`--bg-dicier-blend`) on `#bg-dicier-vfx` — inner motion/grid inherit color only; no per-cell opacity. Full template height; action bar overlay blends through.

## Files

- `bg-dicier-vfx.js` — fetch codes list, build grid, warm font
- `bg-dicier-vfx.css` — `@font-face`, pan + wobble animations, stacking

## Wiring

- `index.html` — `#bg-dicier-vfx` first child of `.template`
- `main.js` — `initBgDicierVfx()` before first render
- `settings.js` — `vfxEnabled` toggle; `applyBgDicierVfx()` from settings panel
- `base.css` — `@import` this stylesheet
