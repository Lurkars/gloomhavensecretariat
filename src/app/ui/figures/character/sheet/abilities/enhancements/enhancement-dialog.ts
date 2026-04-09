import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { Character } from "src/app/game/model/Character";
import { Action } from "src/app/game/model/data/Action";
import { SummonData } from "src/app/game/model/data/SummonData";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    standalone: false,
    selector: 'ghs-enhancement-dialog',
    templateUrl: 'enhancement-dialog.html',
    styleUrls: ['./enhancement-dialog.scss']
})
export class EnhancementDialogComponent {

    constructor(@Inject(DIALOG_DATA) public data: { action: Action | undefined, actionIndex: string | undefined, enhancementIndex: number | undefined, cardId: number | undefined, character: Character | undefined, summon: SummonData | undefined }, private dialogRef: DialogRef) {
        this.data = data || {};
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

}