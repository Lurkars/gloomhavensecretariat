import { Component, Input } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-settings-menu',
  templateUrl: 'settings.html',
  styleUrls: [ '../menu.scss', 'settings.scss' ]
})
export class SettingsMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  @Input() setDialogPosition: Function | undefined = undefined;

  doubleClick: any = null;

  zoomOut(): void {
    this.zoom(5);
  }

  zoomIn(): void {
    this.zoom(-5);
  }

  zoom(value: number) {
    let factor: number = +window.getComputedStyle(document.body).getPropertyValue('--ghs-factor');
    factor += value;
    this.setZoom(factor);
  }

  setZoom(zoom: number) {
    document.body.style.setProperty('--ghs-factor', zoom + '');
    settingsManager.setZoom(zoom);
    if (this.setDialogPosition) {
      this.setDialogPosition();
    }
  }

  resetZoom(): void {
    this.setZoom(100);
  }

  updateBarsize(event: any) {
    document.body.style.setProperty('--ghs-barsize', event.target.value + '');
  }

  setBarsize(event: any): void {
    settingsManager.setBarsize(event.target.value);
    document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
    if (this.setDialogPosition) {
      this.setDialogPosition();
    }
  }

  resetBarsize(event: any) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      settingsManager.setBarsize(1);
      document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
      if (this.setDialogPosition) {
        this.setDialogPosition();
      }
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  updateFontsize(event: any) {
    document.body.style.setProperty('--ghs-fontsize', event.target.value + '');
  }

  setFontsize(event: any): void {
    settingsManager.setFontsize(event.target.value);
    document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');
    if (this.setDialogPosition) {
      this.setDialogPosition();
    }
  }

  resetFontsize(event: any) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      settingsManager.setFontsize(1);
      document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');
      if (this.setDialogPosition) {
        this.setDialogPosition();
      }
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  fullscreen(): void {
    settingsManager.setFullscreen(!settingsManager.settings.fullscreen);
    if (settingsManager.settings.fullscreen) {
      document.body.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  helperDefaults(): void {
    settingsManager.settings.hints = true;
    settingsManager.settings.dragValues = true;
    settingsManager.settings.hideStats = true;
    settingsManager.settings.calculate = true;
    settingsManager.settings.calculateStats = false;
    settingsManager.settings.eliteFirst = true;
    settingsManager.settings.disableStandees = false;
    settingsManager.settings.randomStandees = false;
    settingsManager.settings.expireConditions = false;
    settingsManager.settings.applyConditions = false;
    settingsManager.settings.activeApplyConditions = false;
    settingsManager.settings.autoscroll = false;
    settingsManager.settings.abilityNumbers = false;
    settingsManager.settings.allyAttackModifierDeck = false;
    settingsManager.settings.moveElements = true;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.storeSettings();
  }
}