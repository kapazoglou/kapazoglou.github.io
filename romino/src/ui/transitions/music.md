---
module: music
layer: ui/transitions
v: 2.7
date: 2026-08-17
deps: [settings]
---
# Music

Looping background music via **Web Audio API** (lazy `fetch` + `decodeAudioData` per track). Tracks listed from [manifest.json](../../../assets/music/manifest.json) — **LoFi-paired entries only**; unpaired source files live in `assets/music/no-lofi/`. **Only the selected track** (main + LoFi) is decoded — not the full library.

## Loop trim
- Default `loopEnd` = buffer duration − **0.02s** (encoder tail padding).
- Optional manifest fields per track: `loopStart`, `loopEnd`, `loopEndPadding` (seconds).

## Exports
- `initMusic()` — catalog + overlay watcher + gesture unlock
- `bootstrapMusic()` — after settings load: preload saved track, prime Web Audio graph, attempt autoplay resume
- `preloadMusic(trackId?)` / `ensureMusicPreload(trackId?)` — load one track (main first; LoFi async)
- `previewMusicTrack(trackId)` — draft preview while settings open
- `getMusicSelectOptions()` — instant catalog; `+LoFi` suffix when a LoFi pair exists; `Loading…` while active track fetches
- `isMusicLoading()` / `onMusicLoadChange()` — settings dropdown refresh
- `applyMusicTrack()` / `applyMusicVolume()`
- `syncMusicOverlayState()` — re-probe overlay DOM for LoFi handoff

## LoFi handoff
When `#settings-panel.is-open`, `#game-over-overlay.is-visible`, or the suit-discovery overlay is held (`#suit-discovery-overlay`), swap main ↔ LoFi buffer source at the **same loop position** (if LoFi file exists).

## Related
[[settings-panel]] · [[settings]] · [assets/music/README.md](../../../assets/music/README.md)
