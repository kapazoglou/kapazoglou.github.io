export function isHapticsSupported() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function vibrate(pattern) {
  if (!isHapticsSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // blocked or unsupported at runtime
  }
}

/** Short pulse when a drag enters a valid drop target (die slot or empty grid cell). */
export function vibrateSlotHover() {
  vibrate(10);
}

/** Distinct double pulse when a die drag enters the action-bar return zone. */
export function vibrateActionBarHover() {
  vibrate([6, 30, 6]);
}
