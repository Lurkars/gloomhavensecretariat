import { Component } from "@angular/core";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
    standalone: false,
    selector: 'ghs-keyboard-shortcuts-dialog',
    templateUrl: './keyboard-shortcuts.html',
    styleUrls: ['./keyboard-shortcuts.scss']
})
export class KeyboardShortcutsComponent {

    settinsManager: SettingsManager = settingsManager;
}