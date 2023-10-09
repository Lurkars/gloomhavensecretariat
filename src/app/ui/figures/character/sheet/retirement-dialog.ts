import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";

@Component({
    selector: 'ghs-character-retirement-dialog',
    templateUrl: 'retirement-dialog.html',
    styleUrls: ['./retirement-dialog.scss']
})
export class CharacterRetirementDialog {

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef) { }

    apply() {
        this.dialogRef.close(true);
    }

    close() {
        this.dialogRef.close();
    }

}