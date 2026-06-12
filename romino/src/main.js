import { resetGame } from './logic/phase.js';
import { settings } from './logic/settings.js';
import { renderHUD } from './ui/display/hud.js';
import { initDragDrop } from './ui/display/drag-drop.js';
import { initHandlers, initAutoplay } from './ui/display/handlers.js';
import { initGameOver } from './ui/display/game-over.js';
import { initSettingsPanel } from './ui/display/settings-panel.js';

// Wire up all event listeners
initDragDrop();
initHandlers();
initAutoplay();
initGameOver();
initSettingsPanel();

if (settings.square) document.documentElement.classList.add('square-cards');

// Boot the game
renderHUD();
resetGame();
