import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { AttackModifierType } from "src/app/game/model/data/AttackModifier";
import { Character } from "src/app/game/model/Character";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-additional-am-select-dialog',
    templateUrl: './additional-am-select.html',
    styleUrls: ['./additional-am-select.scss']
})
export class AdditionalAMSelectDialogComponent {

    gameManager: GameManager = gameManager;
    selected: number = 0;
    characters: Character[];
    type: AttackModifierType;

    constructor(@Inject(DIALOG_DATA) public data: { characters: Character[], type: AttackModifierType }, public dialogRef: DialogRef) {
        this.characters = data.characters;
        this.type = data.type;
    }

    toggleSelect(index: number) {
        if (this.selected == index) {
            this.selected = -1;
        } else {
            this.selected = index;
        }
    }

    close(result: number | undefined = undefined) {
        ghsDialogClosingHelper(this.dialogRef, result);
    }
}