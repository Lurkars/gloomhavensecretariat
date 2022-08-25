import { Component, Input } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
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

  setLevelCalculation(levelCalculation: boolean) {
    gameManager.stateManager.before();
    gameManager.game.levelCalculation = levelCalculation;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }
  setLevelAdjustment(levelAdjustment: number) {
    gameManager.stateManager.before();
    gameManager.game.levelAdjustment = levelAdjustment;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setBonusAdjustment(bonusAdjustment: number) {
    gameManager.stateManager.before();
    gameManager.game.bonusAdjustment = bonusAdjustment;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setGe5Player(ge5Player: boolean) {
    gameManager.stateManager.before();
    gameManager.game.ge5Player = ge5Player;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }
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

  setBarSize(barSize: number) {
    document.body.style.setProperty('--ghs-barsize', barSize + '');
    settingsManager.setBarSize(barSize);
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

  ge5Player(): boolean {
    return gameManager.game.figures.filter((figure) => figure instanceof Character).length > 4;
  }
}