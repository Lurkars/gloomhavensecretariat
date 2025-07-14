import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { gameManager } from './game/businesslogic/GameManager';
import { settingsManager } from './game/businesslogic/SettingsManager';
import { ghsDialogClosingHelper } from './ui/helper/Static';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'gloomhavensecretariat';

  theme: string = '';
  locale: string = '';

  constructor(private meta: Meta, private dialog: Dialog) {
    this.dialog.afterOpened.subscribe({
      next: (dialogRef: DialogRef) => {
        if (dialogRef.overlayRef.backdropElement && dialog.openDialogs.length > 1 && !dialogRef.overlayRef.backdropElement.classList.contains('fullscreen-backdrop')) {
          dialogRef.overlayRef.backdropElement.style.opacity = '0';
        }

        if (!dialogRef.disableClose) {
          let closeIcon = document.createElement('img');
          closeIcon.src = './assets/images/close_dialog.svg';
          let closeElement = document.createElement('a');
          closeElement.classList.add('dialog-close-button');
          closeElement.appendChild(closeIcon);
          closeElement.addEventListener('click', () => {
            ghsDialogClosingHelper(dialogRef);
          });
          closeElement.title = settingsManager.getLabel('close');
          if (dialogRef.overlayRef.hostElement) {
            dialogRef.overlayRef.hostElement.appendChild(closeElement);
          }

          if (dialogRef.overlayRef.backdropElement) {
            dialogRef.disableClose = true;
            dialogRef.overlayRef.backdropElement.addEventListener('click', () => {
              ghsDialogClosingHelper(dialogRef);
            });
          }

          dialogRef.keydownEvents.subscribe(event => {
            if (settingsManager.settings.keyboardShortcuts && !event.ctrlKey && !event.shiftKey && !event.altKey && event.key === "Escape") {
              ghsDialogClosingHelper(dialogRef);
            }
          });
        }
      }
    })
  }

  ngOnInit(): void {
    this.applyStyle();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.applyStyle();
        this.applyAnimations();
      }
    })
    const preventDefault = (e: Event) => e.preventDefault();

    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);
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

    this.locale = settingsManager.settings.locale;
    for (let i = document.body.classList.length - 1; i >= 0; i--) {
      const className = document.body.classList[i];
      if (className.startsWith('locale-')) {
        document.body.classList.remove(className);
      }
    }
    document.body.classList.add('locale-' + this.locale)
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
