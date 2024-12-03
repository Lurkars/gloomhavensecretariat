import { DialogRef, DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";

import { Character } from "src/app/game/model/Character";
import { Loot, LootType } from "src/app/game/model/data/Loot";
import { ItemDialogComponent } from "../../items/dialog/item-dialog";
import { ItemData } from "src/app/game/model/data/ItemData";

@Component({
	standalone: false,
    selector: 'ghs-character-loot-cards',
    templateUrl: 'loot-cards.html',
    styleUrls: ['./loot-cards.scss']
})
export class CharacterLootCardsDialog {

    gameManager: GameManager = gameManager;

    lootCards: Loot[] = [];
    sorted: boolean = false;

    constructor(@Inject(DIALOG_DATA) public character: Character, public dialogRef: DialogRef, private dialog: Dialog) {
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

    randomItem(loot: Loot): ItemData | undefined {
        if (loot.type == LootType.random_item) {
            const itemIdentifier = this.character.progress.equippedItems.find((value) => value.marker == "loot-random-item");
            if (itemIdentifier) {
                const itemData = gameManager.itemManager.getItem(itemIdentifier.name, itemIdentifier.edition, true);
                return itemData;
            }
        }
        return undefined;
    }

    randomItemDialog(loot: Loot) {
        const itemData = this.randomItem(loot);
        if (itemData) {
            this.dialog.open(ItemDialogComponent, {
                panelClass: ['fullscreen-panel'],
                disableClose: true,
                data: { item: itemData }
            })
        }
    }

}