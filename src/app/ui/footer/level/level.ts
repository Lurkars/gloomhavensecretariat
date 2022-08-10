import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
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
      next: (value: boolean) => {
        this.calculateValues();
      }
    })
  }

  calculateValues() {
    this.trap = gameManager.trap();
    this.experience = gameManager.experience();
    this.loot = gameManager.loot();
    this.terrain = gameManager.terrain();
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    gameManager.setLevel(level);
    settingsManager.setLevelCalculation(false);
    gameManager.stateManager.after();
  }

  setSolo(solo: boolean) {
    gameManager.stateManager.before();
    gameManager.game.solo = solo;
    gameManager.stateManager.after();
  }

}

