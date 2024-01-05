import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Ability } from "src/app/game/model/data/Ability";

@Component({
    selector: 'ghs-ability-cards-dialog',
    templateUrl: 'ability-cards-dialog.html',
    styleUrls: ['./ability-cards-dialog.scss']
})
export class AbilityCardsDialogComponent {

    character: Character;
    level: number;
    abilities: Ability[] = [];

    constructor(@Inject(DIALOG_DATA) public data: { character: Character, }) {
        this.character = data.character;
        this.level = this.character.level;
        this.update();
    }

    update() {
        this.abilities = gameManager.deckData(this.character).abilities.filter((ability) => typeof ability.level == 'string' || ability.level <= +this.level);
    }

    setLevel(level: number) {
        this.level = level;
        this.update();
    }
}