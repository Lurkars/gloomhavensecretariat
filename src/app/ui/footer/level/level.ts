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

  trap(): number {
    return 2 + gameManager.game.level;
  }

  experience(): number {
    return 4 + gameManager.game.level * 2;
  }

  loot(): number {
    let loot = 2 + Math.floor(gameManager.game.level / 2);
    if (gameManager.game.level >= 7) {
      loot = 6;
    }
    return loot;
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    gameManager.setLevel(level);
    gameManager.stateManager.after();
  }



}

