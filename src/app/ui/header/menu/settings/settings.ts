import { Component, Input } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-settings-menu',
  templateUrl: 'settings.html',
  styleUrls: [ '../menu.scss' ]
})
export class SettingsMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  @Input() setDialogPosition: Function | undefined = undefined;

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
    settingsManager.setZoom(zoom);
    document.body.style.setProperty('--ghs-factor', zoom + '');
    if (this.setDialogPosition) {
      this.setDialogPosition();
    }
  }

  zoomReset(): void {
    this.setZoom(100);
  }

  fullscreen(): void {
    settingsManager.setFullscreen(!settingsManager.settings.fullscreen);
    if (settingsManager.settings.fullscreen) {
      document.body.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  resetGame(): void {
    gameManager.stateManager.reset();
    window.location.reload();
  }

  resetSettings(): void {
    settingsManager.reset();
    window.location.reload();
  }
}