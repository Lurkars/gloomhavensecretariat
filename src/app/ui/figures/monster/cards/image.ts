import { Component, Input } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';

@Component({
  selector: 'ghs-monster-image',
  templateUrl: './image.html',
  styleUrls: [ './image.scss' ]
})
export class MonsterImageComponent {

  @Input() monster!: Monster;
  gameManager: GameManager = gameManager;
  GameState = GameState;

  toggleFigure() {
    if (gameManager.game.state == GameState.next) {
      gameManager.stateManager.before();
      gameManager.roundManager.toggleFigure(this.monster);
      gameManager.stateManager.after(250);
    }
  }

}