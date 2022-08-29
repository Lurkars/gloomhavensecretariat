import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { DialogComponent } from '../../dialog/dialog';
import { ghsValueSign } from '../../helper/Static';

@Component({
  selector: 'ghs-level',
  templateUrl: './level.html',
  styleUrls: [ './level.scss', '../../dialog/dialog.scss' ]
})
export class LevelComponent extends DialogComponent {

  gameManager: GameManager = gameManager;
  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
  trap: number = 0;
  experience: number = 0;
  loot: number = 0;
  terrain: number = 0;

  constructor() {
    super();
    gameManager.uiChange.subscribe({
      next: () => {
        this.calculateValues();
      }
    })
  }

  setLevelCalculation(levelCalculation: boolean) {
    gameManager.stateManager.before(levelCalculation ? "enableAutomaticLevel" : "disabledAutomaticLevel");
    gameManager.game.levelCalculation = levelCalculation;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setLevelAdjustment(levelAdjustment: number) {
    gameManager.stateManager.before("updateLevelAdjustment", ghsValueSign(levelAdjustment));
    gameManager.game.levelAdjustment = levelAdjustment;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setBonusAdjustment(bonusAdjustment: number) {
    gameManager.stateManager.before("updateBonusAdjustment", ghsValueSign(bonusAdjustment));
    gameManager.game.bonusAdjustment = bonusAdjustment;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setGe5Player(ge5Player: boolean) {
    gameManager.stateManager.before(ge5Player ? "enabledGe5Player" : "disabledGe5Player");
    gameManager.game.ge5Player = ge5Player;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  ge5Player(): boolean {
    return gameManager.game.figures.filter((figure) => figure instanceof Character).length > 4;
  }

  calculateValues() {
    this.trap = gameManager.levelManager.trap();
    this.experience = gameManager.levelManager.experience();
    this.loot = gameManager.levelManager.loot();
    this.terrain = gameManager.levelManager.terrain();
  }

  setLevel(level: number) {
    gameManager.stateManager.before("setScenarioLevel", "" + level);
    gameManager.levelManager.setLevel(level);
    gameManager.game.levelCalculation = false;
    gameManager.stateManager.after();
  }

  setSolo(solo: boolean) {
    gameManager.stateManager.before(solo ? "enableSolo" : "disableSolo");
    gameManager.game.solo = solo;
    gameManager.stateManager.after();
  }

}

