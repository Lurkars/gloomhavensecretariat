import { Component, isDevMode, OnInit } from '@angular/core';
import { gameManager } from './game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from './game/businesslogic/SettingsManager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {
  title = 'gloomhavensecretary';

  settingsManager: SettingsManager = settingsManager;

  ngOnInit(): void {
    this.applyFhStyle();
    gameManager.uiChange.subscribe({
      next: () => {
        this.applyFhStyle();
      }
    })
  }

  applyFhStyle() {
    if (settingsManager.settings.fhStyle) {
      document.body.classList.add('fh');
    } else {
      document.body.classList.remove('fh');
    }
  }

  isAppDevMode() {
    // This function is meant to be a means for allowing us to spyOn isDevMode
    return isDevMode();
  }

  onRightClick() {
    if(!this.isAppDevMode()) {
      // Ignores right click events in the application when running in prod mode
      // This is helpful on touch devices such as surfaces, chromebooks wh`ere right clicks are
      // much easier to mistakenly trigger than mobile devices or desktops`
      return false;
    }
    // If in dev mode, don't disable the context menu
    return true;
  }
}