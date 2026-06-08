import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario, ScenarioMissingRequirements } from 'src/app/game/model/Scenario';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [FormsModule, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-requirements',
  templateUrl: 'requirements.html',
  styleUrls: ['./requirements.scss']
})
export class ScenarioRequirementsComponent implements OnInit, OnChanges {
  readonly inputScenarioData = input.required<ScenarioData>({ alias: 'scenarioData' });
  get scenarioData(): ScenarioData {
    return this.inputScenarioData();
  }

  readonly highlight = input<boolean>(false);
  readonly inputAll = input<boolean>(false, { alias: 'all' });
  readonly allToggle = input<boolean>(true);
  gameManager: GameManager = gameManager;

  all: boolean = false;
  solo: string = '';
  requirements: ScenarioMissingRequirements[] = [];
  missingRequirements: ScenarioMissingRequirements[] = [];
  hideAll: boolean = false;

  ngOnInit(): void {
    this.all = this.inputAll();
    this.update();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['all']) {
      this.update();
    }
  }

  update() {
    this.requirements = gameManager.scenarioManager.getRequirements(this.scenarioData, this.all);
    this.missingRequirements = gameManager.scenarioManager.getRequirements(this.scenarioData);
    this.solo = '';
    this.hideAll =
      !this.all &&
      JSON.stringify(gameManager.scenarioManager.getRequirements(this.scenarioData, true)) === JSON.stringify(this.requirements);
    if (
      this.scenarioData.solo &&
      (this.all ||
        !gameManager.game.figures.find(
          (figure) => figure instanceof Character && figure.name === this.scenarioData.solo && figure.level >= 5
        ))
    ) {
      this.solo = this.scenarioData.solo;
    }
  }
}

@Component({
  imports: [GhsLabelDirective, ScenarioRequirementsComponent],
  selector: 'ghs-requirements-dialog',
  templateUrl: 'requirements-dialog.html',
  styleUrls: ['./requirements-dialog.scss']
})
export class ScenarioRequirementsDialogComponent {
  private dialogRef = inject(DialogRef);

  gameManager: GameManager = gameManager;

  data: { scenarioData: ScenarioData; linked: boolean; hideMenu: boolean } = inject(DIALOG_DATA);

  startScenario() {
    gameManager.stateManager.before('setScenario', ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.data.scenarioData)));
    gameManager.scenarioManager.setScenario(new Scenario(this.data.scenarioData), this.data.linked || false);
    gameManager.stateManager.after();
    ghsDialogClosingHelper(this.dialogRef, true);
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
