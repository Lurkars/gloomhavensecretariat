import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Identifier } from "src/app/game/model/data/Identifier";
import { ItemData, ItemSlot } from "src/app/game/model/data/ItemData";
import { ghsTextSearch } from "src/app/ui/helper/Static";

@Component({
    selector: 'ghs-items-dialog',
    templateUrl: './items-dialog.html',
    styleUrls: ['./items-dialog.scss']
})
export class ItemsDialogComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    edition: string | undefined;
    currentEdition: string;
    editions: string[];
    editionItems: ItemData[] = [];
    items: ItemData[] = [];
    selected: ItemData | undefined;
    character: Character | undefined;
    filter: string = "";
    all: boolean = false;
    affordable: boolean = false;
    sorted: boolean = false;
    unlocks: ItemData[] = [];
    campaignMode: boolean = false;

    constructor(@Inject(DIALOG_DATA) public data: { edition: string | undefined, select: Character | undefined, affordable: boolean }, private dialogRef: DialogRef) {
        this.selected = undefined;
        this.character = data.select;
        this.sorted = this.character != undefined && this.character.progress.items.length > 0;
        this.edition = data.edition;
        this.affordable = data.affordable || false;
        this.campaignMode = this.edition && gameManager.game.party.campaignMode || false;
        this.editions = this.edition ? gameManager.itemManager.itemEditions(this.edition) : gameManager.itemManager.itemEditions();
        this.all = this.edition == undefined;
        this.currentEdition = this.edition || this.editions[0];
    }

    ngOnInit() {
        this.updateEditionItems();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    setEdition(edition: string) {
        this.currentEdition = edition;
        this.updateEditionItems();
    }

    updateEditionItems() {
        if (!this.all) {
            this.editions = this.edition && !this.campaignMode ? gameManager.itemManager.itemEditions(this.edition) : [];
        } else {
            this.editions = gameManager.itemManager.itemEditions();
        }

        if (this.editions.indexOf(this.currentEdition) == -1) {
            this.currentEdition = this.edition || this.editions[0];
        }

        this.editionItems = this.edition && this.campaignMode && !this.all ? gameManager.itemManager.getItems(this.edition) : gameManager.itemManager.getItems(this.currentEdition, this.all).filter((itemData) => itemData.edition == this.currentEdition);
        if (this.all) {
            this.sorted = false;
        }
        this.update();
    }

    update(onlyAffordable: boolean = false) {
        this.unlocks = [];
        this.selected = undefined;
        this.items = this.editionItems.filter((itemData) => (!this.filter || ghsTextSearch(itemData.name, this.filter) || ghsTextSearch('' + (itemData.id < 100 ? '0' : '') + (itemData.id < 10 ? '0' : '') + itemData.id, this.filter) && (!this.affordable || gameManager.itemManager.assigned(itemData) < itemData.count))).filter((itemData) => !this.affordable || this.character && gameManager.itemManager.canAdd(itemData, this.character) && (gameManager.itemManager.canBuy(itemData, this.character) || gameManager.itemManager.canCraft(itemData, this.character)));

        if (this.character && this.edition && this.campaignMode && !this.all && !this.affordable) {
            this.character.progress.items.forEach((identifier) => {
                if (identifier.edition == this.edition && !this.items.find((itemData) => itemData.id == +identifier.name && itemData.edition == identifier.edition)) {
                    const item = gameManager.itemManager.getItem(+identifier.name, identifier.edition, true);
                    if (item) {
                        this.items.push(item);
                    }
                }
            })
        }

        if (this.campaignMode && this.edition && !this.all && !this.affordable) {
            this.unlocks = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => ('' + itemData.id == this.filter || '0' + itemData.id == this.filter || '00' + itemData.id == this.filter) && !this.items.find((item) => item.id == itemData.id && item.edition == itemData.edition));
        }

        if (!onlyAffordable && this.affordable && this.items.length == 0) {
            this.affordable = false;
            this.sorted = this.character != undefined && this.character.progress.items.length > 0;
            this.update();
        } else {
            this.items.sort((a, b) => {
                if (this.sorted) {
                    if (this.character) {
                        if (gameManager.itemManager.owned(a, this.character) && !gameManager.itemManager.owned(b, this.character)) {
                            return -1;
                        } else if (gameManager.itemManager.owned(b, this.character) && !gameManager.itemManager.owned(a, this.character)) {
                            return 1;
                        } else if ((gameManager.itemManager.canBuy(a, this.character) || gameManager.itemManager.canCraft(a, this.character)) && !gameManager.itemManager.canBuy(b, this.character) && !gameManager.itemManager.canCraft(b, this.character)) {
                            return -1;
                        } else if ((gameManager.itemManager.canBuy(b, this.character) || gameManager.itemManager.canCraft(b, this.character)) && !gameManager.itemManager.canBuy(a, this.character) && !gameManager.itemManager.canCraft(a, this.character)) {
                            return 1;
                        } else if (gameManager.itemManager.canAdd(a, this.character) && !gameManager.itemManager.canAdd(b, this.character)) {
                            return -1;
                        } else if (gameManager.itemManager.canAdd(b, this.character) && !gameManager.itemManager.canAdd(a, this.character)) {
                            return 1;
                        } else if (a.slot && !b.slot) {
                            return -1;
                        } else if (b.slot && !a.slot) {
                            return 1;
                        }
                    }

                    if (a.slot && b.slot) {
                        return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
                    }

                    return 0;
                } else {
                    return a.id - b.id;
                }
            })
        }
    }


    select(itemData: ItemData, force: boolean = false) {
        if (this.data.select) {
            if (this.selected != itemData && (force || this.character && (gameManager.itemManager.owned(itemData, this.character) || gameManager.itemManager.canAdd(itemData, this.character) && (gameManager.itemManager.canBuy(itemData, this.character) || gameManager.itemManager.canCraft(itemData, this.character))))) {
                this.selected = itemData;
            } else {
                this.selected = undefined;
            }
        }
    }

    unlocked(item: ItemData): boolean {
        return gameManager.game.party.unlockedItems && gameManager.game.party.unlockedItems.find((identifier) => identifier.name == '' + item.id && identifier.edition == item.edition) != undefined;
    }

    unlockItemReveal(item: ItemData, revealed: boolean) {
        if (this.unlocks.indexOf(item) != -1 && revealed) {
            gameManager.game.party.unlockedItems = gameManager.game.party.unlockedItems || [];
            if (!this.unlocked(item)) {
                gameManager.stateManager.before("addUnlockedItem", item.edition, '' + item.id, item.name);
                gameManager.game.party.unlockedItems.push(new Identifier('' + item.id, item.edition));
                gameManager.stateManager.after();
                this.updateEditionItems();
            }
        }
    }

    removeUnlocked(itemData: ItemData) {
        if (this.unlocked(itemData)) {
            gameManager.stateManager.before("removeUnlockedItem", itemData.edition, '' + itemData.id, itemData.name);
            gameManager.game.party.unlockedItems = gameManager.game.party.unlockedItems || [];
            gameManager.game.party.unlockedItems = gameManager.game.party.unlockedItems.filter((identifier) => identifier.name != '' + itemData.id || identifier.edition != itemData.edition);
            gameManager.stateManager.after();
            this.updateEditionItems();
        }
    }


    addItem(itemData: ItemData, force: boolean = false) {
        if (this.character && (gameManager.itemManager.canAdd(itemData, this.character) || force)) {
            gameManager.stateManager.before("addItem", "data.character." + this.character.name, itemData.id + "", itemData.edition);
            gameManager.itemManager.addItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }

    buyItem(itemData: ItemData) {
        if (this.character && gameManager.itemManager.canBuy(itemData, this.character)) {
            gameManager.stateManager.before("buyItem", "data.character." + this.character.name, itemData.id + "", itemData.edition);
            gameManager.itemManager.buyItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }


    craftItem(itemData: ItemData) {
        if (this.character && gameManager.itemManager.canCraft(itemData, this.character)) {
            gameManager.stateManager.before("craftItem", "data.character." + this.character.name, itemData.id + "", itemData.edition);
            gameManager.itemManager.craftItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }


    removeItem(itemData: ItemData) {
        const item = this.character && this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (item && this.character) {
            const index = this.character.progress.items.indexOf(item)
            gameManager.stateManager.before("removeItem", "data.character." + this.character.name, this.character.progress.items[index].name, this.character.progress.items[index].edition);
            gameManager.itemManager.removeItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }

    sellItem(itemData: ItemData) {
        const item = this.character && this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (this.character && item && gameManager.itemManager.itemSellValue(itemData)) {
            const index = this.character.progress.items.indexOf(item)
            gameManager.stateManager.before("sellItem", "data.character." + this.character.name, this.character.progress.items[index].name, this.character.progress.items[index].edition);
            gameManager.itemManager.sellItem(itemData, this.character)
            gameManager.stateManager.after();
            this.update();
        }
    }

    toggleEquippedItem(itemData: ItemData, force: boolean = false) {
        const disabled = gameManager.game.state != GameState.draw || gameManager.game.round > 0;
        if (this.character && (!disabled || force)) {
            let equippedItems: ItemData[] = this.character.progress.equippedItems.map((identifier) => this.items.find((itemData) => identifier.name == '' + itemData.id && itemData.edition == identifier.edition)).filter((itemData) => itemData).map((itemData) => itemData as ItemData);
            const equipIndex = equippedItems.indexOf(itemData);
            gameManager.stateManager.before(equipIndex != -1 ? 'unequipItem' : 'equipItem', "data.character." + this.character.name, itemData.name, itemData.edition)
            gameManager.itemManager.toggleEquippedItem(itemData, this.character, force)
            gameManager.stateManager.after();
        }
    }

    close() {
        this.dialogRef.close();
    }
}