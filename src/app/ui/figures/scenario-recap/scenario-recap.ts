import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, Input, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";


@Component({
    standalone: false,
    selector: 'ghs-scenario-recap-dialog',
    templateUrl: 'scenario-recap-dialog.html',
    styleUrls: ['./scenario-recap-dialog.scss']
})
export class ScenarioRecapDialogComponent {

    scenarios: ScenarioData[];
    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public scenario: ScenarioData) {
        this.scenarios = [...gameManager.scenarioManager.getPredecessors(this.scenario), scenario];
    }
}

@Component({
    standalone: false,
    selector: 'ghs-scenario-recap',
    templateUrl: 'scenario-recap.html',
    styleUrls: ['./scenario-recap.scss']
})
export class ScenarioRecapComponent implements OnInit {

    @Input() scenarios: ScenarioData[] = [];

    label: string | false = false;
    scenario: ScenarioData | undefined;
    predecessor: ScenarioData | undefined;
    predecessors: ScenarioData[] = [];
    predessorLabel: string | false = false;

    ngOnInit(): void {
        if (this.scenarios.length) {
            this.scenario = this.scenarios[this.scenarios.length - 1];
            this.predecessors = this.scenarios.slice(0, this.scenarios.length - 1);
            const prefix = 'data.scenario.recap.' + this.scenario.edition + '.';
            this.label = prefix + this.scenario.index;
            if (!settingsManager.labelExists(this.label, true)) {
                this.label = prefix + this.scenario.index.replaceAll(/[A-Z]+/g, '');
            }

            if (this.predecessors.length) {
                this.predecessor = this.predecessors[this.predecessors.length - 1];

                this.predessorLabel = this.label + '.' + this.predecessor.index;
                if (!settingsManager.labelExists(this.predessorLabel)) {
                    this.predessorLabel = this.label + '.' + this.predecessor.index.replaceAll(/[A-Z]+/g, '');
                }

                if (!settingsManager.labelExists(this.predessorLabel)) {
                    this.predessorLabel = false;
                }
            }

            if (!settingsManager.labelExists(this.label)) {
                this.label = false;
            }
        }
    }

}