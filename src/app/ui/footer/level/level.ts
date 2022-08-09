import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
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
    this.trap = 2 + gameManager.game.level;
    this.experience = 4 + gameManager.game.level * 2;
    let loot = 2 + Math.floor(gameManager.game.level / 2);
    if (gameManager.game.level >= 7) {
      loot = 6;
    }
    this.loot = loot;
    this.terrain = 1 + Math.ceil(gameManager.game.level / 3);
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    gameManager.setLevel(level);
    gameManager.stateManager.after();
  }

  setSolo(solo: boolean) {
    gameManager.stateManager.before();
    gameManager.game.solo = solo;
    gameManager.stateManager.after();
  }

}

