import { Character } from "../model/Character";
import { Game } from "../model/Game";
import { AdditionalIdentifier, Identifier } from "../model/data/Identifier";
import { ItemData, ItemSlot } from "../model/data/ItemData";
import { LootClass, LootType, getLootClass } from "../model/data/Loot";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ItemManager {

    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    itemEditions(edition: string | undefined = undefined): string[] {
        return gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1 && (!edition || edition == editionData.edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1)).flatMap((editionData) => editionData.items).map((itemData) => itemData.edition).filter((value, index, self) => index == self.indexOf(value) && settingsManager.settings.editions.indexOf(value) != -1);
    }

    itemData(edition: string, all: boolean = false): ItemData[] {
        const extenstions = this.itemEditions(edition);
        return gameManager.itemData(undefined, all).filter((itemData) => itemData.edition == edition || extenstions.indexOf(itemData.edition) != -1 ||
            edition == 'fh' && itemData.edition == 'gh' && [10, 25, 72, 105, 109, 116].indexOf(itemData.id) != -1);
    }

    getItem(id: number, edition: string, all: boolean): ItemData | undefined {
        let item = gameManager.itemData(edition, all).find((itemData) => itemData && itemData.id == id && itemData.edition == edition);
        if (!item) {
            item = gameManager.itemData(undefined, all).find((itemData) => itemData && itemData.id == id && gameManager.editionExtensions(edition).indexOf(itemData.edition) != -1);
        }
        return item;
    }

    maxItemIndex(edition: string): number {
        return Math.max(...gameManager.itemData(edition).map((itemData) => itemData.id));
    }

    pricerModifier(): number {
        if (this.game.party.reputation >= 0) {
            return Math.ceil((gameManager.game.party.reputation - 2) / 4) * -1;
        } else {
            return Math.floor((gameManager.game.party.reputation + 2) / 4) * -1;
        }
    }

    assigned(item: ItemData): number {
        return this.game.figures.filter((figure) => figure instanceof Character && figure.progress && figure.progress.items).map((figure) => figure as Character).map((figure) => figure.progress && figure.progress.items).reduce((pre, cur): Identifier[] => {
            return pre && cur && pre.concat(cur);
        }).filter((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition).length;
    }


    owned(item: ItemData, character: Character): boolean {
        return character.progress.items.find((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition) != undefined;
    }

    canAdd(item: ItemData, character: Character): boolean {
        return item.count && this.assigned(item) < item.count && !character.progress.items.find((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition) || false;
    }

    canBuy(item: ItemData, character: Character, cost: number = 0): boolean {
        return item.cost && (item.cost + this.pricerModifier() + cost) <= character.progress.gold && this.canAdd(item, character) || false;
    }

    canCraft(item: ItemData, character: Character, resources: Partial<Record<LootType, number>> = {}): boolean {
        let canCraft = false;
        if (item.resources) {
            Object.keys(item.resources).forEach(key => {
                const lootType = key as LootType;
                const requiredResource = ((item.resources[lootType] || 0) + (resources[lootType] || 0))
                if (getLootClass(lootType) == LootClass.herb_resources) {
                    canCraft = canCraft && ((character.progress.loot[lootType] || 0) >= requiredResource || (gameManager.game.party.loot[lootType] || 0) >= requiredResource);
                } else {
                    canCraft = canCraft && (character.progress.loot[lootType] || 0) >= requiredResource;
                }
            });
        }

        if (item.requiredItems) {
            item.requiredItems.forEach((itemId) => {
                if (itemId != item.id) {
                    const requiredItem = this.getItem(itemId, item.edition, true);
                    if (!requiredItem) {
                        console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ")");
                    } else if (!this.owned(requiredItem, character)) {
                        canCraft = canCraft && (this.canCraft(requiredItem, character, item.resources || {}) || this.canBuy(requiredItem, character, item.cost));
                    }
                }
            });
        }

        return canCraft;
    }

    itemSellValue(itemData: ItemData): number {
        if (itemData.cost) {
            return Math.floor(itemData.cost / 2);
        } else {
            let costs = 0;
            if (itemData.resources) {
                Object.keys(itemData.resources).forEach(key => {
                    const lootType = key as LootType;
                    costs += (itemData.resources[lootType] || 0) * 2;
                });

                if (itemData.requiredItems) {
                    itemData.requiredItems.forEach(() => {
                        costs += 2;
                    })
                }
            }
            return costs;
        }
    }


    addItem(item: ItemData, character: Character) {
        character.progress.items.push(new Identifier(item.id + "", item.edition));
    }

    buyItem(item: ItemData, character: Character) {
        character.progress.gold -= (item.cost + this.pricerModifier());
        character.progress.items.push(new Identifier(item.id + "", item.edition));
    }


    craftItemResources(item: ItemData, character: Character,) {
        if (item.resources) {
            Object.keys(item.resources).forEach(key => {
                const lootType = key as LootType;
                const requiredResource = (item.resources[lootType] || 0);
                if (getLootClass(lootType) == LootClass.herb_resources) {
                    if ((character.progress.loot[lootType] || 0) >= requiredResource) {
                        character.progress.loot[lootType] = (character.progress.loot[lootType] || 0) - requiredResource;
                    } else {
                        this.game.party.loot[lootType] = (this.game.party.loot[lootType] || 0) - requiredResource;
                    }
                } else {
                    character.progress.loot[lootType] = (character.progress.loot[lootType] || 0) - requiredResource;
                }

            });
        }

        if (item.requiredItems) {
            item.requiredItems.forEach((itemId) => {
                if (itemId != item.id) {
                    const requiredItem = this.getItem(itemId, item.edition, true);
                    if (!requiredItem) {
                        console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ")");
                    } else if (requiredItem) {
                        const charItem = character.progress.items.find((identifier) => identifier.name == '' + requiredItem.id && identifier.edition == requiredItem.edition);
                        if (charItem) {
                            const index = character.progress.items.indexOf(charItem);
                            character.progress.items.splice(index, 1);
                            character.progress.equippedItems = character.progress.equippedItems.filter((identifier) => identifier.name != '' + requiredItem.id || identifier.edition != requiredItem.edition);

                        }
                    } else if (this.canBuy(requiredItem, character)) {
                        character.progress.gold -= (item.cost + this.pricerModifier());
                    } else {
                        this.craftItemResources(requiredItem, character);
                    }
                }
            });
        }
    }


    craftItem(item: ItemData, character: Character) {
        this.craftItemResources(item, character);
        character.progress.items.push(new Identifier(item.id + "", item.edition));
    }


    removeItem(itemData: ItemData, character: Character) {
        const item = character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (item) {
            const index = character.progress.items.indexOf(item)
            character.progress.items.splice(index, 1);
            character.progress.equippedItems = character.progress.equippedItems.filter((identifier) => identifier.name != '' + itemData.id || identifier.edition != itemData.edition);
        }
    }

    sellItem(itemData: ItemData, character: Character) {
        const item = character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
        if (item && this.itemSellValue(itemData)) {
            const index = character.progress.items.indexOf(item)
            character.progress.gold += this.itemSellValue(itemData);
            character.progress.items.splice(index, 1);
            character.progress.equippedItems = character.progress.equippedItems.filter((identifier) => identifier.name != '' + itemData.id || identifier.edition != itemData.edition);
        }
    }

    isEquipped(item: ItemData, character: Character): boolean {
        return character.progress.equippedItems.find((identifier) => identifier.name == '' + item.id && identifier.edition == item.edition) != undefined;
    }

    toggleEquippedItem(item: ItemData, character: Character, force: boolean) {
        let equippedItems: ItemData[] = character.progress.equippedItems.map((identifier) => this.getItem(+identifier.name, identifier.edition, true)).filter((itemData) => itemData).map((itemData) => itemData as ItemData);
        const equipIndex = equippedItems.indexOf(item);
        if (force && equipIndex == -1) {
            equippedItems.push(item);
        } else if (force) {
            equippedItems.splice(equipIndex, 1);
        } else if (equipIndex != -1) {
            equippedItems.splice(equipIndex, 1);
            const allowed = Math.ceil(character.level / 2);
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
            const drifterAdditionalHand = character.name == 'drifter' && character.edition == 'fh' && character.progress.perks[11];
            if (item.slot == ItemSlot.small) {
                let allowed = Math.ceil(character.level / 2);
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
                const twoHand = equippedItems.find((equipped) => equipped.slot == ItemSlot.twohand)
                if (twoHand && !drifterAdditionalHand) {
                    equippedItems = equippedItems.filter((equipped) => equipped.slot != ItemSlot.twohand);
                }
                if (equippedItems.filter((equipped) => equipped.slot == item.slot).length > (drifterAdditionalHand ? (twoHand ? 0 : 2) : 1)) {
                    const equipped = equippedItems.find((equipped) => equipped.slot == item.slot);
                    if (equipped) {
                        equippedItems.splice(equippedItems.indexOf(equipped), 1);
                    }
                }
            } else if (item.slot == ItemSlot.twohand) {
                equippedItems = equippedItems.filter((equipped) => equipped.slot != item.slot);
                if (drifterAdditionalHand) {
                    while (equippedItems.filter((equipped) => equipped.slot == ItemSlot.onehand).length > 1) {
                        const equipped = equippedItems.find((equipped) => equipped.slot == ItemSlot.onehand);
                        if (equipped) {
                            equippedItems.splice(equippedItems.indexOf(equipped), 1);
                        }
                    }
                } else {
                    equippedItems = equippedItems.filter((equipped) => equipped.slot != ItemSlot.onehand);
                }
            } else {
                equippedItems = equippedItems.filter((equipped) => equipped.slot != item.slot);
            }

            equippedItems.push(item);
        }

        character.progress.equippedItems = equippedItems.map((itemData) => new AdditionalIdentifier(itemData.id + '', itemData.edition));
        character.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(character);

        if (item.id == 3 && item.edition == 'fh') {
            if (equipIndex == -1) {
                character.maxHealth += 1;
            } else {
                character.maxHealth -= 1;
            }
            character.health = character.maxHealth;
        }


    }

}