---
module: navigation-guard
layer: ui/display
v: 1.1
date: 2026-08-15
deps: [turn]
---
# Navigation guard

`initNavigationGuard()` — blocks the context menu (`contextmenu`, capture) and registers `beforeunload` when `shouldWarnOnLeave()` is true (browser-native confirm dialog; message text is not customizable per spec).
