import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { DialogComponent } from '../../dialog/dialog';

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
    gameManager.stateManager.before();
    gameManager.game.levelCalculation = levelCalculation;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  calculateValues() {
    this.trap = gameManager.levelManager.trap();
    this.experience = gameManager.levelManager.experience();
    this.loot = gameManager.levelManager.loot();
    this.terrain = gameManager.levelManager.terrain();
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    gameManager.levelManager.setLevel(level);
    gameManager.game.levelCalculation = false;
    gameManager.stateManager.after();
  }

  setSolo(solo: boolean) {
    gameManager.stateManager.before();
    gameManager.game.solo = solo;
    gameManager.stateManager.after();
  }

}

