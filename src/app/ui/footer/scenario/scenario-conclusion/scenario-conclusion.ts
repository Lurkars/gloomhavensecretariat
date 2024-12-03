import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-scenario-conclusion-dialog',
    templateUrl: './scenario-conclusion.html',
    styleUrls: ['./scenario-conclusion.scss']
})
export class ScenarioConclusionComponent {

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public data: { conclusions: ScenarioData[], parent: ScenarioData }, public dialogRef: DialogRef) {
        if (this.data.conclusions.length == 1) {
            this.close(this.data.conclusions[0]);
        }

    }

    close(result: ScenarioData | undefined = undefined) {
        ghsDialogClosingHelper(this.dialogRef, result);
    }

}