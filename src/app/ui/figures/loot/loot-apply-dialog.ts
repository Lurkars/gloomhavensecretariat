import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Loot } from "src/app/game/model/data/Loot";
import { ghsDialogClosingHelper } from "../../helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-loot-apply-dialog',
    templateUrl: './loot-apply-dialog.html',
    styleUrls: ['./loot-apply-dialog.scss',]
})
export class LootApplyDialogComponent {

    gameManager: GameManager = gameManager;
    characters: Character[] = [];
    selected: string;
    loot: Loot;
    edit: boolean = false;

    constructor(@Inject(DIALOG_DATA) public data: { loot: Loot, selected: string | undefined, edit: boolean }, public dialogRef: DialogRef) {
        this.loot = data.loot;
        this.selected = data.selected || "";
        this.edit = data.edit || false;
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && gameManager.entityManager.isAlive(figure)).map((figure) => figure as Character);
    }

    toggleSelect(name: string) {
        if (this.selected == name) {
            this.selected = "";
        } else {
            this.selected = name;
        }
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef, this.selected);
    }

}