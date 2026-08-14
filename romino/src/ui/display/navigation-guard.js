import { shouldWarnOnLeave } from '../../logic/turn.js';

export function initNavigationGuard() {
  document.addEventListener('contextmenu', event => event.preventDefault(), { capture: true });

  window.addEventListener('beforeunload', event => {
    if (!shouldWarnOnLeave()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}
