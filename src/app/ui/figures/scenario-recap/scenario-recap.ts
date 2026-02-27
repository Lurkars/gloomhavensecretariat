import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, Input, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData, ScenarioRecap } from "src/app/game/model/data/ScenarioData";


@Component({
    standalone: false,
    selector: 'ghs-scenario-recap-dialog',
    templateUrl: 'scenario-recap-dialog.html',
    styleUrls: ['./scenario-recap-dialog.scss']
})
export class ScenarioRecapDialogComponent {

    scenario: ScenarioData;
    forceAll: boolean;
    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) private data: { scenario: ScenarioData, forceAll: boolean }) {
        this.scenario = this.data.scenario;
        this.forceAll = this.data.forceAll || false;
    }
}

@Component({
    standalone: false,
    selector: 'ghs-scenario-recap',
    templateUrl: 'scenario-recap.html',
    styleUrls: ['./scenario-recap.scss']
})
export class ScenarioRecapComponent implements OnInit {

    @Input() scenario: ScenarioData | undefined;
    @Input() forceAll: boolean = false;

    label: string | false = false;
    recaps: ScenarioRecap[] = [];
    scenarios: (ScenarioData | undefined)[] = [];
    selected: number = -1;

    ngOnInit(): void {
        if (this.scenario) {
            const prefix = 'data.scenario.recap.' + this.scenario.edition + '.';

            this.recaps = this.scenario.recaps.filter((recap) => {
                if (this.scenario) {
                    if (recap.type == 'scenario' && recap.value) {
                        const scenarioData = gameManager.scenarioManager.getScenario(recap.value, this.scenario.edition, this.scenario.group) || undefined;
                        if (scenarioData && (gameManager.scenarioManager.isSuccess(scenarioData) || this.forceAll)) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
                return false;
            });

            this.recaps.forEach((recap, i) => {
                if (this.scenario) {
                    if (recap.type == 'scenario' && recap.value) {
                        this.label = settingsManager.labelExists(prefix + this.scenario.index + '.' + recap.value.replaceAll(/[A-Z]+/g, '')) ? prefix + this.scenario.index + '.' + recap.value.replaceAll(/[A-Z]+/g, '') : false;
                        this.scenarios[i] = gameManager.scenarioManager.getScenario(recap.value, this.scenario.edition, this.scenario.group);
                    } else {
                        this.label = settingsManager.labelExists(prefix + this.scenario.index) ? prefix + this.scenario.index : false;
                    }
                }
            });

            if (this.recaps.length == 1) {
                this.selected = 0;
            }
        }
    }

}