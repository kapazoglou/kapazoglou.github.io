import { resetGame } from './logic/turn.js';
import { initDragDrop } from './ui/display/drag-drop.js';
import { initHandlers } from './ui/display/handlers.js';
import { initSettingsPanel } from './ui/display/settings-panel.js';
import { render } from './ui/display/render.js';

initDragDrop();
initHandlers();
initSettingsPanel();

resetGame();
render();
