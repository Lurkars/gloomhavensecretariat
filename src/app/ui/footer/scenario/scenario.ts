import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';

@Component({
  selector: 'ghs-scenario',
  templateUrl: './scenario.html',
  styleUrls: ['./scenario.scss']
})
export class ScenarioComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor(private dialog: Dialog) { }

  open(event: any) {
    this.dialog.open(ScenarioDialogComponent, { panelClass: 'dialog' });
  }

  openRoom(roomData: RoomData, event: any) {
    event.preventDefault();
    event.stopPropagation();
    const scenario = gameManager.game.scenario;
    if (scenario) {
      const editionData: EditionData | undefined = gameManager.editionData.find((value) => gameManager.game.scenario && value.edition == gameManager.game.scenario.edition);

      if (!editionData) {
        console.error("Could not find edition data!");
        return;
      }
      gameManager.stateManager.before(roomData.marker ? "openRoomMarker" : "openRoom", scenario.index, "data.scenario." + scenario.name, '' + roomData.ref, roomData.marker || '');
      gameManager.scenarioManager.openRoom(roomData, scenario);
      gameManager.stateManager.after();
    }
  }

  addSection(sectionData: ScenarioData, event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.dialog.open(SectionDialogComponent,
      {
        panelClass: 'dialog',
        data: sectionData
      });
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

  resetScenario() {
    if (gameManager.game.scenario) {
      this.dialogRef.close();
      gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
      gameManager.roundManager.resetScenario();
      gameManager.scenarioManager.setScenario(gameManager.game.scenario)
      gameManager.stateManager.after();
    }
  }

  cancelScenario() {
    this.dialogRef.close();
    gameManager.stateManager.before("cancelScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioManager.setScenario(undefined);
    gameManager.stateManager.after(1000);
  }

  openRoom(roomData: RoomData) {
    const scenario = gameManager.game.scenario;
    if (scenario) {
      const editionData: EditionData | undefined = gameManager.editionData.find((value) => gameManager.game.scenario && value.edition == gameManager.game.scenario.edition);

      if (!editionData) {
        console.error("Could not find edition data!");
        return;
      }
      gameManager.stateManager.before(roomData.marker ? "openRoomMarker" : "openRoom", scenario.index, "data.scenario." + scenario.name, '' + roomData.ref, roomData.marker || '');
      gameManager.scenarioManager.openRoom(roomData, scenario);
      gameManager.stateManager.after();
    }
  }

  addSection(sectionData: ScenarioData) {
    this.dialog.open(SectionDialogComponent,
      {
        panelClass: 'dialog',
        data: sectionData
      }).closed.subscribe({
        next: (added) => {
          if (added) {
            this.dialogRef.close();
          }
        }
      });
  }
}



@Component({
  selector: 'ghs-section-dialog',
  templateUrl: './section-dialog.html',
  styleUrls: ['./section-dialog.scss']
})
export class SectionDialogComponent {

  gameManager: GameManager = gameManager;

  constructor(@Inject(DIALOG_DATA) public sectionData: ScenarioData, private dialogRef: DialogRef) { }

  addSection() {
    gameManager.stateManager.before("addSection", this.sectionData.index, "data.section." + this.sectionData.name, "data.edition." + this.sectionData.edition);
    gameManager.scenarioManager.addSection(this.sectionData);
    gameManager.stateManager.after();
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
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

