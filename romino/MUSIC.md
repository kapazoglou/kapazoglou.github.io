---
title: Music Inventory
type: reference
date: 2026-08-17
---
# Music Inventory

Drop loop-ready files into [assets/music/](assets/music/). Register **LoFi-paired** tracks only in [assets/music/manifest.json](assets/music/manifest.json).

**Module:** [[music]] · `initMusic()` · settings **Music** select

---

## Folder layout

```
assets/music/
├── manifest.json              ← LoFi-paired tracks only (14)
├── README.md                  ← drop-in guide
├── Candy-Smash.ogg            ← main loop
├── Candy-Smash.LoFi.ogg       ← overlay mix
└── no-lofi/                   ← unpaired source files (not in manifest)
    └── Ancient-Puzzles.ogg
```

## LoFi naming

| Mix | Example |
|-----|---------|
| Main | `Candy-Smash.ogg` |
| LoFi | `Candy-Smash.LoFi.ogg` or `Candy-Smash LoFi.ogg` |

Both files must exist for a track to appear in the settings **Music** list. LoFi plays while the **settings sidebar**, **game-over bottom sheet**, or **suit tally discovery hold** is active. Unpaired files stay in `no-lofi/` until a LoFi mix is added.

## Looping

Files must be authored for seamless loops. The selected track is decoded on demand via Web Audio. Default loop ends **0.02s** before the file end; optional manifest fields `loopStart`, `loopEnd`, and `loopEndPadding` override per track.

## Credits

Music by Eric Matyas — [www.soundimage.org](https://www.soundimage.org)
