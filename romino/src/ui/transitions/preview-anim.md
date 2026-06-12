---
module: preview-anim
layer: ui/transitions
v: 1.0
date: 2026-06-01
deps: [settings, render]
---
# Preview Anim — User Story

As a player, I want the upcoming-dice preview strip to slide upward and fade out smoothly when a new dice round begins, giving me a clear visual cue that the preview has refreshed.

## Exports
- `renderWithPreviewFade()` — adds `is-exiting` to the preview strip then calls `render()` after `PREVIEW_FADE_MS`

## CSS classes
- `.upcoming-preview.is-exiting .die-wrapper` — staggered translateY + opacity exit
- `.upcoming-preview .die-wrapper.preview-is-new` — slide-in animation for new preview dice

## Related
[[timing]] · [[render]] · [[action-bar]] · [[phase]]
