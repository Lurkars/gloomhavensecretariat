import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";
import { ItemData, ItemFlags, ItemSlot } from "src/app/game/model/data/ItemData";
import { ItemsDialogComponent } from "../dialog/items-dialog";

@Component({
    selector: 'ghs-items-character-dialog',
    templateUrl: './items-character-dialog.html',
    styleUrls: ['./items-character-dialog.scss']
})
export class ItemsCharacterDialogComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    setup: boolean = false;
    items: ItemData[];
    ItemFlags = ItemFlags;
    GameState = GameState;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.setup = gameManager.game.state == GameState.draw && gameManager.game.round == 0;
        this.items = this.character.progress.items.map((identifier) => gameManager.itemManager.getItem(+identifier.name, identifier.edition, true)).filter((itemData) => itemData).map((itemData) => itemData as ItemData).sort((a, b) => {
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
        });
    }

    equipped(itemData: ItemData): AdditionalIdentifier | undefined {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
    }

    toggleEquippedItem(itemData: ItemData, force: boolean = false) {
        if ((this.setup || force) && this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition) != undefined) {
            gameManager.stateManager.before(gameManager.itemManager.isEquipped(itemData, this.character) ? 'unequipItem' : 'equipItem', "data.character." + this.character.name, '' + itemData.id, itemData.edition)
            gameManager.itemManager.toggleEquippedItem(itemData, this.character, force)
            gameManager.stateManager.after();
        }
    }

    countFlag(itemData: ItemData, flag: string): number {
        const equipped = this.equipped(itemData);
        if (equipped) {
            return equipped.tags && equipped.tags.filter((tag) => tag == flag).length || 0;
        }
        return 0;
    }

    toggleFlag(force: boolean, itemData: ItemData, flag: string) {
        if (!this.setup && gameManager.game.state == GameState.next || force) {
            const equipped = this.equipped(itemData);
            if (equipped) {
                equipped.tags = equipped.tags || [];
                gameManager.stateManager.before(equipped.tags.indexOf(flag) == -1 ? 'characterItemApply.' + flag : 'characterItemUnapply.' + flag, "data.character." + this.character.name, '' + itemData.id, itemData.edition)
                if (equipped.tags.indexOf(flag) == -1) {
                    equipped.tags.push(flag);
                } else {
                    equipped.tags = equipped.tags.filter((tag) => tag != flag);
                    if (flag == ItemFlags.spent) {
                        equipped.tags = equipped.tags.filter((tag) => tag != ItemFlags.slot && tag != ItemFlags.slotBack);
                    }
                }
                gameManager.stateManager.after();
            }
        }
    }

    toggleFlagCount(index: number, itemData: ItemData, flag: string) {
        if (!this.setup && gameManager.game.state == GameState.next) {
            const equipped = this.equipped(itemData);
            if (equipped) {
                equipped.tags = equipped.tags || [];
                const count = this.countFlag(itemData, flag);
                gameManager.stateManager.before(count <= index ? 'characterItemApply.' + flag : 'characterItemUnapply.' + flag, "data.character." + this.character.name, '' + itemData.id, itemData.edition);
                if (count <= index) {
                    for (let i = count; i <= index; i++) {
                        equipped.tags.push(flag);
                    }
                    if (flag == ItemFlags.slot && this.countFlag(itemData, flag) == itemData.slots) {
                        if (itemData.spent && !this.countFlag(itemData, ItemFlags.spent)) {
                            this.toggleFlag(true, itemData, ItemFlags.spent);
                        } else if (itemData.consumed && !this.countFlag(itemData, ItemFlags.consumed)) {
                            this.toggleFlag(true, itemData, ItemFlags.consumed);
                        }
                    }
                } else {
                    for (let i = index; i < count; i++) {
                        equipped.tags.splice(equipped.tags.indexOf(flag), 1);
                    }
                }
                gameManager.stateManager.after();
            }
        }
    }

    slotsMarked(itemData: ItemData, flag: string): string[] {
        let marked: string[] = [];
        for (let i = 0; i < this.countFlag(itemData, flag); i++) {
            marked.push(this.character.name);
        }
        return marked
    }

    openShop() {
        this.dialog.open(ItemsDialogComponent, {
            panelClass: ['dialog'],
            data: { edition: gameManager.game.edition, select: this.character, affordable: true }
        })
        this.close();
    }

    close() {
        this.dialogRef.close();
    }
}