import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-debug-menu',
  templateUrl: 'debug.html',
  styleUrls: ['../menu.scss', 'debug.scss']
})
export class SettingsDebugMenuComponent {

  settingsManager: SettingsManager = settingsManager;


}