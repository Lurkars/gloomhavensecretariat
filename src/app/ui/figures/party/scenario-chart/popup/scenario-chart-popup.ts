import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { Scenario } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioRequirementsDialogComponent } from "src/app/ui/figures/party/requirements/requirements";
import { TreasuresDialogComponent } from "src/app/ui/figures/party/treasures/treasures-dialog";
import { ScenarioConclusionComponent } from "src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { ScenarioRecapDialogComponent } from "../../../scenario-recap/scenario-recap";
import { StatisticsDialogComponent } from "../../statistics/statistics-dialog";

@Component({
    standalone: false,
    selector: 'ghs-scenario-chart-popup',
    templateUrl: 'scenario-chart-popup.html',
    styleUrls: ['./scenario-chart-popup.scss']
})
export class ScenarioChartPopupDialog {

    gameManager: GameManager = gameManager;
    scenario: Scenario;
    isSuccess: boolean = false;
    showSetup: boolean = false;
    showTreasures: boolean = false;
    showRecap: boolean = false;
    hasRequirements: boolean = false;
    hasMissingRequirements: boolean = false;
    allRequirements: boolean = false;
    predecessors: ScenarioData[] = [];
    treasures: string[] = [];
    lootedTreasures: number[] = [];

    constructor(@Inject(DIALOG_DATA) public scenarioData: ScenarioData, private dialogRef: DialogRef, private dialog: Dialog, private ghsManager: GhsManager) {
        this.ghsManager.uiChangeEffect(() => this.update());
        this.scenario = new Scenario(scenarioData);
        this.update();
    }


    update() {
        this.isSuccess = gameManager.scenarioManager.isSuccess(this.scenario);
        this.showSetup = this.isSuccess;
        this.hasRequirements = gameManager.scenarioManager.getRequirements(this.scenario, true).length > 0;
        this.hasMissingRequirements = gameManager.scenarioManager.getRequirements(this.scenario).length > 0;
        this.lootedTreasures = [];
        this.treasures = gameManager.scenarioManager.getTreasures(this.scenario, gameManager.scenarioManager.getSections(this.scenario).map((sectionData) => new Scenario(sectionData)), false, true).filter((treasure) => treasure != 'G').map((treasure) => {
            treasure = +treasure;
            const looted = gameManager.game.party.treasures.find((id) => id.edition == this.scenario.edition && (id.name == '' + treasure || id.name.startsWith(treasure + ':')));
            if (looted) {
                this.lootedTreasures.push(treasure);
                return looted.name;
            }
            return '' + treasure;
        });

        this.showTreasures = this.treasures.length > 0 && this.treasures.length == this.lootedTreasures.length || this.showSetup;

        this.predecessors = gameManager.scenarioManager.getPredecessors(this.scenario);
    }

    setScenario() {
        if (!gameManager.scenarioManager.isCurrent(this.scenario)) {
            if (gameManager.scenarioManager.isLocked(this.scenario)) {
                this.dialog.open(ScenarioRequirementsDialogComponent, {
                    panelClass: ['dialog'],
                    data: { scenarioData: this.scenario }
                }).closed.subscribe({
                    next: (result) => {
                        if (result) {
                            this.dialogRef.close(result);
                        }
                    }
                })
            } else {
                gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.scenario)));
                gameManager.scenarioManager.setScenario(new Scenario(this.scenario));
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
            })
        }
    }

    openRecapDialog() {
        this.dialog.open(ScenarioRecapDialogComponent, {
            panelClass: ['dialog'],
            data: this.scenario
        })
    }

    openScenarioRewards(conclusionOnly: boolean = false) {
        const conclusion = gameManager.game.party.conclusions.filter((value) => value.edition == this.scenarioData.edition).map((value) => gameManager.sectionData(this.scenarioData.edition).find((sectionData) => sectionData.index == value.index && sectionData.edition == value.edition && sectionData.group == value.group) as ScenarioData).find((conclusionData) => conclusionData.parent == this.scenarioData.index && conclusionData.group == this.scenarioData.group);

        this.dialog.open(ScenarioSummaryComponent, {
            panelClass: ['dialog'],
            data: {
                scenario: new Scenario(this.scenarioData),
                conclusion: conclusion,
                success: true,
                rewardsOnly: true,
                conclusionOnly: conclusionOnly
            }
        })
    }

    openStatisticsDialog() {
        this.dialog.open(StatisticsDialogComponent, {
            panelClass: ['dialog-invert'],
            data: { scenario: this.scenario }
        })
    }


    addSuccess() {
        const conclusions = gameManager.sectionData(this.scenario.edition).filter((sectionData) =>
            sectionData.edition == this.scenario.edition && sectionData.parent == this.scenario.index && sectionData.group == this.scenario.group && sectionData.conclusion && gameManager.scenarioManager.getRequirements(sectionData).length == 0);
        if (conclusions.length == 0) {
            this.addSuccessIntern();
        } else {
            this.dialog.open(ScenarioConclusionComponent, {
                panelClass: ['dialog'],
                data: { conclusions: conclusions, parent: this.scenario }
            }).closed.subscribe({
                next: (conclusion) => {
                    if (conclusion) {
                        this.addSuccessIntern(conclusion as ScenarioData);
                    }
                }
            });
        }
    }

    addSuccessIntern(conclusionSection: ScenarioData | undefined = undefined) {
        gameManager.stateManager.before("finishScenario.success", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.scenario)));
        gameManager.scenarioManager.finishScenario(new Scenario(this.scenario), true, conclusionSection, false, false, false, gameManager.game.party.campaignMode && this.countFinished() == 0, true);
        gameManager.stateManager.after();
        this.update();
    }

    countFinished(): number {
        return (!gameManager.game.party.campaignMode ? gameManager.game.party.casualScenarios : gameManager.game.party.scenarios).filter((value) => this.scenario.index == value.index && this.scenario.edition == value.edition && this.scenario.group == value.group).length;
    }
}
