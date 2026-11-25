import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { ScenarioRequirementsComponent, ScenarioRequirementsDialogComponent } from 'src/app/ui/figures/party/requirements/requirements';
import { StatisticsDialogComponent } from 'src/app/ui/figures/party/statistics/statistics-dialog';
import { TreasuresDialogComponent } from 'src/app/ui/figures/party/treasures/treasures-dialog';
import { ScenarioRecapDialogComponent } from 'src/app/ui/figures/scenario-recap/scenario-recap';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSetupComponent } from 'src/app/ui/footer/scenario/scenario-setup/scenario-setup';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    GhsTooltipDirective,
    TrackUUIDPipe,
    ScenarioRequirementsComponent,
    ScenarioSetupComponent,
    TreasureLabelComponent
  ],
  selector: 'ghs-scenario-chart-popup',
  templateUrl: 'scenario-chart-popup.html',
  styleUrls: ['./scenario-chart-popup.scss']
})
export class ScenarioChartPopupDialog {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  scenario: Scenario;
  isSuccess: boolean = false;
  hasStatistics: boolean = false;
  isBlocked: boolean = false;
  isLocked: boolean = false;
  showSetup: boolean = false;
  showTreasures: boolean = false;
  showRecap: boolean = false;
  hasRequirements: boolean = false;
  hasMissingRequirements: boolean = false;
  allRequirements: boolean = false;
  predecessors: ScenarioData[] = [];
  treasures: string[] = [];
  lootedTreasures: number[] = [];
  forceAll: boolean = false;
  randomItemLooted: boolean = false;

  private data: { scenarioData: ScenarioData; forceAll: boolean } = inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.scenario = new Scenario(this.data.scenarioData);
    this.forceAll = this.data.forceAll || false;
    this.update();
  }

  update() {
    this.isSuccess = gameManager.scenarioRequirementsManager.isSuccess(this.scenario);
    this.hasStatistics = settingsManager.settings.scenarioStats && gameManager.scenarioStatsManager.hasScenarioStats(this.scenario);
    this.isBlocked = gameManager.scenarioRequirementsManager.isBlocked(this.scenario);
    this.isLocked = gameManager.scenarioRequirementsManager.isLocked(this.scenario);
    this.showSetup = this.isSuccess;
    this.randomItemLooted = gameManager.game.party.randomItemLooted.some(
      (model) =>
        model.edition === this.scenario.edition &&
        (model.group ?? '') === (this.scenario.group ?? '') &&
        model.index === this.scenario.index
    );
    this.hasRequirements = gameManager.scenarioRequirementsManager.getRequirements(this.scenario, true).length > 0;
    this.hasMissingRequirements = gameManager.scenarioRequirementsManager.getRequirements(this.scenario).length > 0;
    this.lootedTreasures = [];
    this.treasures = gameManager.treasureManager
      .getTreasures(
        this.scenario,
        gameManager.scenarioManager.getSections(this.scenario).map((sectionData) => new Scenario(sectionData)),
        false,
        true
      )
      .filter((treasure) => treasure !== 'G')
      .map((treasure) => {
        treasure = +treasure;
        const looted = gameManager.game.party.treasures.find(
          (id) => id.edition === this.scenario.edition && (id.name === '' + treasure || id.name.startsWith(treasure + ':'))
        );
        if (looted) {
          this.lootedTreasures.push(treasure);
          return looted.name;
        }
        return '' + treasure;
      });

    this.showTreasures = (this.treasures.length > 0 && this.treasures.length === this.lootedTreasures.length) || this.showSetup;

    this.predecessors = gameManager.scenarioRequirementsManager.getPredecessors(this.scenario, this.forceAll);
  }

  setScenario() {
    if (!gameManager.scenarioRequirementsManager.isCurrent(this.scenario)) {
      if (gameManager.scenarioRequirementsManager.isLocked(this.scenario)) {
        this.dialog
          .open(ScenarioRequirementsDialogComponent, {
            panelClass: ['dialog'],
            data: { scenarioData: this.scenario }
          })
          .closed.subscribe({
            next: (result) => {
              if (result) {
                this.dialogRef.close(result);
              }
            }
          });
      } else if (gameManager.scenarioManager.canSelectScenario(this.scenario)) {
        gameManager.stateManager.before('setScenario', ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.scenario)));
        gameManager.scenarioManager.selectScenario(this.scenario);
        gameManager.stateManager.after();
        ghsDialogClosingHelper(this.dialogRef, true);
      }
    }
  }

  openTreasureDialog(treasure: number) {
    if (!this.lootedTreasures.includes(treasure)) {
      this.dialog.open(TreasuresDialogComponent, {
        panelClass: ['dialog'],
        data: { edition: this.scenario.edition, scenario: this.scenario }
      });
    }
  }

  openRecapDialog() {
    this.dialog.open(ScenarioRecapDialogComponent, {
      panelClass: ['dialog'],
      data: { scenario: this.scenario, forceAll: this.forceAll }
    });
  }

  openScenarioRewards(conclusionOnly: boolean = false) {
    const conclusion = gameManager.game.party.conclusions
      .filter((value) => value.edition === this.scenario.edition)
      .map(
        (value) =>
          gameManager.editionManager
            .sectionData(this.scenario.edition)
            .find(
              (sectionData) =>
                sectionData.index === value.index && sectionData.edition === value.edition && sectionData.group === value.group
            ) as ScenarioData
      )
      .find((conclusionData) => conclusionData.parent === this.scenario.index && conclusionData.group === this.scenario.group);

    this.dialog.open(ScenarioSummaryComponent, {
      panelClass: ['dialog'],
      data: {
        scenario: this.scenario,
        conclusion: conclusion,
        success: true,
        rewardsOnly: true,
        conclusionOnly: conclusionOnly
      }
    });
  }

  openStatisticsDialog() {
    this.dialog.open(StatisticsDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { scenario: this.scenario }
    });
  }

  // the chart allows to mark any scenario as finished
  addSuccess() {
    const conclusions = gameManager.scenarioFinishManager.successConclusions(this.scenario);
    if (conclusions.length === 0) {
      this.addSuccessIntern();
    } else {
      this.dialog
        .open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: { conclusions: conclusions, parent: this.scenario }
        })
        .closed.subscribe({
          next: (conclusion) => {
            if (conclusion) {
              this.addSuccessIntern(conclusion as ScenarioData);
            }
          }
        });
    }
  }

  addSuccessIntern(conclusionSection: ScenarioData | undefined = undefined) {
    gameManager.stateManager.before('finishScenario.success', ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.scenario)));
    gameManager.scenarioFinishManager.addScenarioSuccess(this.scenario, conclusionSection, true);
    gameManager.stateManager.after();
    this.update();
  }
}
