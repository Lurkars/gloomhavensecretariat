import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Loot } from "src/app/game/model/Loot";

@Component({
    selector: 'ghs-loot-apply-dialog',
    templateUrl: './loot-apply-dialog.html',
    styleUrls: ['./loot-apply-dialog.scss',]
})
export class LootApplyDialogComponent {

    gameManager: GameManager = gameManager;
    characters: Character[] = [];
    selected: string = "";

    constructor(@Inject(DIALOG_DATA) public loot: Loot, private dialogRef: DialogRef) {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && !figure.exhausted && figure.health > 0).map((figure) => figure as Character);
    }

    toggleSelect(name: string) {
        if (this.selected == name) {
            this.selected = "";
        } else {
            this.selected = name;
        }
    }

    close() {
        this.dialogRef.close(this.selected);
    }

}