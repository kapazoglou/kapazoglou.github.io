import { resetGame, setGameOverHandler, scheduleRender } from './logic/turn.js';
import { initDragDrop } from './ui/display/drag-drop.js';
import { initHandlers } from './ui/display/handlers.js';
import { initSettingsPanel } from './ui/display/settings-panel.js';
import { initGameOver, showGameOver } from './ui/display/game-over.js';
import { initNavigationGuard } from './ui/display/navigation-guard.js';
import { initStarRerollInput } from './ui/display/star-reroll-input.js';
import { initTutorial, shouldStartTutorial } from './ui/display/tutorial.js';
import { initViewportControls } from './ui/display/viewport-controls.js';
import { render } from './ui/display/render.js';

/** Numbers Deuce is lazy-loaded via @font-face; warm it before first tile convert. */
async function initNumbersDeuceFont() {
  if (!document.fonts?.load) return;
  await document.fonts.load('40px "Numbers Deuce"').catch(() => {});
}

await initNumbersDeuceFont();

initDragDrop();
initStarRerollInput();
setGameOverHandler(reason => {
  showGameOver(reason);
  scheduleRender(render);
});
initHandlers();
initGameOver();
initNavigationGuard();
initSettingsPanel();
initViewportControls();

resetGame();
render();
if (shouldStartTutorial()) initTutorial();
