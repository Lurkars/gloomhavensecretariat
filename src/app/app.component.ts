import { Component } from '@angular/core';
import { settingsManager, SettingsManager } from './game/businesslogic/SettingsManager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent {
  title = 'gloomhavensecretary';

  settingsManager: SettingsManager = settingsManager;
}