---
title: SFX Inventory
type: reference
date: 2026-08-17
---
# SFX Inventory

Fill in each `file` in [assets/sfx/manifest.json](assets/sfx/manifest.json) with the **filename only** (e.g. `dice_roll.mp3`) and drop the clip in `assets/sfx/`. Same pattern as music. **Empty `file` = silent.**

**Aesthetic:** tactile / physical — dice clack, card thud, wood/plastic UI clicks.

**Module:** [[sfx]] · `playSfx(id)`

---

## Sound families

| ID | Feel | File / URL |
|----|------|------------|
| `ui_tap` | Light plastic click | `assets/sfx/ui_tap.mp3` |
| `ui_open` | Panel slide + latch | `assets/sfx/ui_open.mp3` |
| `ui_close` | Panel slide shut | `assets/sfx/ui_close.mp3` |
| `ui_confirm` | Destructive commit thunk | `assets/sfx/ui_confirm.mp3` |
| `dice_roll` | Cup shake + dice spill | `assets/sfx/dice_roll.mp3` |
| `dice_select` | Single die tick | `assets/sfx/dice_select.mp3` |
| `snap_tick` | Light magnetic tick | *(fill in manifest `file`)* |
| `dice_pickup` | Lift from tray | `assets/sfx/dice_pickup.mp3` |
| `dice_land` | Slot snap / clack | `assets/sfx/dice_land.mp3` |
| `dice_return` | Slide back to tray | `assets/sfx/dice_return.mp3` |
| `dice_pool_return` | Dice into pool | `assets/sfx/dice_pool_return.mp3` |
| `dice_pool_return_2` | Dice into pool (alt) | `assets/sfx/dice_pool_return_2.mp3` |
| `dice_cancel` | Soft drop / fumble | `assets/sfx/dice_cancel.mp3` |
| `invalid` | Short buzz / knock | `assets/sfx/invalid.mp3` |
| `sweep_dup_warn` | Duplicate sweep −N | `assets/sfx/sweep_dup_warn.mp3` |
| `star_spend` | Coin/star debit | `assets/sfx/star_spend.mp3` |
| `star_created` | Star match sparkle | `assets/sfx/star_created.mp3` |
| `star_collect` | Star pip credit | `assets/sfx/star_collect.mp3` |
| `convert` | Stack compress + dice fly | `assets/sfx/convert.mp3` |
| `convert_2` | Convert (alt) | `assets/sfx/convert_2.mp3` |
| `tile_place` | Card/tile thud | `assets/sfx/tile_place.mp3` |
| `sweep_beat` | Rim tap / held breath | `assets/sfx/sweep_beat.mp3` |
| `sweep_beat_2` | Sweep beat (alt) | `assets/sfx/sweep_beat_2.mp3` |
| `sweep_rise` | Whoosh + tile lift | `assets/sfx/sweep_rise.mp3` |
| `sweep_rise_2` | Sweep rise (alt) | `assets/sfx/sweep_rise_2.mp3` |
| `sweep_collapse` | Columns slide together | `assets/sfx/sweep_collapse.mp3` |
| `sweep_collapse_2` | Collapse (alt) | `assets/sfx/sweep_collapse_2.mp3` |
| `score_reveal` | Calculator tick | `assets/sfx/score_reveal.mp3` |
| `score_bank` | Points pip arrival | `assets/sfx/score_bank.mp3` |
| `warning` | Low thrum / alert | `assets/sfx/warning.mp3` |
| `game_over` | Heavy curtain | `assets/sfx/game_over.mp3` |
| `game_restart` | Fresh shuffle | `assets/sfx/game_restart.mp3` |

---

## Interaction → sound mapping

### HUD & chrome

| Interaction | Trigger | Sound |
|-------------|---------|-------|
| Open settings | Double-tap `#hud-points` | `ui_open` |
| Close settings | Back × | `ui_close` |
| Stepper ± / toggle / music select / matrix seg | Tap | `ui_tap` |
| Clear HS confirm | Slider full + DELETED | `ui_confirm` |
| HUD text updates | Auto | *(silent)* |
| Star shortage flash | Auto block | `invalid` |
| Suit discovery hold/dismiss | Pointer | *(silent)* |

### Dice & roll

| Interaction | Trigger | Sound |
|-------------|---------|-------|
| Roll dice | Tap roll (idle) | `dice_roll` |
| Confirm turn | Tap roll (rolled) | *(silent)* |
| Tray die select/deselect | Tap | `dice_select` |
| End-game prompt arm | Tap warning roll | `warning` |
| End-game cancel | Tap back | `ui_tap` |
| End-game KO | Tap confirm | `game_over` |
| Domino hand / deck badge | Tap | `ui_tap` |
| Cadence dealt tile | Auto on roll | `tile_place` |
| Post-confirm auto-roll | Auto | `dice_roll` |

### Placement

| Interaction | Trigger | Sound |
|-------------|---------|-------|
| Show hints / scroll | Auto | *(silent)* |
| Valid place (hint, drop, direct, push, reposition) | Tap/drop | `dice_land` |
| Push-below star pay | Auto with place | `star_spend` + `dice_land` |
| Drag pickup | >8px | `dice_pickup` |
| Snap ghost appears / new slot | Auto while dragging | `snap_tick` |
| Return to tray | Tap/drag | `dice_return` |
| Dice return to pool | Convert / sweep (`tileDiceHold`) | `dice_pool_return` (staggered) + roll-btn pulse |
| Drag cancel | Invalid zone | `dice_cancel` |
| Invalid (all variants) | Blocked move | `invalid` |
| Silent reposition cancel | Illegal drop | *(silent)* |
| Horizontal star match preview | Live ⭐ between adjacent dice (any row) | `star_created` |
| Vertical star match preview | Live ⭐ between stacked dice (`verticalStars` ON) | `star_created` |
| Duplicate sweep −N label | Red −N above stack/tile (`sweptSuits` ON) | `sweep_dup_warn` |

### Star powers

| Interaction | Sound |
|-------------|-------|
| Star drag pickup | `dice_pickup` |
| Star spend (tap or HUD drag) | `star_spend` |
| Outer/domino reroll pay | `star_spend` + `dice_roll` (0.5 vol) |
| Tray flip pay | `star_spend` + `dice_select` |
| Stack swap pay | `star_spend` |
| Swap/push/reposition refund | `star_collect` |
| Convert star pay | `star_spend` |

### Confirm pipeline

| Interaction | Sound |
|-------------|-------|
| Star collect row→HUD | `star_collect` |
| Convert (all variants) | `convert` / `convert_2` (alternate per stack) + `dice_pool_return` / `_2` |
| New tile pop-in | `tile_place` |
| Flank sweep on convert | `sweep_rise` |
| Sweep beat | `sweep_beat` |
| Tile sweep up | `sweep_rise` |
| Chain sweep (confirm) | `sweep_beat` / `_2`, `sweep_rise` / `_2`, `sweep_collapse` / `_2` (alternate per run) |
| Swept tile dice to pool | `tileDiceHold` ON | `dice_pool_return` / `_2` (staggered) + roll-btn pulse |
| Column collapse | `sweep_collapse` |
| Score equation | `score_reveal` |
| Bank to points | `score_bank` |
| Chain sweeps | alternate beat / rise / collapse each run |

### Dealt strip & meta

| Interaction | Sound |
|-------------|-------|
| Pair-sweep (manual) | `sweep_beat` + `sweep_rise` |
| Game over sheet | `game_over` |
| Minimize sheet | `ui_tap` |
| Play again | `game_restart` |
| Tutorial next/skip | `ui_tap` |
| Fullscreen toggle | `ui_tap` |

---

## Sourcing checklist

- Short tails (<400ms) for taps; no loops except music
- Wood, plastic, felt, ceramic — no synthetic UI bleeps
- Consistent room tone across all 22 clips
- Normalized peak ~−3 dB; per-ID volume in manifest
- **MP3** primary at `assets/sfx/{id}.mp3`

## Open decisions (defaults shipped)

| Question | Default |
|----------|---------|
| Confirm tap sound | Silent |
| Chain sweep pitch-up | Identical clip each time |
| Star spend + land same frame | Both, 40ms apart, 0.85 vol each |
| Music vs SFX mute | Independent toggles |
| Reroll after star spend | `dice_roll` at 0.5 vol |
