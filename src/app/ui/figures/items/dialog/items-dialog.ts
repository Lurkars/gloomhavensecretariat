import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { CountIdentifier } from "src/app/game/model/data/Identifier";
import { ItemData, ItemSlot } from "src/app/game/model/data/ItemData";
import { ghsDialogClosingHelper, ghsTextSearch } from "src/app/ui/helper/Static";
import { ItemsBrewDialog } from "../brew/brew";
import { ItemDistillDialogComponent } from "../character/item-distill";
import { ItemsCharacterDialogComponent } from "../character/items-character-dialog";

@Component({
    standalone: false,
    selector: 'ghs-items-dialog',
    templateUrl: './items-dialog.html',
    styleUrls: ['./items-dialog.scss']
})
export class ItemsDialogComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    edition: string | undefined;
    currentEdition: string;
    editions: string[];
    editionItems: ItemData[] = [];
    items: ItemData[] = [];
    itemsMeta: { edition: string, id: number | string, canAdd: boolean, canBuy: boolean, canCraft: boolean, owned: boolean, assigned: number, countAvailable: number }[] = [];
    selected: ItemData | undefined;
    character: Character | undefined;
    filter: string = "";
    all: boolean = false;
    affordable: boolean = false;
    sorted: boolean = false;
    itemSlots: (ItemSlot | "undefined")[] = [];
    itemSlotUndefined: boolean = false;
    unlocks: ItemData[] = [];
    campaignMode: boolean = false;
    brewing: number = 0;

    ItemSlot: ItemSlot[] = Object.values(ItemSlot);

    constructor(@Inject(DIALOG_DATA) public data: { edition: string | undefined, select: Character | undefined, affordable: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {
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

    brewDialog(force: boolean = false) {
        if (!gameManager.itemManager.brewingDisabled() || force) {
            this.dialog.open(ItemsBrewDialog, {
                panelClass: ['dialog'],
                data: this.character
            })
        }
    }

    update(onlyAffordable: boolean = false) {
        this.unlocks = [];
        this.selected = undefined;
        this.items = this.editionItems.filter((itemData) => (!this.affordable || gameManager.itemManager.assigned(itemData) < itemData.count)).filter((itemData) => !this.affordable || this.character && gameManager.itemManager.canAdd(itemData, this.character) && (gameManager.itemManager.canBuy(itemData, this.character) || gameManager.itemManager.canCraft(itemData, this.character)));

        if (this.character && this.edition && this.campaignMode && !this.all && !this.affordable) {
            this.character.progress.items.forEach((identifier) => {
                if (identifier.edition == this.edition && !this.items.find((itemData) => itemData.id == +identifier.name && itemData.edition == identifier.edition)) {
                    const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
                    if (item) {
                        this.items.push(item);
                    }
                }
            })
        }

        this.items = this.items.filter((itemData) => !this.filter || (ghsTextSearch(itemData.name, this.filter) || ghsTextSearch('' + (typeof itemData.id === 'number' && itemData.id < 100 ? '0' : '') + (typeof itemData.id === 'number' && itemData.id < 10 ? '0' : '') + itemData.id, this.filter)));

        this.itemSlotUndefined = this.items.find((itemData) => !itemData.slot) != undefined;

        if (!this.itemSlotUndefined) {
            this.itemSlots = this.itemSlots.filter((value) => value != 'undefined');
        }

        if (this.itemSlots.length > 0) {
            this.items = this.items.filter((itemData) => itemData.slot && this.itemSlots.indexOf(itemData.slot) != -1 || !itemData.slot && this.itemSlots.indexOf("undefined") != -1);
        }

        if (this.campaignMode && this.edition && !this.all && !this.affordable) {
            this.unlocks = gameManager.itemManager.getItems(this.edition, true).filter((itemData) => ('' + itemData.id == this.filter || '0' + itemData.id == this.filter || '00' + itemData.id == this.filter) && !this.items.find((item) => item.id == itemData.id && item.edition == itemData.edition));
        }

        if (!onlyAffordable && this.affordable && this.items.length == 0) {
            this.affordable = false;
            this.sorted = this.character != undefined && this.character.progress.items.length > 0;
            this.update();
        } else {
            this.itemsMeta = [];
            if (this.character) {
                this.items.forEach((itemData) => {
                    if (this.character) {
                        this.itemsMeta.push({ edition: itemData.edition, id: itemData.id, canAdd: gameManager.itemManager.canAdd(itemData, this.character), canBuy: gameManager.itemManager.canBuy(itemData, this.character), canCraft: gameManager.itemManager.canCraft(itemData, this.character), owned: gameManager.itemManager.owned(itemData, this.character), assigned: gameManager.itemManager.assigned(itemData), countAvailable: gameManager.itemManager.countAvailable(itemData) })
                    }
                })

                if (gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings) {
                    const alchemist = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'alchemist');
                    if (alchemist && alchemist.level) {
                        this.brewing = alchemist.level < 3 ? 2 : 3;
                    }
                }
            }

            this.items.sort((a, b) => {
                if (this.sorted) {
                    if (this.character) {
                        const A = this.itemsMeta.find((value) => value.edition == a.edition && value.id == a.id);
                        const B = this.itemsMeta.find((value) => value.edition == b.edition && value.id == b.id);

                        if (!A || !B) {
                            return 0;
                        }

                        if (A.owned && !B.owned) {
                            return -1;
                        } else if (!A.owned && B.owned) {
                            return 1;
                        } else if ((A.canBuy || A.canCraft) && !B.canBuy && !B.canCraft) {
                            return -1;
                        } else if ((B.canBuy || B.canCraft) && !A.canBuy && !A.canCraft) {
                            return 1;
                        } else if (A.canAdd && !B.canAdd) {
                            return -1;
                        } else if (!A.canAdd && B.canAdd) {
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
                    if (a.edition != b.edition) {
                        return a.edition == this.currentEdition ? -1 : 1;
                    }

                    return gameManager.itemManager.sortItems(a, b);
                }
            })

            this.itemsMeta.sort((a, b) => {
                const A = this.items.find((value) => value.edition == a.edition && value.id == a.id);
                const B = this.items.find((value) => value.edition == b.edition && value.id == b.id);

                if (!A || !B) {
                    return 0;
                }

                return this.items.indexOf(A) - this.items.indexOf(B);
            })
        }

        this.brewing = 0;
    }

    toggleItemSlotFilter(slot: ItemSlot | "undefined", add: boolean = false) {
        if (this.itemSlots.indexOf(slot) == -1) {
            if (add) {
                this.itemSlots.push(slot);
            } else {
                this.itemSlots = [slot];
            }
        } else {
            this.itemSlots = this.itemSlots.filter((value) => value != slot);
        }
        this.update(true);
    }

    select(itemData: ItemData, force: boolean = false) {
        if (this.data.select) {
            if (this.selected != itemData && (force || this.character && (gameManager.itemManager.owned(itemData, this.character) || gameManager.itemManager.canAdd(itemData, this.character)))) {
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
                gameManager.stateManager.before("addUnlockedItem", item.edition, item.id, item.name);
                gameManager.game.party.unlockedItems.push(new CountIdentifier('' + item.id, item.edition));
                gameManager.stateManager.after();
                this.updateEditionItems();
            }
        }
    }

    removeUnlocked(itemData: ItemData) {
        if (this.unlocked(itemData)) {
            gameManager.stateManager.before("removeUnlockedItem", itemData.edition, itemData.id, itemData.name);
            gameManager.game.party.unlockedItems = gameManager.game.party.unlockedItems || [];
            gameManager.game.party.unlockedItems = gameManager.game.party.unlockedItems.filter((identifier) => identifier.name != '' + itemData.id || identifier.edition != itemData.edition);
            gameManager.stateManager.after();
            this.updateEditionItems();
        }
    }


    addItem(itemData: ItemData, force: boolean = false) {
        if (this.character && (gameManager.itemManager.canAdd(itemData, this.character) || force)) {
            gameManager.stateManager.before("addItem", gameManager.characterManager.characterName(this.character), itemData.id + "", itemData.edition);
            gameManager.itemManager.addItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }

    buyItem(itemData: ItemData) {
        if (this.character && gameManager.itemManager.canBuy(itemData, this.character)) {
            gameManager.stateManager.before("buyItem", gameManager.characterManager.characterName(this.character), itemData.id + "", itemData.edition);
            gameManager.itemManager.buyItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }


    craftItem(itemData: ItemData) {
        if (this.character && gameManager.itemManager.canCraft(itemData, this.character)) {
            gameManager.stateManager.before("craftItem", gameManager.characterManager.characterName(this.character), itemData.id + "", itemData.edition);
            gameManager.itemManager.craftItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }


    removeItem(itemData: ItemData) {
        const item = this.character && this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (item && this.character) {
            const index = this.character.progress.items.indexOf(item)
            gameManager.stateManager.before("removeItem", gameManager.characterManager.characterName(this.character), this.character.progress.items[index].name, this.character.progress.items[index].edition);
            gameManager.itemManager.removeItem(itemData, this.character);
            gameManager.stateManager.after();
            this.update();
        }
    }

    sellItem(itemData: ItemData) {
        const item = this.character && this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (this.character && item && gameManager.itemManager.itemSellValue(itemData)) {
            const index = this.character.progress.items.indexOf(item)
            gameManager.stateManager.before("sellItem", gameManager.characterManager.characterName(this.character), this.character.progress.items[index].name, this.character.progress.items[index].edition);
            gameManager.itemManager.sellItem(itemData, this.character)
            gameManager.stateManager.after();
            this.update();
        }
    }

    distillItem(itemData: ItemData) {
        if (this.character) {
            this.dialog.open(ItemDistillDialogComponent, {
                panelClass: ['dialog'],
                data: { character: this.character, item: itemData }
            })
        }
    }

    toggleEquippedItem(itemData: ItemData, force: boolean = false) {
        const disabled = gameManager.game.state != GameState.draw || gameManager.game.round > 0;
        if (this.character && (!disabled || force)) {
            let equippedItems: ItemData[] = this.character.progress.equippedItems.map((identifier) => this.items.find((itemData) => identifier.name == '' + itemData.id && itemData.edition == identifier.edition)).filter((itemData) => itemData).map((itemData) => itemData as ItemData);
            const equipIndex = equippedItems.indexOf(itemData);
            gameManager.stateManager.before(equipIndex != -1 ? 'unequipItem' : 'equipItem', gameManager.characterManager.characterName(this.character), itemData.name, itemData.edition)
            gameManager.itemManager.toggleEquippedItem(itemData, this.character, force)
            gameManager.stateManager.after();
        }
    }

    openItems(): void {
        if (this.character && this.character.progress.items && this.character.progress.items.length) {
            this.dialogRef.close();
            this.dialog.open(ItemsCharacterDialogComponent, {
                panelClass: ['dialog'],
                data: this.character
            });
        }
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}