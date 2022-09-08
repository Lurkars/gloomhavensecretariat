import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';

@Component({
  selector: 'ghs-scenario',
  templateUrl: './scenario.html',
  styleUrls: [ './scenario.scss' ]
})
export class ScenarioComponent {

  gameManager: GameManager = gameManager;

  constructor(private dialog: Dialog) { }

  open(event: any) {
    this.dialog.open(ScenarioDialogComponent, { panelClass: 'dialog' });
  }

}

@Component({
  selector: 'ghs-scenario-dialog',
  templateUrl: './scenario-dialog.html',
  styleUrls: [ './scenario-dialog.scss' ]
})
export class ScenarioDialogComponent {

  gameManager: GameManager = gameManager;

  constructor(private dialogRef: DialogRef) { }

  finishScenario(success: boolean) {
    this.dialogRef.close();
    gameManager.stateManager.before("finishScenario." + (success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioManager.finishScenario(success);
    gameManager.stateManager.after(1000);
  }

  resetScenario() {
    this.dialogRef.close();
    gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.roundManager.resetScenario();
    gameManager.stateManager.after(1000);
  }
}

