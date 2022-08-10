import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { PopupComponent } from '../../popup/popup';

@Component({
  selector: 'ghs-scenario',
  templateUrl: './scenario.html',
  styleUrls: [ '../../popup/popup.scss', './scenario.scss' ]
})
export class ScenarioComponent extends PopupComponent {

  gameManager: GameManager = gameManager;
  
  finishScenario(success : boolean) {
    gameManager.stateManager.before();
    gameManager.finishScenario(success);
    gameManager.stateManager.after(1000);
  }

  resetRound() {
    gameManager.stateManager.before();
    gameManager.resetRound();
    gameManager.stateManager.after(1000);
  }
}

