import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";

@Component({
    selector: 'ghs-rules-dialog',
    templateUrl: './rules-dialog.html',
    styleUrls: ['./rules-dialog.scss']
})
export class RulesDialogComponent {

    constructor(@Inject(DIALOG_DATA) public rules: string[]) { }

}
