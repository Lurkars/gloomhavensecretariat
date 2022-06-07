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


  zoomReset(): void {
    this.setZoom(100);
  }

  setZoom(zoom: number) {
    settingsManager.setZoom(zoom);
    document.body.style.setProperty('--ghs-factor', zoom + '');
    if (this.setDialogPosition) {
      this.setDialogPosition();
    }
  }

  reset(): void {
    gameManager.stateManager.reset();
    settingsManager.reset();
    window.location.reload();
  }

  toggleCalc() {
    settingsManager.setCalculate(!settingsManager.settings.calculate)
  }
}