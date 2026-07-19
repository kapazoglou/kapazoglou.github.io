---
module: preview-anim
layer: ui/transitions
v: 1.1
date: 2026-06-12
deps: [settings, render]
---
# Preview Anim — User Story

As a player, I want the upcoming-dice preview strip to slide upward and fade out smoothly when a new dice round begins, giving me a clear visual cue that the preview has refreshed.

## Exports
- `renderWithPreviewFade()` — adds `is-exiting` to the preview strip then calls `render()` after `PREVIEW_FADE_MS`
- `renderWithCardRevert(applyState)` — slides in-tray card out (reverse deal-in) then applies state and re-renders

## CSS classes
- `.upcoming-preview.is-exiting .die-wrapper` — staggered translateY + opacity exit
- `.upcoming-preview .die-wrapper.preview-is-new` — slide-in animation for new preview dice
- `.action-bar-card-ghost.is-new` — ghost card slide-in (including post-dice revert)
- `.converter-card.in-tray.is-reverting` — in-tray card slide-out before revert to dice phase

## Related
[[timing]] · [[render]] · [[action-bar]] · [[phase]]
