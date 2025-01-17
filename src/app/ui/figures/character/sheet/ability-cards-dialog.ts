import { DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Ability } from "src/app/game/model/data/Ability";
import { AbilityDialogComponent } from "../../ability/ability-dialog";

@Component({
    standalone: false,
    selector: 'ghs-ability-cards-dialog',
    templateUrl: 'ability-cards-dialog.html',
    styleUrls: ['./ability-cards-dialog.scss']
})
export class AbilityCardsDialogComponent {

    character: Character;
    level: number;
    exclusiveLevel: number | undefined;
    abilities: Ability[] = [];

    constructor(@Inject(DIALOG_DATA) public data: { character: Character }, private dialog: Dialog) {
        this.character = data.character;
        this.level = this.character.level;
        this.update();
    }

    update() {
        this.abilities = gameManager.deckData(this.character).abilities.filter((ability) => !this.exclusiveLevel && (typeof ability.level == 'string' || +ability.level <= this.level) || this.exclusiveLevel && ability.level == this.exclusiveLevel || this.exclusiveLevel == 1 && ability.level == 'X');
    }

    setLevel(level: number, exclusive: boolean = false) {
        this.level = level;
        this.exclusiveLevel = exclusive ? level : undefined;
        this.update();
    }

    openDialog(ability: Ability) {
        this.dialog.open(AbilityDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { ability: ability, character: this.character }
        });
    }
}