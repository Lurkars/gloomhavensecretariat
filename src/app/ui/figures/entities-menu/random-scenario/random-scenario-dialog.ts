import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-event-random-scenario-dialog',
  templateUrl: './random-scenario-dialog.html',
  styleUrls: ['./random-scenario-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventRandomScenarioDialogComponent {
  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  scenario: ScenarioData;
  section: boolean = false;
  unlocks: string = '';

  data: { scenario: ScenarioData; section: boolean } = inject(DIALOG_DATA);

  constructor(private dialogRef: DialogRef) {
    this.scenario = this.data.scenario;
    this.section = this.data.section;
    if (this.section) {
      this.unlocks = this.scenario.unlocks ? this.scenario.unlocks.map((unlock) => '%data.scenarioNumber:' + unlock + '%').join(', ') : '';
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  apply() {
    ghsDialogClosingHelper(this.dialogRef, this.scenario);
  }
}
