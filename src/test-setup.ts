import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { initManagers } from 'src/app/game/businesslogic/ManagersInit';
import { Game } from 'src/app/game/model/Game';
import { Settings } from 'src/app/game/model/Settings';
import { afterEach, beforeEach, vi } from 'vitest';

initManagers();

// Tests run non-isolated and share the manager singletons, so start every test from a clean state.
beforeEach(() => {
  Object.assign(gameManager.game, new Game());
  Object.assign(settingsManager.settings, new Settings());
  gameManager.editionManager.editionData = [];
  gameManager.stateManager.undos = [];
  gameManager.stateManager.redos = [];
  gameManager.historyManager.log = [];
});

afterEach(() => vi.restoreAllMocks());
