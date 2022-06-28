import { Component, Input } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-server-menu',
  templateUrl: 'server.html',
  styleUrls: [ 'server.scss', '../menu.scss' ]
})
export class ServerMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  WebSocket = WebSocket;

  connect(url: string, port: string, password: string): void {
    if (url && !isNaN(+port) && password) {
      settingsManager.setServer(url, +port, password);
      gameManager.stateManager.connect();
    }
  }

  disconnect() {
    gameManager.stateManager.disconnect();
  }

  setServerUrl(event: any) {
    settingsManager.settings.serverUrl = event.target.value;
    settingsManager.storeSettings();
  }

  setServerPort(event: any) {
    settingsManager.settings.serverPort = event.target.value;
    settingsManager.storeSettings();
  }
  
  setServerPassword(event: any) {
    settingsManager.settings.serverPassword = event.target.value;
    settingsManager.storeSettings();
  }
}