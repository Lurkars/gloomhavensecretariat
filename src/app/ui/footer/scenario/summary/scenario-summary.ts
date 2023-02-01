import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";


@Component({
    selector: 'ghs-scenario-summary',
    templateUrl: './scenario-summary.html',
    styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent {

    gameManager: GameManager = gameManager;

    characters: Character[];

    constructor(@Inject(DIALOG_DATA) public success: boolean, private dialogRef: DialogRef) {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => {
            let char = new Character((figure as Character), figure.level);
            char.fromModel((figure as Character).toModel());
            return char;
        })

        dialogRef.closed.subscribe({
            next: () => {
                gameManager.stateManager.before("finishScenario." + (success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
                gameManager.scenarioManager.finishScenario(success);
                gameManager.stateManager.after(1000);
            }
        })

    }

    close() {
        this.dialogRef.close();
    }
}
