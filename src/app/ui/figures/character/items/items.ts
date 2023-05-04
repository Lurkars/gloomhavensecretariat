import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { ItemData, ItemSlot } from "src/app/game/model/data/ItemData";
import { Identifier } from "src/app/game/model/data/Identifier";
import { getLootClass, LootClass, LootType } from "src/app/game/model/data/Loot";
import { GameState } from "src/app/game/model/Game";
import { Subscription } from "rxjs";


@Component({
    selector: 'ghs-character-items',
    templateUrl: 'items.html',
    styleUrls: ['./items.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CharacterItemsComponent implements OnInit, OnDestroy {

    @Input() character!: Character;
    @Input() priceModifier: number = 0;
    items: ItemData[] = [];
    item: ItemData | undefined;
    itemIndex: number = 1;
    itemEdition: string = "";

    gameManager: GameManager = gameManager;
    GameState = GameState;

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
                const itemData = gameManager.item(+item.name, item.edition, true);
                if (itemData) {
                    this.items.push(itemData);
                } else {
                    console.warn("Unknown Item for edition '" + item.edition + "': " + item.name);
                }
            });

            this.items.sort((a, b) => a.id - b.id);

            if (gameManager.game.party.reputation >= 0) {
                this.priceModifier = Math.ceil((gameManager.game.party.reputation - 2) / 4) * -1;
            } else {
                this.priceModifier = Math.floor((gameManager.game.party.reputation + 2) / 4) * -1;
            }
        }
    }

    itemChange(itemIndexChange: number = 0) {
        setTimeout(() => {
            if (itemIndexChange != 0) {
                const max = gameManager.maxItemIndex(this.itemEdition || this.character.edition);
                this.itemIndex += itemIndexChange;
                if (this.itemIndex < 1) {
                    this.itemIndex = max;
                }
                this.item = gameManager.item(this.itemIndex, this.itemEdition && this.itemEdition || this.character.edition, false);
                while (!this.item && this.itemIndex > 0 && this.itemIndex < max) {
                    this.itemIndex += itemIndexChange;
                    this.item = gameManager.item(this.itemIndex, this.itemEdition || this.character.edition, false);
                }
                if (this.itemIndex > max) {
                    this.itemIndex = 1;
                    this.item = gameManager.item(this.itemIndex, this.itemEdition || this.character.edition, false);
                }
            } else {
                this.item = gameManager.item(this.itemIndex, this.itemEdition || this.character.edition, false);
            }
        });
    }

    editionChange() {
        this.itemIndex = 1;
        if (this.itemEdition) {
            const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.itemEdition);
            if (editionData && editionData.items) {
                this.itemIndex = Math.min(...editionData.items.map((itemData) => itemData.id));
            }
        }
        this.itemChange();
    }

    canAdd(item: ItemData | undefined): boolean {
        if (item) {
            const soldItems = gameManager.game.figures.filter((figure) => figure instanceof Character && figure.progress && figure.progress.items).map((figure) => figure as Character).map((figure) => figure.progress && figure.progress.items).reduce((pre, cur): Identifier[] => {
                return pre && cur && pre.concat(cur);
            }).filter((itemData) => item && itemData.name == item.id + "" && itemData.edition == item.edition).length;
            if (item.count && soldItems < item.count && !this.character.progress.items.find((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition)) {
                return true;
            }

        }
        return false;
    }

    canBuy(item: ItemData | undefined, cost: number = 0): boolean {
        if (item) {
            return item.cost && (item.cost + this.priceModifier + cost) <= this.character.progress.gold || false;
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
                        const requiredItem = gameManager.item(itemId, item.edition, true);
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


    async addItem(item: ItemData | undefined) {
        if (item && this.canAdd(item)) {
            await gameManager.stateManager.before("addItem", "data.character." + this.character.name, this.itemIndex + "", this.itemEdition);
            this.character.progress.items.push(new Identifier(this.itemIndex + "", this.itemEdition));
            this.items.push(item);
            this.items.sort((a, b) => a.id - b.id);
            await gameManager.stateManager.after();
            this.itemChange();
        }
    }

    async buyItem(item: ItemData | undefined) {
        if (item && this.canBuy(item)) {
            await gameManager.stateManager.before("buyItem", "data.character." + this.character.name, this.itemIndex + "", this.itemEdition);
            this.character.progress.gold -= (item.cost + this.priceModifier);
            this.character.progress.items.push(new Identifier(this.itemIndex + "", this.itemEdition));
            this.items.push(item);
            this.items.sort((a, b) => a.id - b.id);
            await gameManager.stateManager.after();
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
                        const requiredItem = gameManager.item(itemId, item.edition, true);
                        if (!requiredItem) {
                            console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ")");
                        } else if (this.items.find((itemData) => itemData.id == requiredItem.id && itemData.edition == requiredItem.edition)) {
                            const charItem = this.character.progress.items.find((item) => item.name == "" + requiredItem.id && item.edition == requiredItem.edition);
                            if (charItem) {
                                const index = this.character.progress.items.indexOf(charItem);
                                this.character.progress.items.splice(index, 1);
                                this.character.progress.equippedItems = this.character.progress.equippedItems.filter((identifier) => identifier.name != requiredItem.name || identifier.edition != requiredItem.edition);
                                this.items.splice(index, 1);
                            }
                        } else if (this.canBuy(requiredItem)) {
                            this.character.progress.gold -= (item.cost + this.priceModifier);
                        } else {
                            this.craftItemResources(requiredItem);
                        }
                    }
                });
            }
        }
    }

    async craftItem(item: ItemData | undefined) {
        if (item && this.canCraft(item)) {
            await gameManager.stateManager.before("craftItem", "data.character." + this.character.name, this.itemIndex + "", this.itemEdition);
            this.craftItemResources(item);
            this.character.progress.items.push(new Identifier(this.itemIndex + "", this.itemEdition));
            this.items.push(item);
            this.items.sort((a, b) => a.id - b.id);
            await gameManager.stateManager.after();
            this.itemChange();
        }
    }


    async removeItem(itemData: ItemData) {
        const item = this.character.progress.items.find((item) => item.name == "" + itemData.id && item.edition == itemData.edition);
        if (item) {
            const index = this.character.progress.items.indexOf(item)
            await gameManager.stateManager.before("removeItem", "data.character." + this.character.name, this.character.progress.items[index].name, this.character.progress.items[index].edition);
            this.character.progress.items.splice(index, 1);
            this.character.progress.equippedItems = this.character.progress.equippedItems.filter((identifier) => identifier.name != itemData.name || identifier.edition != itemData.edition);
            this.items.splice(index, 1);
            await gameManager.stateManager.after();
            this.itemChange();
        }
    }

    async sellItem(itemData: ItemData) {
        const item = this.character.progress.items.find((item) => item.name == "" + itemData.id && item.edition == itemData.edition);
        if (item && gameManager.lootManager.itemSellValue(itemData)) {
            const index = this.character.progress.items.indexOf(item)
            await gameManager.stateManager.before("sellItem", "data.character." + this.character.name, this.character.progress.items[index].name, this.character.progress.items[index].edition);
            this.character.progress.gold += gameManager.lootManager.itemSellValue(itemData);
            this.character.progress.items.splice(index, 1);
            this.character.progress.equippedItems = this.character.progress.equippedItems.filter((identifier) => identifier.name != itemData.name || identifier.edition != itemData.edition);
            this.items.splice(index, 1);
            await gameManager.stateManager.after();
            this.itemChange();
        }
    }

    isEquipped(item: ItemData) {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + item.id && identifier.edition == item.edition);
    }

    async toggleEquippedItem(item: ItemData, force: boolean = false) {
        const disabled = gameManager.game.state != GameState.draw || gameManager.game.round > 0;
        if (!disabled || force) {
            let equippedItems: ItemData[] = this.character.progress.equippedItems.map((identifier) => this.items.find((itemData) => identifier.name == '' + itemData.id && itemData.edition == identifier.edition)).filter((itemData) => itemData).map((itemData) => itemData as ItemData);
            const equipIndex = equippedItems.indexOf(item);
            if (equipIndex != -1) {
                equippedItems.splice(equipIndex, 1);
                const allowed = Math.ceil(this.character.level / 2);
                const smallEquipped = equippedItems.filter((itemData) => itemData.slot == ItemSlot.small).length;
                if (item.id == 16 && item.edition == 'gh' && smallEquipped >= allowed) {
                    for (let i = 0; i < (smallEquipped - allowed); i++) {
                        const equipped = equippedItems.find((itemData) => itemData.slot == ItemSlot.small);
                        if (equipped) {
                            equippedItems.splice(equippedItems.indexOf(equipped), 1);
                        }
                    }
                }
            } else {
                if (item.slot == ItemSlot.small) {
                    let allowed = Math.ceil(this.character.level / 2);
                    if (equippedItems.find((itemData) => itemData.id == 16 && itemData.edition == 'gh' || itemData.id == 60 && itemData.edition == 'fh')) {
                        allowed += 2;
                    }
                    if (equippedItems.find((itemData) => itemData.id == 132 && itemData.edition == 'fh')) {
                        allowed += 1;
                    }

                    if (equippedItems.filter((itemData) => itemData.slot == item.slot).length >= allowed) {
                        const equipped = equippedItems.find((itemData) => itemData.slot == item.slot);
                        if (equipped) {
                            equippedItems.splice(equippedItems.indexOf(equipped), 1);
                        }
                    }
                } else if (item.slot == ItemSlot.onehand) {
                    equippedItems = equippedItems.filter((equipped) => equipped.slot != ItemSlot.twohand);
                    if (equippedItems.filter((equipped) => equipped.slot == item.slot).length > 1) {
                        const equipped = equippedItems.find((equipped) => equipped.slot == item.slot);
                        if (equipped) {
                            equippedItems.splice(equippedItems.indexOf(equipped), 1);
                        }
                    }
                } else if (item.slot == ItemSlot.twohand) {
                    equippedItems = equippedItems.filter((equipped) => equipped.slot != ItemSlot.onehand && equipped.slot != ItemSlot.twohand);
                } else {
                    equippedItems = equippedItems.filter((equipped) => equipped.slot != item.slot);
                }

                equippedItems.push(item);
            }

            await gameManager.stateManager.before(equipIndex != -1 ? 'unequipItem' : 'equipItem', "data.character." + this.character.name, item.name, item.edition)
            this.character.progress.equippedItems = equippedItems.map((itemData) => new Identifier(itemData.id + '', itemData.edition));
            this.character.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character);
            await gameManager.stateManager.after();
        }
    }
}