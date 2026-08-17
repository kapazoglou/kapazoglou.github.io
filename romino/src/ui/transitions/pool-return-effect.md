---
module: pool-return-effect
layer: ui/transitions
v: 1.2
date: 2026-08-17
deps: [settings, sfx, action-bar.css]
---
# Pool Return Effect

Roll-button pulse + staggered alternating `dice_pool_return` / `dice_pool_return_2` (shared seq across confirm cycle).

## Exports
- `resetPoolReturnSfxSeq()` — call at confirm pipeline start
- `triggerPoolReturnEffect(count)` — pulse `.roll-btn-wrap`; one alternating pool-return tick per die (staggered)

## Wired
- `convert-anim.js` → `finishConvert` (after `convertColumn` + `render`)
- `sweep-anim.js` → after `applySweepRun` when `tileDiceHold` and player cols swept

## Related
[[convert-anim]] · [[sweep-anim]] · [[action-bar]]
