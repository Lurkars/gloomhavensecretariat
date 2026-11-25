import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';
import { ScenarioTreasuresDialogComponent } from 'src/app/ui/footer/scenario/treasures/treasures-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, TrackUUIDPipe, TreasureLabelComponent],
  selector: 'ghs-treasures-dialog',
  templateUrl: 'treasures-dialog.html',
  styleUrls: ['./treasures-dialog.scss']
})
export class TreasuresDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  edition: string;
  scenarios: ScenarioData[] = [];
  treasures: Record<string, number[]> = {};
  looted: number[] = [];
  selected: number[] = [];
  batchSelect: boolean = true;

  data: { edition: string; scenario: ScenarioData | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.edition = this.data.edition;
    this.batchSelect = this.data.scenario === undefined;
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.scenarios = [];
    this.treasures = {};
    this.looted = [];
    this.selected = [];
    gameManager.scenarioManager
      .scenarioData(this.edition)
      .filter(
        (scenarioData) =>
          (!this.data.scenario &&
            (gameManager.scenarioRequirementsManager.isSuccess(scenarioData) ||
              gameManager.game.party.casualScenarios.find(
                (value) =>
                  scenarioData.index === value.index && scenarioData.edition === value.edition && scenarioData.group === value.group
              ))) ||
          (this.data.scenario &&
            scenarioData.edition === this.data.scenario.edition &&
            scenarioData.index === this.data.scenario.index &&
            scenarioData.group === this.data.scenario.group)
      )
      .forEach((scenarioData) => {
        let treasures: number[] = gameManager.treasureManager
          .getAllTreasures(scenarioData)
          .filter((value) => typeof value === 'number')
          .map((value) => +value);

        if (!this.batchSelect) {
          treasures = treasures.filter((value) => !this.hasTreasure(value, this.edition));
        }

        if (treasures.length > 0) {
          this.scenarios.push(scenarioData);
          this.treasures[scenarioData.index] = treasures;
          treasures.forEach((value) => {
            if (this.hasTreasure(value, this.edition)) {
              this.looted.push(value);
            }
          });
        }
      });
  }

  toggleTreasure(index: number, forceLoot: boolean = false) {
    if (this.batchSelect && !forceLoot) {
      if (!this.selected.includes(index)) {
        this.selected.push(index);
      } else {
        this.selected.splice(this.selected.indexOf(index), 1);
      }
    } else if (this.data.scenario && !forceLoot) {
      if (!this.selected.includes(index)) {
        this.selected = [];
        this.selected.push(index);
      } else {
        this.selected.splice(this.selected.indexOf(index), 1);
      }
    } else if (!this.looted.includes(index)) {
      this.dialog.open(ScenarioTreasuresDialogComponent, {
        panelClass: ['dialog'],
        data: {
          treasures: [index],
          edition: this.edition
        }
      });
    }
  }

  hasTreasure(treasure: string | number, edition: string): boolean {
    return gameManager.treasureManager.hasPartyTreasure(edition, treasure);
  }

  apply() {
    const removeTreasures = this.selected.filter((index) => this.looted.includes(index));
    const addTreasures = this.selected.filter((index) => !this.looted.includes(index));
    if (removeTreasures.length > 0) {
      gameManager.stateManager.before('removeTreasures', this.edition, '[' + removeTreasures.join(',') + ']');
      removeTreasures.forEach((treasure) => gameManager.treasureManager.setPartyTreasure(this.edition, treasure, false));
      gameManager.stateManager.after();
    }

    if (addTreasures.length > 0) {
      gameManager.stateManager.before('addTreasures', this.edition, '[' + addTreasures.join(',') + ']');
      addTreasures.forEach((treasure) => gameManager.treasureManager.setPartyTreasure(this.edition, treasure, true));
      gameManager.stateManager.after();
    }

    this.update();
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
