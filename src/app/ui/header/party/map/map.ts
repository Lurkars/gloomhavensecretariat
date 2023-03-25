import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";

@Component({
    selector: 'ghs-map',
    templateUrl: './map.html',
    styleUrls: ['./map.scss',]
})
export class MapComponent {

    scenarios: ScenarioData[] = [];
    columns: number[] = [];
    rows: number[] = [];
    offsetX: number[] = [];
    offsetY: number[] = [];

    constructor(@Inject(DIALOG_DATA) public edition: string = 'gh', public dialogRef: DialogRef) {
        this.scenarios = gameManager.scenarioData(this.edition);

        this.scenarios.forEach((scenarioData, index) => {
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
                }
                if (grid.length > 3) {
                    this.offsetY[index] = +grid[3];
                } else {
                    this.offsetY[index] = 0;
                }
            }
        })
    }
}

