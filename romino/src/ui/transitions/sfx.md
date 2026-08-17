---
module: sfx
layer: ui/transitions
v: 1.9
date: 2026-08-17
deps: [settings, manifest.json, audio-context]
---
# SFX — User Story

As a player on a phone, I want tactile sound feedback on dice, placement, scoring, and UI actions so the game feels physical — without needing a separate clip for every animation variant.

## Exports
- `initSfx()` — shared gesture unlock via `audio-context`
- `preloadSfx()` — decode all configured clips at boot (URL-deduped `AudioBuffer` cache)
- `playSfx(id, opts?)` — play by manifest key; `opts.delay`, `opts.volumeScale`
- `playSfxVariant(primary, alt?, index, opts?)` — even index → primary, odd → alt (`${primary}_2` default)
- `applySfxVolume()` — sync SFX bus gain when volume slider changes

## Manifest
Sound IDs and fill-in filenames: `assets/sfx/manifest.json` (use `"file": "clip.mp3"` — filename only, like music). Human inventory: [[SFX]].

## Settings
- `sfxEnabled` — master toggle (General group)
- `sfxVolume` — stepper 0–10, default 6; linear `step/10` (10 → 1.0), applied at each play

## Notes
- Boot: `main.js` awaits `preloadSfx()` before first render; clips decoded to `AudioBuffer` via shared Web Audio context
- Playback: `BufferSourceNode.start(0)` through SFX gain bus — low latency on mobile; HTML Audio fallback if decode fails
- No-op when `file` is empty or the clip fails to load (gameplay never blocked)
- Filename-only manifest entries resolve via `assets/sfx/` + Vite glob (same as music)
- Unlock on document gesture or active `userActivation` (roll tap works on first click)
- Per-ID `volume` in manifest × `sfxVolume` master (read fresh every `playSfx`)
- Confirm tap is silent; pipeline sounds carry the moment

## Related
[[timing]] · [[haptics]] · [[invalid-flash]] · [[pip-anim]] · [[SFX]]
