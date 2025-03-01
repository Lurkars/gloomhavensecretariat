import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";
import { getLootClass, LootClass, LootType } from "src/app/game/model/data/Loot";
import { GameState } from "src/app/game/model/Game";
import { ItemsBrewDialog } from "./brew/brew";
import { ItemDistillDialogComponent } from "./character/item-distill";
import { ItemDialogComponent } from "./dialog/item-dialog";
import { ItemsDialogComponent } from "./dialog/items-dialog";
import { ConfirmDialogComponent } from "../../helper/confirm/confirm";


@Component({
    standalone: false,
    selector: 'ghs-character-items',
    templateUrl: 'items.html',
    styleUrls: ['./items.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CharacterItemsComponent implements OnInit, OnDestroy {

    @Input() character!: Character;
    items: ItemData[] = [];
    item: ItemData | undefined;
    itemIndex: number = 1;
    itemEdition: string = "";
    brewing: number = 0;
    herbs: LootType[] = [LootType.rockroot, LootType.snowthistle, LootType.axenut, LootType.flamefruit, LootType.corpsecap, LootType.arrowvine];

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    GameState = GameState;

    constructor(private dialog: Dialog) { }

    ngOnInit() {
        this.updateItems();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.updateItems();
            }
        })
        if (!this.itemEdition) {
            this.itemEdition = gameManager.currentEdition(this.character.edition);
        }
        this.editionChange();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.itemEdition) {
            this.itemEdition = gameManager.currentEdition(this.character.edition);
        }
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }


    updateItems() {
        this.items = [];
        if (this.character.progress.items) {
            this.character.progress.items.forEach((item) => {
                const itemData = gameManager.itemManager.getItem(item.name, item.edition, true);
                if (itemData) {
                    this.items.push(itemData);
                } else {
                    console.warn("Unknown Item for edition '" + item.edition + "': " + item.name);
                }
            });

            this.items.sort(gameManager.itemManager.sortItems);
        }

        this.brewing = 0;

        if (gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings) {
            const alchemist = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'alchemist');
            if (alchemist && alchemist.level) {
                this.brewing = alchemist.level < 3 ? 2 : 3;
            }
        }
    }

    brewDialog(force: boolean = false) {
        if (!gameManager.itemManager.brewingDisabled() || force) {
            this.dialog.open(ItemsBrewDialog, {
                panelClass: ['dialog'],
                data: this.character
            })
        }
    }

    itemDialog() {
        this.dialog.open(ItemsDialogComponent, {
            panelClass: ['dialog'],
            data: { edition: gameManager.game.edition, select: this.character }
        })
    }

    itemChange(itemIndexChange: number = 0) {
        setTimeout(() => {
            if (itemIndexChange != 0) {
                const max = gameManager.itemManager.maxItemIndex(this.itemEdition || this.character.edition);
                this.itemIndex += itemIndexChange;
                if (this.itemIndex < 1) {
                    this.itemIndex = max;
                }
                this.item = gameManager.itemManager.getItem(this.itemIndex, this.itemEdition && this.itemEdition || this.character.edition, false);
                while (!this.item && this.itemIndex > 0 && this.itemIndex < max) {
                    this.itemIndex += itemIndexChange;
                    this.item = gameManager.itemManager.getItem(this.itemIndex, this.itemEdition || this.character.edition, false);
                }
                if (this.itemIndex > max) {
                    this.itemIndex = 1;
                    this.item = gameManager.itemManager.getItem(this.itemIndex, this.itemEdition || this.character.edition, false);
                }
            } else {
                this.item = gameManager.itemManager.getItem(this.itemIndex, this.itemEdition || this.character.edition, false);
            }
        });
    }

    editionChange() {
        this.itemIndex = 1;
        if (this.itemEdition) {
            const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.itemEdition);
            if (editionData && editionData.items) {
                this.itemIndex = Math.min(...editionData.items.filter((itemData) => typeof itemData.id === 'number').map((itemData) => +itemData.id));
            }
        }
        this.itemChange();
    }

    canAdd(item: ItemData | undefined): boolean {
        if (item) {
            const soldItems = this.assigned(item);
            if (item.count && soldItems < item.count && !this.character.progress.items.find((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition)) {
                return true;
            }

        }
        return false;
    }

    assigned(item: ItemData): number {
        return gameManager.game.figures.filter((figure) => figure instanceof Character && figure.progress && figure.progress.items).map((figure) => figure as Character).map((figure) => figure.progress && figure.progress.items).reduce((pre, cur): Identifier[] => {
            return pre && cur && pre.concat(cur);
        }).filter((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition).length;
    }

    canBuy(item: ItemData | undefined, cost: number = 0): boolean {
        if (item) {
            return item.cost && (item.cost + gameManager.itemManager.pricerModifier() + cost) <= this.character.progress.gold && this.canAdd(item) || false;
        }
        return false;
    }

    canCraft(item: ItemData | undefined, resources: Partial<Record<LootType, number>> = {}): boolean {
        if (item) {
            let canCraft = true;

            if (item.resources) {
                Object.keys(item.resources).forEach(key => {
                    const lootType = key as LootType;
                    const requiredResource = ((item.resources[lootType] || 0) + (resources[lootType] || 0))
                    if (getLootClass(lootType) == LootClass.herb_resources) {
                        canCraft = canCraft && ((this.character.progress.loot[lootType] || 0) >= requiredResource || (gameManager.game.party.loot[lootType] || 0) >= requiredResource);
                    } else {
                        canCraft = canCraft && (this.character.progress.loot[lootType] || 0) >= requiredResource;
                    }
                });
            }

            if (item.requiredItems) {
                item.requiredItems.forEach((itemId) => {
                    if (itemId != item.id) {
                        const requiredItem = gameManager.itemManager.getItem(itemId, item.edition, true);
                        if (!requiredItem) {
                            console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ")");
                        } else if (!this.items.find((itemData) => itemData.id == requiredItem.id && itemData.edition == requiredItem.edition)) {
                            canCraft = canCraft && (this.canCraft(requiredItem, item.resources || {}) || this.canBuy(requiredItem, item.cost));
                        }
                    }
                });
            }

            return canCraft;
        }
        return false;
    }


    addItem(item: ItemData | undefined, force: boolean = false) {
        if (item && (this.canAdd(item) || force)) {
            gameManager.stateManager.before("addItem", gameManager.characterManager.characterName(this.character), item.id + "", item.edition);
            this.character.progress.items.push(new Identifier(item.id + "", item.edition));
            this.items.push(item);
            this.items.sort(gameManager.itemManager.sortItems);
            gameManager.stateManager.after();
            this.itemChange();
        }
    }

    buyItem(item: ItemData | undefined) {
        if (item && this.canBuy(item)) {
            gameManager.stateManager.before("buyItem", gameManager.characterManager.characterName(this.character), item.id + "", item.edition);
            this.character.progress.gold -= (item.cost + gameManager.itemManager.pricerModifier());
            this.character.progress.items.push(new Identifier(item.id + "", item.edition));
            this.items.push(item);
            this.items.sort(gameManager.itemManager.sortItems);
            gameManager.stateManager.after();
            this.itemChange();
        }
    }

    craftItemResources(item: ItemData) {
        if (this.canCraft(item)) {
            if (item.resources) {
                Object.keys(item.resources).forEach(key => {
                    const lootType = key as LootType;
                    const requiredResource = (item.resources[lootType] || 0)
                    if (getLootClass(lootType) == LootClass.herb_resources) {
                        if ((this.character.progress.loot[lootType] || 0) >= requiredResource) {
                            this.character.progress.loot[lootType] = (this.character.progress.loot[lootType] || 0) - requiredResource;
                        } else {
                            gameManager.game.party.loot[lootType] = (gameManager.game.party.loot[lootType] || 0) - requiredResource;
                        }
                    } else {
                        this.character.progress.loot[lootType] = (this.character.progress.loot[lootType] || 0) - requiredResource;
                    }
                });
            }

            if (item.requiredItems) {
                item.requiredItems.forEach((itemId) => {
                    if (itemId != item.id) {
                        const requiredItem = gameManager.itemManager.getItem(itemId, item.edition, true);
                        if (!requiredItem) {
                            console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ")");
                        } else if (this.items.find((itemData) => itemData.id == requiredItem.id && itemData.edition == requiredItem.edition)) {
                            const charItem = this.character.progress.items.find((identifier) => identifier.name == '' + requiredItem.id && identifier.edition == requiredItem.edition);
                            if (charItem) {
                                const index = this.character.progress.items.indexOf(charItem);
                                this.character.progress.items.splice(index, 1);
                                this.character.progress.equippedItems = this.character.progress.equippedItems.filter((identifier) => identifier.name != '' + requiredItem.id || identifier.edition != requiredItem.edition);
                                this.items.splice(index, 1);
                            }
                        } else if (this.canBuy(requiredItem)) {
                            this.character.progress.gold -= (item.cost + gameManager.itemManager.pricerModifier());
                        } else {
                            this.craftItemResources(requiredItem);
                        }
                    }
                });
            }
        }
    }

    craftItem(item: ItemData | undefined) {
        if (item && this.canCraft(item)) {
            gameManager.stateManager.before("craftItem", gameManager.characterManager.characterName(this.character), item.id + "", item.edition);
            this.craftItemResources(item);
            this.character.progress.items.push(new Identifier(item.id + "", item.edition));
            this.items.push(item);
            this.items.sort(gameManager.itemManager.sortItems);
            gameManager.stateManager.after();
            this.itemChange();
        }
    }

    openItem(itemData: ItemData) {
        this.dialog.open(ItemDialogComponent, {
            panelClass: ['fullscreen-panel'],
            data: { character: settingsManager.settings.characterItems ? this.character : undefined, item: itemData, setup: gameManager.game.state == GameState.draw && gameManager.roundManager.firstRound }
        })
    }

    removeItem(itemData: ItemData) {
        const item = this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (item) {
            this.dialog.open(ConfirmDialogComponent, {
                panelClass: ['dialog'],
                data: {
                    label: 'game.items.remove',
                    args: ['data.items.' + item.edition + '-' + itemData.id]
                }
            }).closed.subscribe({
                next: (result) => {
                    if (result) {
                        const index = this.character.progress.items.indexOf(item)
                        gameManager.stateManager.before("removeItem", gameManager.characterManager.characterName(this.character), this.character.progress.items[index].name, this.character.progress.items[index].edition);
                        this.character.progress.items.splice(index, 1);
                        this.character.progress.equippedItems = this.character.progress.equippedItems.filter((identifier) => identifier.name != '' + itemData.id || identifier.edition != itemData.edition);
                        this.items.splice(index, 1);
                        gameManager.stateManager.after();
                        this.itemChange();
                    }
                }
            })
        }
    }

    sellItem(itemData: ItemData) {
        const item = this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (item && gameManager.itemManager.itemSellValue(itemData)) {
            this.dialog.open(ConfirmDialogComponent, {
                panelClass: ['dialog'],
                data: {
                    label: 'game.items.sell',
                    args: ['data.items.' + item.edition + '-' + itemData.id, gameManager.itemManager.itemSellValue(itemData)]
                }
            }).closed.subscribe({
                next: (result) => {
                    if (result) {
                        const index = this.character.progress.items.indexOf(item)
                        gameManager.stateManager.before("sellItem", gameManager.characterManager.characterName(this.character), this.character.progress.items[index].name, this.character.progress.items[index].edition);
                        this.character.progress.gold += gameManager.itemManager.itemSellValue(itemData);
                        this.character.progress.items.splice(index, 1);
                        this.character.progress.equippedItems = this.character.progress.equippedItems.filter((identifier) => identifier.name != '' + itemData.id || identifier.edition != itemData.edition);
                        this.items.splice(index, 1);
                        gameManager.stateManager.after();
                        this.itemChange();
                    }
                }
            })
        }
    }

    distillItem(itemData: ItemData) {
        this.dialog.open(ItemDistillDialogComponent, {
            panelClass: ['dialog'],
            data: { character: this.character, item: itemData }
        })
    }

    isEquipped(item: ItemData) {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + item.id && identifier.edition == item.edition);
    }

    toggleEquippedItem(itemData: ItemData, force: boolean = false) {
        const disabled = gameManager.game.state != GameState.draw || gameManager.game.round > 0;
        if ((!disabled || force) && this.character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition) != undefined) {
            gameManager.stateManager.before(gameManager.itemManager.isEquipped(itemData, this.character) ? 'unequipItem' : 'equipItem', gameManager.characterManager.characterName(this.character), itemData.id, itemData.edition)
            gameManager.itemManager.toggleEquippedItem(itemData, this.character, force)
            gameManager.stateManager.after();
        }
    }

    setItemNotes(event: any) {
        if (this.character.progress.itemNotes != event.target.value) {
            gameManager.stateManager.before("setItems", gameManager.characterManager.characterName(this.character), event.target.value);
            this.character.progress.itemNotes = event.target.value;
            gameManager.stateManager.after();
        }
    }
}