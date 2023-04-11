import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, HostListener, Inject } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Objective } from "src/app/game/model/Objective";

@Component({
    selector: 'ghs-character-initiative-dialog',
    templateUrl: 'initiative-dialog.html',
    styleUrls: ['./initiative-dialog.scss']
})
export class CharacterInitiativeDialogComponent {

    value: string = "__";

    characterManager: CharacterManager = gameManager.characterManager;
    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    GameState = GameState;
    character: Character | undefined;
    objective: Objective | undefined;


    constructor(@Inject(DIALOG_DATA) public figure: Character | Objective, private dialogRef: DialogRef) {
        if (this.figure instanceof Character) {
            this.character = this.figure;
        } else if (this.figure instanceof Objective) {
            this.objective = this.figure;
        }
        dialogRef.closed.subscribe({
            next: () => {
                if (this.value.indexOf("_") != -1 && !isNaN(+this.value.replace('_', ''))) {
                    this.updateInitiative(+this.value.replace('_', ''));
                }
            }
        })
    }

    @HostListener('document:keydown', ['$event'])
    onKeyPress(event: KeyboardEvent) {
        if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
            this.pickNumber(+event.key);
        }
    }

    pickNumber(number: number) {
        this.value = (this.value + "" + number).substring(1, 3);
        if (this.value.indexOf("_") == -1) {
            this.updateInitiative(+this.value);
            this.dialogRef.close();
        }
    }

    updateInitiative(initiative: number) {
        if (this.figure.initiative != initiative) {
            gameManager.stateManager.before("setInitiative", (this.character ? "data.character." : "data.objective.") + this.figure.name, "" + (initiative > 0 && initiative < 100 ? initiative : 0));
            if (initiative > 0 && initiative < 100) {
                this.setInitiative(initiative);
            } else if (gameManager.game.state == GameState.draw) {
                this.figure.initiative = 0;
            }
            if (gameManager.game.state == GameState.next) {
                gameManager.sortFigures();
            }
            gameManager.stateManager.after();
        }
    }

    setInitiative(initiative: number) {
        if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100 && initiative != this.figure.initiative) {
            this.figure.initiative = initiative;
            if (this.character) {
                if (initiative == 99 && !this.character.longRest) {
                    this.character.longRest = true;
                } else {
                    this.character.longRest = false;
                }
            }
            if (this.character) {
                this.character.initiativeVisible = true;
            }
        }
    }

    longRest() {
        if (this.character) {
            if (this.character.longRest && this.character.initiative == 99) {
                gameManager.stateManager.before("setInitiative", "data.character." + this.figure.name, "" + 99);
                this.character.longRest = false;
                gameManager.stateManager.after();
            } else {
                gameManager.stateManager.before("characterLongRest", "data.character." + this.character.name);
                if (this.character.initiative == 99) {
                    this.character.longRest = true;
                } else {
                    this.setInitiative(99);
                    if (gameManager.game.state == GameState.next) {
                        gameManager.sortFigures();
                    }
                }
                gameManager.stateManager.after();
            }
            this.dialogRef.close();
        }
    }

}