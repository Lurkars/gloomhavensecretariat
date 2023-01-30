import { Component, HostListener, isDevMode, OnInit } from '@angular/core';
import { gameManager } from './game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from './game/businesslogic/SettingsManager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'gloomhavensecretariat';

  settingsManager: SettingsManager = settingsManager;

  zoomInterval: any = null;

  currentZoom: number = 0;

  ngOnInit(): void {
    this.applyFhStyle();
    gameManager.uiChange.subscribe({
      next: () => {
        this.applyFhStyle();
        this.applyAnimations();
      }
    })

    this.currentZoom = settingsManager.settings.zoom;

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        gameManager.stateManager.undo();
      } else if (event.ctrlKey && event.key === 'y' || event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
        gameManager.stateManager.redo();
      } else if (!this.zoomInterval && event.key === 'ArrowUp') {
        this.zoom(-1);
        this.zoomInterval = setInterval(() => {
          this.zoom(-1);
        }, 30);
      } else if (!this.zoomInterval && event.key === 'ArrowDown') {
        this.zoom(1);
        this.zoomInterval = setInterval(() => {
          this.zoom(1);
        }, 30);
      }
    })

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      if (this.zoomInterval && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        clearInterval(this.zoomInterval);
        this.zoomInterval = null;
        settingsManager.setZoom(this.currentZoom);
      }
    })
  }

  @HostListener('pinchmove', ['$event'])
  pinchmove(event: any) {
    if (event.scale < 1) {
      this.zoom(1);
    } else {
      this.zoom(-1);
    }
  }

  @HostListener('pinchend', ['$event'])
  pinchend(event: any) {
    settingsManager.setZoom(this.currentZoom);
  }

  zoom(value: number) {
    this.currentZoom += value;
    document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
  }

  applyFhStyle() {
    if (settingsManager.settings.fhStyle) {
      document.body.classList.add('fh');
    } else {
      document.body.classList.remove('fh');
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