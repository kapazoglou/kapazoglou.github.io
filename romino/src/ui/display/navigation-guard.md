---
module: navigation-guard
layer: ui/display
v: 1.0
date: 2026-07-19
deps: [turn]
---
# Navigation guard

`initNavigationGuard()` — registers `beforeunload` when `shouldWarnOnLeave()` is true (browser-native confirm dialog; message text is not customizable per spec).
