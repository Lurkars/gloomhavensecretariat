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

  override ngOnInit(): void {
    super.ngOnInit();
    this.calculate();
  }


  calculate() {
    this.trap = 2 + gameManager.game.level;
    this.experience = Math.ceil(4 + gameManager.game.level * 2);
    this.loot = Math.ceil(2 + gameManager.game.level / 2);
    if (this.loot > 6) {
      this.loot = 6;
    }
  }

  setLevel(level: number) {
    gameManager.stateManager.before();
    gameManager.setLevel(level);
    this.calculate();
    gameManager.stateManager.after();
  }



}

