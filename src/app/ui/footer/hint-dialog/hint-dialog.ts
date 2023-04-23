import { DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";

@Component({
    selector: 'ghs-hint-dialog',
    templateUrl: './hint-dialog.html',
    styleUrls: ['./hint-dialog.scss']
})
export class HintDialogComponent {

    gameManager: GameManager = gameManager;
    GameState = GameState;

    constructor(private dialogRef: DialogRef) { }

    confirm() {
        const active = gameManager.game.figures.find((figure) => figure.active);
        if (active) {
            gameManager.stateManager.before("endAllTurns");
            gameManager.game.figures.forEach((figure) => gameManager.roundManager.afterTurn(figure));
            gameManager.stateManager.after();
        }
        this.next();
    }

    next() {
        this.dialogRef.close(true);
    }

    finishScenario(success: boolean) {
        gameManager.stateManager.before("finishScenario." + (success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.gameManager.game.scenario, success, undefined);
        gameManager.stateManager.after(1000);
    }

    resetScenario() {
        gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.roundManager.resetScenario();
        gameManager.stateManager.after(1000);
    }

    empty(): boolean {
        return gameManager.game.figures.length == 0;
    }

    missingInitiative(): boolean {
        return gameManager.game.figures.some((figure) => figure instanceof Character && settingsManager.settings.initiativeRequired && figure.initiative < 1 && gameManager.entityManager.isAlive(figure) && !figure.absent);
    }

    active(): boolean {
        return gameManager.game.figures.find((figure) => figure.active && !figure.off) != undefined;
    };

    finish(): boolean {
        return false;
    }

    failed(): boolean {
        return !this.active() && !this.empty() && gameManager.game.figures.some((figure) => figure instanceof Character) && gameManager.game.figures.every((figure) => !(figure instanceof Character) || figure instanceof Character && (!gameManager.entityManager.isAlive(figure) || figure.absent));
    }

}
