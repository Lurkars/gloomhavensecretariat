import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Scenario } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioRequirementsComponent } from "src/app/ui/figures/party/requirements/requirements";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    selector: 'ghs-scneario-chart-popup',
    templateUrl: 'scenario-chart-popup.html',
    styleUrls: ['./scenario-chart-popup.scss']
})
export class ScenarioChartPopupDialog {

    gameManager: GameManager = gameManager;
    scenario: Scenario;
    showSetup: boolean;
    showTreasures: boolean;
    predecessors: ScenarioData[] = [];
    treasures: string[] = [];
    lootedTreasures: number[] = [];

    constructor(@Inject(DIALOG_DATA) public scenarioData: ScenarioData, private dialogRef: DialogRef, private dialog: Dialog) {
        this.scenario = new Scenario(scenarioData);
        this.showSetup = gameManager.scenarioManager.isSuccess(scenarioData);

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

        let predecessor = gameManager.scenarioManager.scenarioData(scenarioData.edition).find((other) => other.group == scenarioData.group && other.unlocks && other.unlocks.indexOf(scenarioData.index) != -1 && (!gameManager.game.party.campaignMode || gameManager.scenarioManager.isSuccess(other)));

        if (!predecessor) {
            predecessor = gameManager.sectionData(scenarioData.edition).find((sectionData) => sectionData.conclusion && sectionData.group == scenarioData.group && sectionData.parent && sectionData.unlocks && sectionData.unlocks.indexOf(scenarioData.index) != -1 && gameManager.game.party.conclusions.find((conclusion) => conclusion.edition == sectionData.edition && conclusion.group == sectionData.group && conclusion.index == sectionData.index));
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
                this.dialog.open(ScenarioRequirementsComponent, {
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
}
