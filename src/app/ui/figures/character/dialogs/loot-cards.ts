import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";

import { Character } from "src/app/game/model/Character";
import { Loot } from "src/app/game/model/data/Loot";

@Component({
    selector: 'ghs-character-loot-cards',
    templateUrl: 'loot-cards.html',
    styleUrls: ['./loot-cards.scss']
})
export class CharacterLootCardsDialog {

    gameManager: GameManager = gameManager;

    lootCards: Loot[] = [];
    sorted: boolean = false;

    constructor(@Inject(DIALOG_DATA) public character: Character, public dialogRef: DialogRef) {
        if (this.character.lootCards) {
            this.character.lootCards.forEach((index) => this.lootCards.push(gameManager.game.lootDeck.cards[index]));
        }
    }

    sort() {
        if (this.sorted) {
            this.sorted = false;
            this.lootCards = [];
            if (this.character.lootCards) {
                this.character.lootCards.forEach((index) => this.lootCards.push(gameManager.game.lootDeck.cards[index]));
            }
        } else {
            this.sorted = true;
            this.lootCards.sort((a, b) => a.cardId - b.cardId);
        }
    }

}