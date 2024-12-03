import { Component, EventEmitter, Output } from "@angular/core";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
	standalone: false,
  selector: 'ghs-debug-menu',
  templateUrl: 'debug.html',
  styleUrls: ['../menu.scss', 'debug.scss']
})
export class SettingsDebugMenuComponent {

  settingsManager: SettingsManager = settingsManager;

  @Output() close = new EventEmitter();

  setServerPing(event: any) {
    settingsManager.settings.serverPing = event.target.value;
    settingsManager.storeSettings();
  }

  clearFeedbackErrors() {
    settingsManager.settings.feedbackErrorsIgnore = [];
    settingsManager.storeSettings();
    this.close.emit();
  }
}