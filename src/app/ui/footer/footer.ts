import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';

@Component({
  selector: 'ghs-footer',
  templateUrl: './footer.html',
  styleUrls: [ './footer.scss' ]
})
export class FooterComponent {

  gameManager: GameManager = gameManager;
  GameState = GameState;


  next(): void {
    gameManager.stateManager.before();
    gameManager.nextGameState();
    gameManager.stateManager.after(1000);
  }
}

