import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';

@Component({
  selector: 'ghs-scenario',
  templateUrl: './scenario.html',
  styleUrls: ['./scenario.scss']
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
  styleUrls: ['./scenario-dialog.scss']
})
export class ScenarioDialogComponent {

  gameManager: GameManager = gameManager;

  constructor(private dialogRef: DialogRef, private dialog: Dialog) { }

  finishScenario(success: boolean) {
    this.dialogRef.close();
    this.dialog.open(ScenarioSummaryComponent, {
      panelClass: 'dialog',
      data: success
    })
  }

  cancelScenario() {
    this.dialogRef.close();
    gameManager.stateManager.before("cancelScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioManager.setScenario(undefined);
    gameManager.stateManager.after(1000);
  }
}


@Component({
  selector: 'ghs-scenario-summary',
  templateUrl: './scenario-summary.html',
  styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent {

  gameManager: GameManager = gameManager;

  characters: Character[];

  constructor(@Inject(DIALOG_DATA) public success: boolean, private dialogRef: DialogRef) {
    this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => {
      let char = new Character((figure as Character), figure.level);
      char.fromModel((figure as Character).toModel());
      return char;
    })

    dialogRef.closed.subscribe({
      next: () => {
        gameManager.stateManager.before("finishScenario." + (success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(success);
        gameManager.stateManager.after(1000);
      }
    })

  }

}

