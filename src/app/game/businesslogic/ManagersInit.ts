import { DebugManager } from 'src/app/game/businesslogic/DebugManager';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { commandManager, gameManager, registerManagers, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { SoundboardManager } from 'src/app/game/businesslogic/SoundboardManager';
import { StorageManager } from 'src/app/game/businesslogic/StorageManager';
import { CommandManager } from 'src/app/game/commands/CommandManager';

export function initManagers() {
  if (gameManager) {
    return;
  }
  // order matters: field initializers read already registered managers (e.g. SettingsManager.debugManager)
  registerManagers({ debugManager: new DebugManager() });
  registerManagers({ settingsManager: new SettingsManager() });
  registerManagers({ storageManager: new StorageManager() });
  registerManagers({ soundboardManager: new SoundboardManager() });
  registerManagers({ gameManager: new GameManager() });
  registerManagers({ commandManager: new CommandManager() });

  window.settingsManager = settingsManager;
  window.gameManager = gameManager;
  window.commandManager = commandManager;
}
