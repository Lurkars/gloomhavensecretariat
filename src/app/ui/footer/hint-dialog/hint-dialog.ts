import { Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { ScenarioSummaryComponent } from "../scenario/summary/scenario-summary";
import { ScenarioConclusionComponent } from "../scenario/scenario-conclusion/scenario-conclusion";

@Component({
    selector: 'ghs-hint-dialog',
    templateUrl: './hint-dialog.html',
    styleUrls: ['./hint-dialog.scss']
})
export class HintDialogComponent {

    gameManager: GameManager = gameManager;
    GameState = GameState;

    constructor(private dialogRef: DialogRef, private dialog: Dialog) { }

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
        if (gameManager.game.scenario) {
            const conclusions = gameManager.sectionData(gameManager.game.scenario.edition).filter((sectionData) => {
                if (gameManager.game.scenario) {
                    return sectionData.edition == gameManager.game.scenario.edition && sectionData.parent == gameManager.game.scenario.index && sectionData.group == gameManager.game.scenario.group && sectionData.conclusion;
                }
                return false;
            });

            if (conclusions.length == 0 || !success) {
                this.dialog.open(ScenarioSummaryComponent, {
                    panelClass: 'dialog',
                    data: {
                        scenario: gameManager.game.scenario,
                        success: success
                    }
                })
            } else {
                this.dialog.open(ScenarioConclusionComponent, {
                    panelClass: ['dialog'],
                    data: { conclusions: conclusions, parent: gameManager.game.scenario }
                }).closed.subscribe({
                    next: (conclusion) => {
                        if (conclusion) {
                            this.dialog.open(ScenarioSummaryComponent, {
                                panelClass: 'dialog',
                                data: {
                                    scenario: gameManager.game.scenario,
                                    conclusion: conclusion,
                                    success: success
                                }
                            })
                        }
                    }
                });
            }
        }
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
    }

    battleGoals(): boolean {
        return !this.missingInitiative() && settingsManager.settings.battleGoals && settingsManager.settings.battleGoalsReminder && gameManager.game.scenario != undefined && gameManager.roundManager.firstRound && !gameManager.game.figures.every((figure) => !(figure instanceof Character) || figure.battleGoal || figure.absent);
    }

    finish(): boolean {
        return false;
    }

    failed(): boolean {
        return !this.active() && !this.empty() && gameManager.game.figures.some((figure) => figure instanceof Character) && gameManager.game.figures.every((figure) => !(figure instanceof Character) || figure instanceof Character && (!gameManager.entityManager.isAlive(figure) || figure.absent));
    }

}
