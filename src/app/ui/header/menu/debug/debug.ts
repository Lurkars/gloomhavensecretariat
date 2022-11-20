import { Component } from "@angular/core";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
  selector: 'ghs-debug-menu',
  templateUrl: 'debug.html',
  styleUrls: ['../menu.scss', 'debug.scss']
})
export class SettingsDebugMenuComponent {
  settingsManager: SettingsManager = settingsManager;
}