import { Component } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { SettingMenuComponent } from 'src/app/ui/header/menu/settings/setting/setting';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective, SettingMenuComponent],
  selector: 'ghs-keyboard-shortcuts-dialog',
  templateUrl: './keyboard-shortcuts.html',
  styleUrls: ['./keyboard-shortcuts.scss']
})
export class KeyboardShortcutsComponent {
  settinsManager: SettingsManager = settingsManager;
  isMac: boolean = navigator.userAgent.includes('Mac');
}
