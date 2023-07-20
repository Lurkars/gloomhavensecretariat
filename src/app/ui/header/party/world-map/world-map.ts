import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { AfterViewInit, Component, Inject, ViewEncapsulation } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Scenario } from "src/app/game/model/Scenario";
import L, { LatLngBoundsLiteral } from 'leaflet';

@Component({
    selector: 'ghs-world-map',
    templateUrl: './world-map.html',
    styleUrls: ['./world-map.scss',],
    encapsulation: ViewEncapsulation.None
})
export class WorldMapComponent implements AfterViewInit {

    gameManager: GameManager = gameManager;

    worldMap: { width: number, height: number } | undefined;
    scenarios: ScenarioData[] = [];
    columns: number[] = [];
    rows: number[] = [];
    offsetX: number[] = [];
    offsetY: number[] = [];
    success: boolean[] = [];

    scale: number = 1;
    zooming: boolean = false;

    constructor(@Inject(DIALOG_DATA) public edition: string, public dialogRef: DialogRef) {
        const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
        if (editionData) {
            this.worldMap = editionData.worldMap;
            if (this.worldMap) {
                this.scenarios = gameManager.scenarioManager.scenarioData(this.edition).filter((scenarioData) => scenarioData.coordinates);
            }
        }
    }

    ngAfterViewInit(): void {
        if (this.worldMap) {
            const width = this.worldMap.width;
            const height = this.worldMap.height;
            var map = L.map('map', {
                crs: L.CRS.Simple,
                maxBounds: [[height * -0.5, width * -0.5], [height * 1.5, width * 1.5]],
                minZoom: -2,
                attributionControl: false
            });
            var bounds: LatLngBoundsLiteral = [[0, 0], [height, width]];
            L.imageOverlay('./assets/images/world-map/' + this.edition + '/map.jpg', bounds).addTo(map);
            map.fitBounds(bounds);
            map.zoomIn();

            this.scenarios.forEach((scenarioData, index) => {

                if (gameManager.game.party.scenarios.find((model) => model.edition == scenarioData.edition && model.index == scenarioData.index && model.group == scenarioData.group)) {
                    this.success[index] = true;
                }

                if (scenarioData.coordinates) {
                    let overlay = L.imageOverlay('./assets/images/world-map/' + this.edition + '/scenarios/' + scenarioData.edition + '-' + scenarioData.index + '.png', [[height - scenarioData.coordinates.y, scenarioData.coordinates.x], [height - scenarioData.coordinates.y - scenarioData.coordinates.height, scenarioData.coordinates.x + scenarioData.coordinates.width]], { interactive: true }).addTo(map);

                    overlay.getElement()?.classList.add('scenario');
                    if (gameManager.game.party.scenarios.find((model) => model.edition == scenarioData.edition && model.index == scenarioData.index && model.group == scenarioData.group)) {
                        overlay.getElement()?.classList.add('success');
                    }

                    if (gameManager.scenarioManager.isBlocked(scenarioData)) {
                        overlay.getElement()?.classList.add('blocked');
                    } else if (gameManager.scenarioManager.isLocked(scenarioData)) {
                        overlay.getElement()?.classList.add('locked');
                    }

                    overlay.setZIndex(index + 1);

                    overlay.on('click', () => {
                        const scenarioData = this.scenarios[index];
                        if (!this.success[index] && gameManager.game.party.campaignMode && !gameManager.scenarioManager.isBlocked(scenarioData)) {
                            const scenario = new Scenario(scenarioData);
                            gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(scenario));
                            gameManager.scenarioManager.setScenario(scenario);
                            this.dialogRef.close();
                            gameManager.stateManager.after();
                        }
                    });
                    overlay.on('mouseover', (event) => { event.target.setZIndex(this.scenarios.length + 1); });
                    overlay.on('mouseout', (event) => { event.target.setZIndex(index + 1) });
                }
            })
        }
    }

    close() {
        this.dialogRef.close();
    }
}

