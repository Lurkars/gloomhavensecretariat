import { Component, isDevMode, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { gameManager } from './game/businesslogic/GameManager';
import { settingsManager } from './game/businesslogic/SettingsManager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gloomhavensecretariat';

  theme: string = '';

  constructor(private meta: Meta) { }

  ngOnInit(): void {
    this.applyStyle();
    gameManager.uiChange.subscribe({
      next: () => {
        this.applyStyle();
        this.applyAnimations();
      }
    })
  }

  applyStyle() {
    this.theme = settingsManager.settings.theme;
    if (this.theme == 'fh') {
      document.body.classList.add('fh');
      this.meta.updateTag({ name: 'theme-color', content: '#a2bbd1' });
    } else {
      document.body.classList.remove('fh');
      this.meta.updateTag({ name: 'theme-color', content: '#936658' });
    }
  }

  applyAnimations() {
    if (settingsManager.settings.disableAnimations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }

  isAppDevMode(): boolean {
    return isDevMode();
  }

  onRightClick() {
    if (!this.isAppDevMode() && !settingsManager.settings.debugRightClick) {
      return false;
    }
    return true;
  }
}