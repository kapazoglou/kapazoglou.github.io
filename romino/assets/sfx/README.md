# SFX clips

Drop short sound files here. Set the **filename only** in `manifest.json` (same pattern as music).

## Add a sound

1. Drop `my-click.mp3` into this folder.
2. Set the matching entry in `manifest.json`:

```json
"dice_roll": {
  "label": "Roll dice",
  "file": "my-click.mp3",
  "volume": 1.0
}
```

Leave `file` empty (`""`) for sounds you have not sourced yet — the game stays silent for that id.

Supported formats: MP3, OGG, WAV, M4A (browser-dependent).

## Notes

- Use **filename only** — not a full path.
- Empty `file` = no sound (same as before SFX existed).
- Missing file on disk = silent no-op; gameplay is never blocked.
