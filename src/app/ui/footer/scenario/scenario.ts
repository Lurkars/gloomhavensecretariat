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
    this.close();
    gameManager.stateManager.before();
    gameManager.scenarioManager.finishScenario(success);
    gameManager.stateManager.after(1000);
  }

  resetRound() {
    this.close();
    gameManager.stateManager.before();
    gameManager.roundManager.resetRound();
    gameManager.stateManager.after(1000);
  }
}

