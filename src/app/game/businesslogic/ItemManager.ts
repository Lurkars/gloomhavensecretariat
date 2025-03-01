import { v4 as uuidv4 } from 'uuid';
import { Character } from "../model/Character";
import { EntityValueFunction } from "../model/Entity";
import { Game } from "../model/Game";
import { Summon, SummonColor } from "../model/Summon";
import { AttackModifier, AttackModifierType } from '../model/data/AttackModifier';
import { Condition, ConditionName, ConditionType } from "../model/data/Condition";
import { Element, ElementState } from "../model/data/Element";
import { AdditionalIdentifier, CountIdentifier, Identifier } from "../model/data/Identifier";
import { ItemData, ItemEffect, ItemEffectType, ItemFlags, ItemSlot } from "../model/data/ItemData";
import { LootClass, LootType, getLootClass, herbResourceLootTypes } from "../model/data/Loot";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ItemManager {

    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    itemEditions(edition: string | undefined = undefined): string[] {
        return gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1 && (!edition || edition == editionData.edition || gameManager.editionExtensions(edition).indexOf(editionData.edition) != -1 || edition == 'fh' && editionData.edition == 'gh') && editionData.items && editionData.items.length > 0).flatMap((editionData) => editionData.edition);
    }

    getItems(edition: string | undefined, all: boolean = false): ItemData[] {
        return gameManager.itemData().filter((itemData) => all && (!edition || itemData.edition == edition) || this.isItemAvailable(itemData, edition));
    }

    isItemAvailable(itemData: ItemData, edition: string | undefined, withUnlocks: boolean = true): boolean {
        if (!this.game.party.campaignMode) {
            return !edition || itemData.edition == edition || gameManager.editionExtensions(edition).indexOf(itemData.edition) != -1;
        }

        if (edition && (itemData.edition == edition || gameManager.editionExtensions(edition).indexOf(itemData.edition) != -1)) {
            if (withUnlocks && this.game.party.unlockedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition)) {
                return true;
            }

            if (itemData.unlockProsperity > 0 && itemData.unlockProsperity <= gameManager.prosperityLevel()) {
                return true;
            }

            if (itemData.unlockScenario && this.game.party.scenarios.find((scenarioData) => itemData.unlockScenario && scenarioData.index == itemData.unlockScenario.name && scenarioData.edition == itemData.unlockScenario.edition)) {
                return true;
            }

            if (!itemData.blueprint && !itemData.random && itemData.requiredBuilding && itemData.requiredBuilding != "alchemist" && this.game.party.buildings && this.game.party.buildings.find((buildingModel) => buildingModel.name == itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel)) {
                return true;
            }
        }

        if (settingsManager.settings.fhGhItems && gameManager.fhRules()) {
            if (itemData.edition == 'gh') {
                const tradingPost = this.game.party.buildings && this.game.party.buildings.find((buildingModel) => buildingModel.name == "trading-post" && buildingModel.state != 'wrecked');
                if (tradingPost) {
                    if (typeof itemData.id === 'number' && tradingPost.level >= 2 && [21, 37, 53, 93, 94, 106, 115].indexOf(itemData.id) != -1) {
                        return true;
                    } else if (typeof itemData.id === 'number' && tradingPost.level >= 3 && [46, 83, 84, 85, 86, 87, 88, 102, 110, 111, 120, 121, 122, 123, 126, 128].indexOf(itemData.id) != -1) {
                        return true;
                    } else if (typeof itemData.id === 'number' && tradingPost.level >= 4 && [17, 35, 47, 51, 62, 74, 77, 78, 79, 80, 81, 82, 117, 118, 119, 127, 129, 131].indexOf(itemData.id) != -1) {
                        return true;
                    }
                }
                return typeof itemData.id === 'number' && [10, 25, 72, 105, 109, 116].indexOf(itemData.id) != -1;
            } else if (itemData.edition == 'fc') {
                let fcItems = [];
                if (this.game.party.scenarios.find((model) => model.edition == 'fh' && model.index == "82" && !model.group)) {
                    fcItems.push(153, 159, 161);
                }

                if (this.game.party.buildings && this.game.party.buildings.find((buildingModel) => buildingModel.name == "enhancer" && buildingModel.level == 4 && buildingModel.state != 'wrecked')) {
                    fcItems.push(154, 155, 157, 163);
                }
            }
        }

        return false;
    }

    getItem(id: number | string, edition: string, all: boolean): ItemData | undefined {
        if (!isNaN(+id)) {
            id = +id;
        }
        return gameManager.itemData().find((itemData) => (itemData && itemData.id == id && itemData.edition == edition && (all || this.isItemAvailable(itemData, edition))));
    }

    maxItemIndex(edition: string): number {
        return Math.max(...this.getItems(edition, true).filter((itemData) => typeof itemData.id === 'number').map((itemData) => +itemData.id));
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
        return item.count && this.countAvailable(item) > 0 && !character.progress.items.find((identifier) => item && identifier.name == '' + item.id && identifier.edition == item.edition) && (!item.solo || item.edition == character.edition && item.solo == character.name) || false;
    }

    canBuy(item: ItemData, character: Character, cost: number = 0): boolean {
        if (character.tags.indexOf('new-character') == -1 && this.buyingDisabled()) {
            return false;
        }

        return item.cost && (item.cost + this.pricerModifier() + cost) <= character.progress.gold && this.canAdd(item, character) || false;
    }

    buyingDisabled(): boolean {
        return gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'trading-post' && buildingModel.level > 0 && buildingModel.state == "wrecked") != undefined;
    }

    canCraft(item: ItemData, character: Character, resources: Partial<Record<LootType, number>> = {}): boolean {
        if (this.craftingDisabled()) {
            return false;
        }

        let isCraftItem = false;
        let canCraft = true;
        if (item.resources) {
            Object.keys(item.resources).forEach(key => {
                const lootType = key as LootType;
                const requiredResource = ((item.resources[lootType] || 0) + (resources[lootType] || 0));
                if (requiredResource > 0) {
                    isCraftItem = true;
                }
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
                    } else {
                        isCraftItem = true;
                        if (!this.owned(requiredItem, character)) {
                            canCraft = canCraft && (this.canCraft(requiredItem, character, item.resources || {}) || this.canBuy(requiredItem, character, item.cost));
                        }
                    }
                }
            });
        }

        return canCraft && isCraftItem;
    }

    canDistill(item: ItemData) {
        if (gameManager.buildingsManager.distillAvailable) {
            if (item.resourcesAny && item.resourcesAny.length) {
                return item.resourcesAny.every((resource) => resource.herb_resources);
            } else if (item.resources && item.resources) {
                const resources: LootType[] = Object.keys(item.resources).map((value) => value as LootType);
                return resources.every((resource) => herbResourceLootTypes.indexOf(resource) != -1);
            }
        }
        return false;
    }

    craftingDisabled(): boolean {
        return gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'craftsman' && buildingModel.level > 0 && buildingModel.state == "wrecked") != undefined;
    }

    brewingDisabled(): boolean {
        return gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'alchemist' && buildingModel.level > 0 && buildingModel.state == "wrecked") != undefined;
    }

    itemUsable(itemData: ItemData) {
        if (itemData.requiredBuilding == 'alchemist' && this.brewingDisabled()) {
            return false;
        }
        return true;
    }

    itemSellValue(itemData: ItemData): number {
        if (itemData.cost) {
            return Math.floor(itemData.cost / 2);
        } else {
            let gold = 0;

            if (itemData.resourcesAny) {
                gold += itemData.resourcesAny.length;
            }

            if (itemData.resources) {
                Object.keys(itemData.resources).forEach(key => {
                    const lootType = key as LootType;
                    gold += (itemData.resources[lootType] || 0) * 2;
                });
            }

            if (itemData.requiredItems) {
                itemData.requiredItems.forEach(() => {
                    gold += 2;
                })
            }
            return gold;
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
                        } else if (this.canBuy(requiredItem, character)) {
                            character.progress.gold -= (item.cost + this.pricerModifier());
                        } else {
                            this.craftItemResources(requiredItem, character);
                        }
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

    addItemCount(itemData: ItemData) {
        if (this.game.party.campaignMode) {
            const assigend = gameManager.itemManager.assigned(itemData);
            const countAvailable = gameManager.itemManager.countAvailable(itemData);
            if (countAvailable + assigend < itemData.count) {
                const unlocked = gameManager.game.party.unlockedItems.find((identifier) => +identifier.name == itemData.id && identifier.edition == itemData.edition);
                if (!unlocked) {
                    gameManager.game.party.unlockedItems.push(new CountIdentifier('' + itemData.id, itemData.edition, 1));
                } else {
                    unlocked.count += 1;
                    if (unlocked.count == itemData.count) {
                        unlocked.count = -1;
                    }
                }
            }
        }
    }

    countAvailable(item: ItemData): number {
        const assigned = this.assigned(item);
        if (!this.isItemAvailable(item, item.edition, false)) {
            const unlocked = gameManager.game.party.unlockedItems.find((identifier) => +identifier.name == item.id && identifier.edition == item.edition);
            if (unlocked && unlocked.count > 0) {
                if (unlocked.count - assigned < 0) {
                    console.warn("More items assigend than available:", item);
                }
                return unlocked.count - assigned;
            } else if (!unlocked) {
                return -1;
            }
        }

        if (item.count - assigned < 0) {
            console.warn("More items assigend than available:", item);
        }

        return item.count - assigned;
    }

    isEquipped(item: ItemData, character: Character): boolean {
        return character.progress.equippedItems.find((identifier) => identifier.name == '' + item.id && identifier.edition == item.edition) != undefined;
    }

    toggleEquippedItem(item: ItemData, character: Character, force: boolean = false) {
        let equippedItems: ItemData[] = character.progress.equippedItems.map((identifier) => this.getItem(identifier.name, identifier.edition, true)).filter((itemData) => itemData).map((itemData) => itemData as ItemData);
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

                if (gameManager.trialsManager.favorsEnabled && gameManager.trialsManager.apply) {
                    allowed += gameManager.trialsManager.activeFavor('fh', 'capacity');
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
                equippedItems.filter((equipped) => equipped.slot == item.slot).forEach((equipped) => this.toggleEquippedItem(equipped, character));
                equippedItems = equippedItems.filter((equipped) => equipped.slot != item.slot);
            }

            equippedItems.push(item);
        }

        character.progress.equippedItems = equippedItems.map((itemData) => new AdditionalIdentifier(itemData.id + '', itemData.edition));

        if (item.minusOne && !gameManager.characterManager.ignoreNegativeItemEffects(character)) {
            character.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(character);
            gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
        }

        if (item.id == 3 && item.edition == 'fh') {
            if (equipIndex == -1) {
                character.maxHealth += 1;
            } else {
                character.maxHealth -= 1;
            }
            character.health = character.maxHealth;
        }
    }

    drawRandomItem(edition: string, blueprint: boolean = false, from: number = -1, to: number = -1): ItemData | undefined {
        let availableItems = this.getItems(undefined, true).filter((itemData) =>
            (!blueprint && itemData.random ||
                (blueprint && itemData.blueprint &&
                    (!itemData.requiredBuilding ||
                        gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel)))) &&
            (from == -1 || typeof itemData.id === 'number' && itemData.id >= from) &&
            (to == -1 || typeof itemData.id === 'number' && itemData.id <= to) &&
            !gameManager.game.party.unlockedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition) &&
            (itemData.edition == edition || gameManager.editionExtensions(edition).indexOf(itemData.edition) != -1));
        let item: ItemData | undefined = undefined;
        if (availableItems.length > 0) {
            item = availableItems[Math.floor(Math.random() * availableItems.length)];
        }
        return item;
    }

    applyEquippedItemEffects(character: Character) {
        character.immunities = [];
        character.progress.equippedItems.forEach((identifier) => {
            const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
            if (item) {
                gameManager.itemManager.applyItemEffects(character, item);
            }
        })
    }

    applyItemEffects(character: Character, item: ItemData, equip: boolean = false) {
        if (item.effects) {
            item.effects.forEach((itemEffect) => {
                if (!item.spent && !item.consumed || equip || itemEffect.always) {
                    this.applyItemEffect(character, itemEffect);
                }
            })
        }

        if (equip && item.summon) {
            let summon = new Summon(uuidv4(), item.summon.name, item.summon.cardId, character.level, 1, SummonColor.blue, item.summon);
            summon.init = false;
            gameManager.characterManager.addSummon(character, summon);
        }

        if (settingsManager.settings.characterItemsApply) {
            if (item.edition == 'fh' && item.id == 258 && character.health < character.maxHealth / 2) {
                character.health += 7;
                gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.curse));
            }
        }
    }

    applyItemEffect(character: Character, effect: ItemEffect) {
        switch (effect.type) {
            case ItemEffectType.heal:
                const heal = EntityValueFunction(effect.value);
                character.health += heal;
                gameManager.entityManager.addCondition(character, character, new Condition(ConditionName.heal, heal));
                gameManager.entityManager.applyCondition(character, character, ConditionName.heal, true);
                break;
            case ItemEffectType.damage:
                const damage = EntityValueFunction(effect.value);
                gameManager.entityManager.changeHealth(character, character, -damage);
                break;
            case ItemEffectType.condition:
                const condition: ConditionName = ("" + effect.value).split(':')[0] as ConditionName;
                let value: number = ("" + effect.value).split(':').length > 1 ? +("" + effect.value).split(':')[1] : 1;

                if (condition == ConditionName.bless) {
                    for (let i = 0; i < value; i++) {
                        if (gameManager.attackModifierManager.countUpcomingBlesses() < 10) {
                            gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
                        }
                    }
                } else if (condition == ConditionName.curse) {
                    for (let i = 0; i < value; i++) {
                        if (gameManager.attackModifierManager.countUpcomingCurses(false) < 10) {
                            gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.curse));
                        }
                    }
                } else {
                    gameManager.entityManager.addCondition(character, character, new Condition(condition, value));
                }
                break;
            case ItemEffectType.immune:
                const immunity: ConditionName = ("" + effect.value) as ConditionName;
                if (character.immunities.indexOf(immunity) == -1) {
                    character.immunities.push(immunity);
                }
                break;
            case ItemEffectType.element:
                const element: Element = ("" + effect.value) as Element;
                if (element != Element.wild) {
                    gameManager.game.elementBoard.forEach((elementModel) => {
                        if (elementModel.type == element) {
                            elementModel.state = ElementState.new;
                        }
                    })
                }
                break;
            case ItemEffectType.initiative:
                character.initiative += EntityValueFunction(effect.value);
                if (character.initiative < 1) {
                    character.initiative = 1;
                } else if (character.initiative > 99) {
                    character.initiative = 99;
                }
                break;
            case ItemEffectType.refreshSpent:
                character.progress.equippedItems.forEach((identifier) => {
                    if (identifier.tags && identifier.tags.indexOf(ItemFlags.spent) != -1) {
                        identifier.tags = identifier.tags.filter((tag) => tag != ItemFlags.spent);
                    }
                })
                break;
            case ItemEffectType.removeNegativeConditions:
                const negativeConditions: ConditionName[] = gameManager.conditionsForTypes(ConditionType.negative, ConditionType.character).map((condition) => condition.name);
                character.entityConditions = character.entityConditions.filter((entityCondition) => negativeConditions.indexOf(entityCondition.name) == -1);
                break;
        }
    }

    sortItems(a: ItemData, b: ItemData): number {
        if (typeof a.id === 'number' && typeof b.id === 'number') {
            return a.id - b.id;
        } else if (typeof a.id === 'number') {
            return -1;
        } else if (typeof b.id === 'number') {
            return 1;
        } else if (a.id < b.id) {
            return -1;
        } else {
            return 1;
        }
    }

}