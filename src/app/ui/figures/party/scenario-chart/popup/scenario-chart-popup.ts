import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Scenario } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioRequirementsDialogComponent } from "src/app/ui/figures/party/requirements/requirements";
import { TreasuresDialogComponent } from "src/app/ui/figures/party/treasures/treasures-dialog";
import { ScenarioConclusionComponent } from "src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-scneario-chart-popup',
    templateUrl: 'scenario-chart-popup.html',
    styleUrls: ['./scenario-chart-popup.scss']
})
export class ScenarioChartPopupDialog {

    gameManager: GameManager = gameManager;
    scenario: Scenario;
    isSuccess: boolean = false;
    showSetup: boolean = false;
    showTreasures: boolean = false;
    hasRequirements: boolean = false;
    hasMissingRequirements: boolean = false;
    allRequirements: boolean = false;
    predecessors: ScenarioData[] = [];
    treasures: string[] = [];
    lootedTreasures: number[] = [];

    constructor(@Inject(DIALOG_DATA) public scenarioData: ScenarioData, private dialogRef: DialogRef, private dialog: Dialog) {
        this.scenario = new Scenario(scenarioData);
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
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

        this.predecessors = [];

        let predecessor = gameManager.scenarioManager.scenarioData(this.scenario.edition).find((other) => other.group == this.scenario.group && other.unlocks && other.unlocks.indexOf(this.scenario.index) != -1 && (!gameManager.game.party.campaignMode || gameManager.scenarioManager.isSuccess(other)));

        if (!predecessor) {
            predecessor = gameManager.sectionData(this.scenario.edition).find((sectionData) => sectionData.conclusion && sectionData.group == this.scenario.group && sectionData.parent && sectionData.unlocks && sectionData.unlocks.indexOf(this.scenario.index) != -1 && gameManager.game.party.conclusions.find((conclusion) => conclusion.edition == sectionData.edition && conclusion.group == sectionData.group && conclusion.index == sectionData.index));
            if (predecessor) {
                predecessor = gameManager.scenarioManager.scenarioData(predecessor.edition).find((other) => predecessor && other.group == predecessor.group && other.index == predecessor.parent && (!gameManager.game.party.campaignMode || gameManager.scenarioManager.isSuccess(other)));
            }
        }

        while (predecessor) {
            this.predecessors.unshift(predecessor);
            let newPredecessor = gameManager.scenarioManager.scenarioData(predecessor.edition).find((other) => predecessor && other.group == predecessor.group && other.unlocks && other.unlocks.indexOf(predecessor.index) != -1 && (!gameManager.game.party.campaignMode || gameManager.scenarioManager.isSuccess(other)));

            if (!newPredecessor) {
                newPredecessor = gameManager.sectionData(predecessor.edition).find((sectionData) => predecessor && sectionData.conclusion && sectionData.group == predecessor.group && sectionData.parent && sectionData.unlocks && sectionData.unlocks.indexOf(predecessor.index) != -1 && gameManager.game.party.conclusions.find((conclusion) => conclusion.edition == sectionData.edition && conclusion.group == sectionData.group && conclusion.index == sectionData.index));
                if (newPredecessor) {
                    newPredecessor = gameManager.scenarioManager.scenarioData(predecessor.edition).find((other) => newPredecessor && other.group == newPredecessor.group && other.index == newPredecessor.parent && (!gameManager.game.party.campaignMode || gameManager.scenarioManager.isSuccess(other)));
                }
            }

            predecessor = newPredecessor;
            if (predecessor && this.predecessors.indexOf(predecessor) != -1) {
                predecessor = undefined;
            }

        }
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
        if (this.lootedTreasures.indexOf(treasure) == -1) {
            this.dialog.open(TreasuresDialogComponent, {
                panelClass: ['dialog'],
                data: { edition: this.scenario.edition, scenario: this.scenario }
            })
        }
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
        gameManager.scenarioManager.finishScenario(new Scenario(this.scenario), true, conclusionSection, false, undefined, false, gameManager.game.party.campaignMode && this.countFinished() == 0, true);
        gameManager.stateManager.after();
        this.update();
    }

    countFinished(): number {
        return (!gameManager.game.party.campaignMode ? gameManager.game.party.casualScenarios : gameManager.game.party.scenarios).filter((value) => this.scenario.index == value.index && this.scenario.edition == value.edition && this.scenario.group == value.group).length;
    }
}
