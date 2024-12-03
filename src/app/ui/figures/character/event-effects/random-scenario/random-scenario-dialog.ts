import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
	standalone: false,
  selector: 'ghs-event-random-scenario-dialog',
  templateUrl: './random-scenario-dialog.html',
  styleUrls: ['./random-scenario-dialog.scss'],
})
export class EventRandomScenarioDialogComponent {

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  scenario: ScenarioData;
  section: boolean = false;
  unlocks: string = "";

  constructor(@Inject(DIALOG_DATA) public data: { scenario: ScenarioData, section: boolean }, private dialogRef: DialogRef) {
    this.scenario = data.scenario;
    this.section = data.section;
    if (this.section) {
      this.unlocks = this.scenario.unlocks ? this.scenario.unlocks.map((unlock) => '%data.scenarioNumber:' + unlock + '%').join(', ') : ''
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  apply() {
    ghsDialogClosingHelper(this.dialogRef, this.scenario);
  }

}