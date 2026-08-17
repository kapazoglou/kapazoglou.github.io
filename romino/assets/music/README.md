# Music tracks

Drop loop-ready audio files here. The in-game **Music** dropdown lists every **LoFi-paired** manifest entry **immediately**. Only the **track you select** is downloaded and played (Web Audio loop) — not the whole library at once.

Tracks without a LoFi duplicate live in `no-lofi/` and are **not** registered in the manifest.

## Add a track

Both main and LoFi files must exist before registering a track.

1. Drop the main loop and its LoFi pair into this folder (see LoFi naming below).
2. Add an entry to `manifest.json`:

```json
{
  "id": "my-track",
  "label": "My Track",
  "file": "My Track.ogg",
  "loopStart": 0,
  "loopEnd": 47.98,
  "loopEndPadding": 0.02
}
```

Optional trim fields (seconds): `loopStart`, `loopEnd`, `loopEndPadding`. When omitted, playback loops with `loopStart = 0` and `loopEnd = duration − 0.02s`.

3. Reload the game (or reopen settings) after adding files.

Unpaired source files can sit in `no-lofi/` until a LoFi mix is added.

Supported formats: anything the browser can decode (MP3, OGG, WAV, M4A).

## Seamless loops

Export each track so the end joins cleanly back to the start. Playback uses Web Audio `AudioBufferSourceNode` loop points — gaps at the seam will be audible if the file is not loop-ready. Default code trims 0.02s from the file tail; override per track in the manifest if needed.

## LoFi variants

Optional quieter mix for when the **settings sidebar** or **game-over bottom sheet** is open:

| Role | Filename |
|------|----------|
| Main | `My Track.mp3` |
| LoFi | `My Track.LoFi.mp3` or `My Track LoFi.mp3` |

` LoFi` before the extension, or `.LoFi` before the extension (e.g. `Candy-Smash.LoFi.ogg`). Only tracks with both files are listed in the manifest and settings dropdown.

Main and LoFi versions should be the **same length** so timestamp handoff stays in sync.

## Credits

Music by Eric Matyas — [www.soundimage.org](https://www.soundimage.org)
