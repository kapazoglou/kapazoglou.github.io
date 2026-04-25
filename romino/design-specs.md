# RÖMINO Design Specs (Assumed)

These specs are derived from the implementation in `styles.css` because the Figma file is not directly accessible here. Update with Inspect values if different.

## Colors
- `--color-bg`: #f6f3ee (page background)
- `--color-surface`: #ffffff (cards/containers)
- `--color-ink`: #2b2b2b (primary text)
- `--color-muted`: #6f6760 (secondary text)
- `--color-accent`: #1f1f1f (dice fill)
- `--color-slot-border`: #b9b2ab (slot outline)
- `--color-drop`: #d7d1cb (drop highlight)

## Typography
- Title: 32px, letter-spacing 0.08em, `--font-title`
- Body: 16px base, `--font-body`
- Tray label: 12px, uppercase, letter-spacing 0.08em

## Spacing & Radius
- Spacing scale: 6, 10, 16, 24, 36
- Corner radii: 8px (small), 16px (large)
- Slot size: 84px square
- Dice size: 64px square

## Layout
- Header with title and subtitle
- Board section with 3x2 slot grid centered
- Dice tray below board with draggable dice row

## Interaction
- Dice can be dragged from tray into slots
- Slots accept a single die
- Dice can be dragged back to tray
