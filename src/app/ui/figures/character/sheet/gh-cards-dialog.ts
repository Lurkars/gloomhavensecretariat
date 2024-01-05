import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { Character } from "src/app/game/model/Character";

@Component({
    selector: 'ghs-gh-cards-dialog',
    templateUrl: 'gh-cards-dialog.html',
    styleUrls: ['./gh-cards-dialog.scss']
})
export class GhCardsDialogComponent {

    character: Character;

    constructor(@Inject(DIALOG_DATA) public data: { character: Character, }) {
        this.character = data.character;
    }
}