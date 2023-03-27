import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Scenario } from "src/app/game/model/Scenario";

@Component({
    selector: 'ghs-map',
    templateUrl: './map.html',
    styleUrls: ['./map.scss',]
})
export class MapComponent {

    gameManager: GameManager = gameManager;

    scenarios: ScenarioData[] = [];
    columns: number[] = [];
    rows: number[] = [];
    offsetX: number[] = [];
    offsetY: number[] = [];
    success: boolean[] = [];

    constructor(@Inject(DIALOG_DATA) public edition: string = 'gh', public dialogRef: DialogRef) {
        this.scenarios = gameManager.scenarioManager.scenarioData(this.edition);

        this.scenarios.forEach((scenarioData, index) => {

            if (gameManager.game.party.scenarios.find((model) => model.edition == scenarioData.edition && model.index == scenarioData.index && model.group == scenarioData.group)) {
                this.success[index] = true;
            }

            if (scenarioData.gridLocation) {
                const grid = scenarioData.gridLocation.split(':');
                if (grid.length < 2) {
                    console.warn('invalid grid location', scenarioData);
                } else {
                    this.rows[index] = grid[0].charCodeAt(0) - 63;
                    this.columns[index] = +grid[1] + 1;
                    if (grid.length > 2) {
                        this.offsetX[index] = +grid[2];
                    } else {
                        this.offsetX[index] = 0;
                        console.warn("No adjustment", scenarioData.index);
                    }
                    if (grid.length > 3) {
                        this.offsetY[index] = +grid[3];
                    } else {
                        this.offsetY[index] = 0;
                    }
                }
            }
        })
    }

    startScenario(index: number) {
        if (!this.success[index] && gameManager.game.party.campaignMode) {
            const scenario = new Scenario(this.scenarios[index]);
            gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(scenario));
            gameManager.scenarioManager.setScenario(scenario);
            this.dialogRef.close();
            gameManager.stateManager.after();
        }
    }
}

