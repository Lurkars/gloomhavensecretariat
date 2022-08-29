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

  finishScenario(success: boolean) {
    this.close();
    gameManager.stateManager.before("finishScenario" + (success ? "Sucess" : "Failure"));
    gameManager.scenarioManager.finishScenario(success);
    gameManager.stateManager.after(1000);
  }

  resetScenario() {
    this.close();
    gameManager.stateManager.before("resetScenario");
    gameManager.roundManager.resetScenario();
    gameManager.stateManager.after(1000);
  }
}

