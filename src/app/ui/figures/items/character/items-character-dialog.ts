import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";
import { ItemData, ItemFlags, ItemSlot } from "src/app/game/model/data/ItemData";
import { ItemsDialogComponent } from "../dialog/items-dialog";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-items-character-dialog',
    templateUrl: './items-character-dialog.html',
    styleUrls: ['./items-character-dialog.scss']
})
export class ItemsCharacterDialogComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    setup: boolean = false;
    onlyEquipped: boolean = false;
    items: ItemData[] = [];
    ItemFlags = ItemFlags;
    GameState = GameState;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.setup = gameManager.game.state == GameState.draw && gameManager.roundManager.firstRound;
        this.onlyEquipped = !this.setup;
        this.update();
    }

    sortItemData(a: ItemData, b: ItemData) {
        if (!this.setup) {
            if (this.equipped(a) && !this.equipped(b)) {
                return -1;
            } else if (this.equipped(b) && !this.equipped(a)) {
                return 1;
            }
        }

        if (a.slot && !b.slot) {
            return -1;
        } else if (b.slot && !a.slot) {
            return 1;
        }

        if (a.slot && b.slot) {
            return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
        }

        return 0;
    }

    update() {
        this.items = gameManager.bbRules() ? gameManager.itemManager.getItems('bb') : this.character.progress.items.map((identifier) => gameManager.itemManager.getItem(identifier.name, identifier.edition, true)).filter((itemData) => itemData).map((itemData) => itemData as ItemData).sort((a, b) => this.sortItemData(a, b));

        if (this.onlyEquipped) {
            this.items = this.items.filter((itemData) => this.equipped(itemData));
        }
    }

    equipped(itemData: ItemData): AdditionalIdentifier | undefined {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
    }

    countFlag(itemData: ItemData, flag: string): number {
        const equipped = this.equipped(itemData);
        if (equipped) {
            return equipped.tags && equipped.tags.filter((tag) => tag == flag).length || 0;
        }
        return 0;
    }

    openShop() {
        this.dialogRef.close();
        this.dialog.open(ItemsDialogComponent, {
            panelClass: ['dialog'],
            data: { edition: gameManager.game.edition, select: this.character, affordable: true }
        })
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}