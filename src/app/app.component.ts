import { Component, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { gameManager } from './game/businesslogic/GameManager';
import { settingsManager } from './game/businesslogic/SettingsManager';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'gloomhavensecretariat';

  theme: string = '';

  constructor(private meta: Meta) { }

  ngOnInit(): void {
    this.applyStyle();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.applyStyle();
        this.applyAnimations();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  applyStyle() {
    this.theme = settingsManager.settings.theme;
    if (this.theme == 'fh') {
      document.body.classList.remove('modern');
      document.body.classList.remove('bb');
      document.body.classList.add('fh');
      this.meta.updateTag({ name: 'theme-color', content: '#a2bbd1' });
    } else if (this.theme == 'modern') {
      document.body.classList.remove('fh');
      document.body.classList.remove('bb');
      document.body.classList.add('modern');
      this.meta.updateTag({ name: 'theme-color', content: '#0e1f1f' });
    } else if (this.theme == 'bb') {
      document.body.classList.remove('modern');
      document.body.classList.remove('fh');
      document.body.classList.add('bb');
      this.meta.updateTag({ name: 'theme-color', content: '#0e1f1f' });
    } else {
      document.body.classList.remove('fh');
      document.body.classList.remove('modern');
      document.body.classList.remove('bb');
      this.meta.updateTag({ name: 'theme-color', content: '#936658' });
    }

    if (settingsManager.settings.portraitMode) {
      document.body.classList.add('portrait-mode');
    } else {
      document.body.classList.remove('portrait-mode');
    }

    if (!this.isAppDevMode() && !settingsManager.settings.debugRightClick) {
      if (!document.body.classList.contains('disable-context-menu-touch')) {
        document.body.classList.add('disable-context-menu-touch')
      }
    } else if (document.body.classList.contains('disable-context-menu-touch')) {
      document.body.classList.remove('disable-context-menu-touch');
    }
  }

  applyAnimations() {
    if (!settingsManager.settings.animations) {
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