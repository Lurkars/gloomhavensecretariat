import type { DebugManager } from 'src/app/game/businesslogic/DebugManager';
import type { GameManager } from 'src/app/game/businesslogic/GameManager';
import type { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import type { SoundboardManager } from 'src/app/game/businesslogic/SoundboardManager';
import type { StorageManager } from 'src/app/game/businesslogic/StorageManager';
import type { CommandManager } from 'src/app/game/commands/CommandManager';

// Only type imports here: importing this module must never trigger evaluation of the manager modules.
// The instances are created by initManagers() (ManagersInit.ts).

export let debugManager: DebugManager;
export let settingsManager: SettingsManager;
export let storageManager: StorageManager;
export let soundboardManager: SoundboardManager;
export let gameManager: GameManager;
export let commandManager: CommandManager;

export type Managers = {
  debugManager: DebugManager;
  settingsManager: SettingsManager;
  storageManager: StorageManager;
  soundboardManager: SoundboardManager;
  gameManager: GameManager;
  commandManager: CommandManager;
};

export function registerManagers(managers: Partial<Managers>) {
  debugManager = managers.debugManager || debugManager;
  settingsManager = managers.settingsManager || settingsManager;
  storageManager = managers.storageManager || storageManager;
  soundboardManager = managers.soundboardManager || soundboardManager;
  gameManager = managers.gameManager || gameManager;
  commandManager = managers.commandManager || commandManager;
}
