import { shouldWarnOnLeave } from '../../logic/turn.js';

export function initNavigationGuard() {
  window.addEventListener('beforeunload', event => {
    if (!shouldWarnOnLeave()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}
