import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  imports: [RouterModule, GhsLabelDirective, TabClickDirective],
  selector: 'ghs-debug-menu',
  templateUrl: 'debug.html',
  styleUrls: ['../menu.scss', 'debug.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsDebugMenuComponent {
  settingsManager: SettingsManager = settingsManager;

  @Output() closed = new EventEmitter();

  setServerPing(event: any) {
    settingsManager.settings.serverPing = event.target.value;
    settingsManager.storeSettings();
  }

  clearFeedbackErrors() {
    settingsManager.settings.feedbackErrorsIgnore = [];
    settingsManager.storeSettings();
    this.closed.emit();
  }
}
