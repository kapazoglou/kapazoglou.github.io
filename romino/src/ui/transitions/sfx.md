---
module: sfx
layer: ui/transitions
v: 1.4
date: 2026-08-17
deps: [settings, manifest.json]
---
# SFX — User Story

As a player on a phone, I want tactile sound feedback on dice, placement, scoring, and UI actions so the game feels physical — without needing a separate clip for every animation variant.

## Exports
- `initSfx()` — unlock on first document gesture
- `preloadSfx()` — warm all configured manifest clips at boot (deduped by URL)
- `playSfx(id, opts?)` — play by manifest key; `opts.delay`, `opts.volumeScale`
- `playSfxVariant(primary, alt?, index, opts?)` — even index → primary, odd → alt (`${primary}_2` default)

## Manifest
Sound IDs and fill-in filenames: `assets/sfx/manifest.json` (use `"file": "clip.mp3"` — filename only, like music). Human inventory: [[SFX]].

## Settings
- `sfxEnabled` — master toggle (General group)
- `sfxVolume` — stepper 0–10, default 8

## Notes
- Boot: `main.js` awaits `preloadSfx()` before first render; playback clones warmed `src` (shared files load once)
- No-op when `file` is empty or the clip fails to load (gameplay never blocked)
- Filename-only manifest entries resolve via `assets/sfx/` + Vite glob (same as music)
- Unlock on document gesture or active `userActivation` (roll tap works on first click)
- Per-ID `volume` in manifest × `sfxVolume` master
- Confirm tap is silent; pipeline sounds carry the moment

## Related
[[timing]] · [[haptics]] · [[invalid-flash]] · [[pip-anim]] · [[SFX]]
