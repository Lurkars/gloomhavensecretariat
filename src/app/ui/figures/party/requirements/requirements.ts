import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Scenario, ScenarioMissingRequirements } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    standalone: false,
    selector: 'ghs-requirements',
    templateUrl: 'requirements.html',
    styleUrls: ['./requirements.scss']
})
export class ScenarioRequirementsComponent implements OnInit, OnChanges {

    @Input() scenarioData!: ScenarioData;
    @Input() highlight: boolean = false;
    @Input() all: boolean = false;
    @Input() allToggle: boolean = true;
    gameManager: GameManager = gameManager;

    solo: string = "";
    requirements: ScenarioMissingRequirements[] = [];
    missingRequirements: ScenarioMissingRequirements[] = [];
    hideAll: boolean = false;

    ngOnInit(): void {
        this.update();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['all']) {
            this.update();
        }
    }

    update() {
        this.requirements = gameManager.scenarioManager.getRequirements(this.scenarioData, this.all);
        this.missingRequirements = gameManager.scenarioManager.getRequirements(this.scenarioData);
        this.solo = "";
        this.hideAll = !this.all && JSON.stringify(gameManager.scenarioManager.getRequirements(this.scenarioData, true)) == JSON.stringify(this.requirements);
        if (this.scenarioData.solo && (this.all || !gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.scenarioData.solo && figure.level >= 5))) {
            this.solo = this.scenarioData.solo;
        }
    }
}

@Component({
    standalone: false,
    selector: 'ghs-requirements-dialog',
    templateUrl: 'requirements-dialog.html',
    styleUrls: ['./requirements-dialog.scss']
})
export class ScenarioRequirementsDialogComponent {

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public data: { scenarioData: ScenarioData, hideMenu: boolean }, private dialogRef: DialogRef) {
    }

    startScenario() {
        gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.data.scenarioData)));
        gameManager.scenarioManager.setScenario(new Scenario(this.data.scenarioData));
        gameManager.stateManager.after();
        ghsDialogClosingHelper(this.dialogRef, true);
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}