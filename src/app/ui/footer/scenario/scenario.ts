import { Dialog } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioDialogComponent } from './dialog/scenario-dialog';
import { SectionDialogComponent } from './section/section-dialog';
import { ScenarioTreasuresDialogComponent } from './treasures/treasures-dialog';

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
    if (gameManager.game.scenario) {
      this.dialog.open(ScenarioDialogComponent, { data: gameManager.game.scenario, panelClass: 'dialog' });
    }
  }

  openTreasures(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (gameManager.game.scenario) {
      this.dialog.open(ScenarioTreasuresDialogComponent,
        {
          panelClass: 'dialog'
        });
    }
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
      gameManager.scenarioManager.openRoom(roomData, scenario, false);
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
