import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { Element, ElementState } from 'src/app/game/model/data/Element';
import { AdditionalIdentifier, CountIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemEffect, ItemEffectType, ItemFlags, ItemSlot } from 'src/app/game/model/data/ItemData';
import { getLootClass, herbResourceLootTypes, LootClass, LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';
import { Summon, SummonColor } from 'src/app/game/model/Summon';

export class ItemManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  itemEditions(edition: string | undefined = undefined): string[] {
    return gameManager.editionManager.editionData
      .filter(
        (editionData) =>
          settingsManager.settings.editions.includes(editionData.edition) &&
          (gameManager.editionManager.isEditionRelevant(editionData.edition, edition) ||
            (edition === 'fh' &&
              ((settingsManager.settings.fhGhItems && (editionData.edition === 'gh' || editionData.edition === 'fc')) ||
                (settingsManager.settings.fhGh2eItems && editionData.edition === 'gh2e'))) ||
            (edition === 'gh2e' && settingsManager.settings.gh2eFhItems && editionData.edition === 'fh')) &&
          editionData.items &&
          editionData.items.length > 0
      )
      .flatMap((editionData) => editionData.edition);
  }

  getItems(edition: string | undefined, all: boolean = false): ItemData[] {
    return gameManager.editionManager
      .itemData()
      .filter((itemData) => (all && (!edition || itemData.edition === edition)) || this.isItemAvailable(itemData, edition));
  }

  isItemAvailable(itemData: ItemData, edition: string | undefined, withUnlocks: boolean = true): boolean {
    if (!this.game.party.campaignMode) {
      return gameManager.editionManager.isEditionRelevant(itemData.edition, edition);
    }

    if (
      gameManager.editionManager.isEditionRelevant(itemData.edition, edition) &&
      this.game.party.filteredItems.some((identifier) => identifier.edition === itemData.edition && identifier.name === '' + itemData.id)
    ) {
      return false;
    }

    if (gameManager.editionManager.isEditionRelevant(itemData.edition, edition)) {
      if (
        withUnlocks &&
        this.game.party.unlockedItems.find((identifier) => identifier.name === '' + itemData.id && identifier.edition === itemData.edition)
      ) {
        return true;
      }

      if (itemData.unlockProsperity > 0 && itemData.unlockProsperity <= gameManager.campaignManager.prosperityLevel()) {
        return true;
      }

      if (
        itemData.unlockScenario &&
        this.game.party.scenarios.find(
          (scenarioData) =>
            itemData.unlockScenario &&
            scenarioData.index === itemData.unlockScenario.name &&
            scenarioData.edition === itemData.unlockScenario.edition
        )
      ) {
        return true;
      }

      if (
        !itemData.blueprint &&
        !itemData.random &&
        itemData.requiredBuilding &&
        itemData.requiredBuilding !== 'alchemist' &&
        this.game.party.buildings &&
        this.game.party.buildings.find(
          (buildingModel) => buildingModel.name === itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel
        )
      ) {
        return true;
      }
    }

    if (settingsManager.settings.fhGhItems && gameManager.fhRules() && typeof itemData.id === 'number') {
      if (itemData.edition === 'gh') {
        const tradingPost =
          this.game.party.buildings &&
          this.game.party.buildings.find((buildingModel) => buildingModel.name === 'trading-post' && buildingModel.state !== 'wrecked');
        if (tradingPost) {
          if (tradingPost.level >= 2 && [21, 37, 53, 93, 94, 106, 115].includes(itemData.id)) {
            return true;
          } else if (
            tradingPost.level >= 3 &&
            [46, 83, 84, 85, 86, 87, 88, 102, 110, 111, 120, 121, 122, 123, 126, 128].includes(itemData.id)
          ) {
            return true;
          } else if (
            tradingPost.level >= 4 &&
            [17, 35, 47, 51, 62, 74, 77, 78, 79, 80, 81, 82, 117, 118, 119, 127, 129, 131].includes(itemData.id)
          ) {
            return true;
          }
        }
        return [10, 25, 72, 105, 109, 116].includes(itemData.id);
      } else if (itemData.edition === 'fc') {
        const fcItems = [];
        if (this.game.party.scenarios.find((model) => model.edition === 'fh' && model.index === '82' && !model.group)) {
          fcItems.push(153, 159, 161);
        }

        if (
          this.game.party.buildings &&
          this.game.party.buildings.find(
            (buildingModel) => buildingModel.name === 'enhancer' && buildingModel.level === 4 && buildingModel.state !== 'wrecked'
          )
        ) {
          fcItems.push(154, 155, 157, 163);
        }
      }
    }

    if (settingsManager.settings.fhGh2eItems && gameManager.fhRules() && itemData.edition === 'gh2e' && typeof itemData.id === 'number') {
      const tradingPost =
        this.game.party.buildings &&
        this.game.party.buildings.find((buildingModel) => buildingModel.name === 'trading-post' && buildingModel.state !== 'wrecked');
      if (tradingPost) {
        if (
          tradingPost.level >= 2 &&
          [
            23, 24, 31, 32, 33, 38, 41, 51, 70, 81, 82, 83, 84, 85, 86, 92, 94, 95, 98, 100, 104, 107, 110, 112, 113, 116, 120, 129, 131,
            140, 141, 143
          ].includes(itemData.id)
        ) {
          return true;
        } else if (
          tradingPost.level >= 3 &&
          [
            39, 40, 44, 46, 48, 71, 74, 75, 77, 78, 88, 93, 99, 103, 106, 108, 114, 115, 117, 118, 119, 130, 135, 139, 144, 148, 151, 152
          ].includes(itemData.id)
        ) {
          return true;
        } else if (
          tradingPost.level >= 4 &&
          [59, 61, 64, 67, 72, 76, 79, 80, 89, 109, 111, 121, 128, 132, 133, 134, 136, 138, 142, 145, 147].includes(itemData.id)
        ) {
          return true;
        }
      }
      return [9, 10, 43, 96, 97, 122, 123, 124, 125, 126, 127, 137, 150].includes(itemData.id);
    }

    if (settingsManager.settings.gh2eFhItems && gameManager.gh2eRules() && itemData.edition === 'fh' && typeof itemData.id === 'number') {
      const prosperity = gameManager.campaignManager.prosperityLevel();

      if (
        prosperity >= 3 &&
        [158, 159, 170, 171, 172, 173, 179, 183, 185, 186, 190, 195, 210, 211, 223, 228, 233, 235, 240, 243].includes(itemData.id)
      ) {
        return true;
      }
      if (
        prosperity >= 5 &&
        [
          167, 169, 174, 175, 177, 180, 182, 187, 191, 192, 193, 197, 198, 204, 205, 208, 214, 221, 227, 229, 238, 239, 206, 178, 201
        ].includes(itemData.id)
      ) {
        return true;
      }
      if (
        prosperity >= 7 &&
        [162, 194, 199, 163, 181, 184, 188, 202, 203, 207, 209, 212, 215, 217, 218, 222, 224, 226, 234].includes(itemData.id)
      ) {
        return true;
      }

      if (prosperity >= 9 && [234, 166, 151, 168, 189, 200, 213, 216, 219, 220, 225, 236, 237, 242, 244].includes(itemData.id)) {
        return true;
      }
    }

    return false;
  }

  getItem(id: number | string, edition: string, all: boolean): ItemData | undefined {
    if (!isNaN(+id)) {
      id = +id;
    }
    return gameManager.editionManager
      .itemData()
      .find(
        (itemData) => itemData && itemData.id === id && itemData.edition === edition && (all || this.isItemAvailable(itemData, edition))
      );
  }

  maxItemIndex(edition: string): number {
    return Math.max(
      ...this.getItems(edition, true)
        .filter((itemData) => typeof itemData.id === 'number')
        .map((itemData) => +itemData.id)
    );
  }

  pricerModifier(): number {
    if (this.game.party.reputation >= 0) {
      return Math.ceil((this.game.party.reputation - 2) / 4) * -1;
    } else {
      return Math.floor((this.game.party.reputation + 2) / 4) * -1;
    }
  }

  assigned(item: ItemData): number {
    return (
      this.game.figures
        .filter((figure) => figure instanceof Character && figure.progress && figure.progress.items)
        .flatMap((figure) => (figure as Character).progress.items)
        .filter((identifier) => item && identifier.name === '' + item.id && identifier.edition === item.edition).length +
      this.game.party.specialItems.filter((identifier) => item && identifier.name === '' + item.id && identifier.edition === item.edition)
        .length
    );
  }

  owned(item: ItemData, character: Character): boolean {
    return (
      character.progress.items.find((identifier) => item && identifier.name === '' + item.id && identifier.edition === item.edition) !=
      undefined
    );
  }

  canAdd(item: ItemData, character: Character): boolean {
    return (
      (item.count &&
        this.countAvailable(item) > 0 &&
        !character.progress.items.find((identifier) => item && identifier.name === '' + item.id && identifier.edition === item.edition) &&
        (!item.solo || (item.edition === character.edition && item.solo === character.name))) ||
      false
    );
  }

  canBuy(item: ItemData, character: Character, cost: number = 0): boolean {
    if (!character.tags.includes('new-character') && this.buyingDisabled()) {
      return false;
    }

    return (item.cost && item.cost + this.pricerModifier() + cost <= character.progress.gold && this.canAdd(item, character)) || false;
  }

  buyingDisabled(warning: boolean = true): boolean {
    return (
      gameManager.fhRules() &&
      this.game.party.campaignMode &&
      ((warning &&
        this.game.party.buildings.find(
          (buildingModel) => buildingModel.name === 'trading-post' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
        ) === undefined) ||
        (!warning &&
          this.game.party.buildings.find(
            (buildingModel) => buildingModel.name === 'trading-post' && buildingModel.level > 0 && buildingModel.state === 'wrecked'
          ) !== undefined))
    );
  }

  canCraft(item: ItemData, character: Character | undefined, resources: Partial<Record<LootType, number>> = {}): boolean {
    if (this.craftingDisabled()) {
      return false;
    }

    let isCraftItem = false;
    let canCraft = true;
    if (item.resources) {
      Object.keys(item.resources).forEach((key) => {
        const lootType = key as LootType;
        const requiredResource = (item.resources[lootType] || 0) + (resources[lootType] || 0);
        if (requiredResource > 0) {
          isCraftItem = true;
        }
        const fhShareResources =
          getLootClass(lootType) === LootClass.herb_resources ||
          (settingsManager.settings.fhShareResources && getLootClass(lootType) === LootClass.material_resources);
        canCraft =
          canCraft &&
          ((!!character && character.progress.loot[lootType]) || 0) + ((fhShareResources && this.game.party.loot[lootType]) || 0) >=
            requiredResource;
      });
    }

    if (item.resourcesAny) {
      let requiredResource = 0;
      item.resourcesAny.forEach((value) => {
        if (!!value[LootClass.herb_resources]) {
          requiredResource += value[LootClass.herb_resources];
        }
      });

      if (requiredResource > 0) {
        isCraftItem = true;
        canCraft =
          canCraft &&
          herbResourceLootTypes.some(
            (lootType) =>
              ((!!character && character.progress.loot[lootType]) || 0) + (this.game.party.loot[lootType] || 0) >= requiredResource
          );
      }
    }

    if (item.requiredItems) {
      item.requiredItems.forEach((itemId) => {
        if (itemId !== item.id) {
          const requiredItem = this.getItem(itemId, item.edition, true);
          if (!requiredItem) {
            console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ')');
          } else {
            isCraftItem = true;
            if (!!character && !this.owned(requiredItem, character)) {
              canCraft =
                canCraft &&
                (this.canCraft(requiredItem, character, item.resources || {}) || this.canBuy(requiredItem, character, item.cost || 0));
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
        return resources.every((resource) => herbResourceLootTypes.includes(resource));
      }
    }
    return false;
  }

  craftingDisabled(): boolean {
    return (
      gameManager.fhRules() &&
      this.game.party.campaignMode &&
      this.game.party.buildings.find(
        (buildingModel) => buildingModel.name === 'craftsman' && buildingModel.level > 0 && buildingModel.state === 'wrecked'
      ) !== undefined
    );
  }

  brewingDisabled(): boolean {
    return (
      gameManager.fhRules() &&
      this.game.party.campaignMode &&
      this.game.party.buildings.find(
        (buildingModel) => buildingModel.name === 'alchemist' && buildingModel.level > 0 && buildingModel.state === 'wrecked'
      ) !== undefined
    );
  }

  brewedItem(recipe: LootType[]): ItemData | undefined {
    if (recipe.length < 2) {
      return undefined;
    }
    const duplicates = recipe.filter((herb, index, self) => self.indexOf(herb) === index).length !== recipe.length;
    return this.getItems(gameManager.editionManager.currentEdition(), true).find(
      (itemData) =>
        (!itemData.requiredItems || !itemData.requiredItems.length) &&
        itemData.requiredBuilding === 'alchemist' &&
        (recipe.length < 3 ? itemData.requiredBuildingLevel < 3 : itemData.requiredBuildingLevel >= 3) &&
        (duplicates
          ? !itemData.resources
          : !!itemData.resources &&
            herbResourceLootTypes.every(
              (herb) => itemData.resources && recipe.filter((value) => value === herb).length === (itemData.resources[herb] || 0)
            ))
    );
  }

  brewPayment(
    brewer: Character | undefined,
    recipe: LootType[]
  ): { characterSpent: Partial<Record<LootType, number>>; partySpent: Partial<Record<LootType, number>> } {
    const characterSpent: Partial<Record<LootType, number>> = {};
    const partySpent: Partial<Record<LootType, number>> = {};
    recipe.forEach((herb) => {
      if (brewer && (brewer.progress.loot[herb] || 0) > (characterSpent[herb] || 0)) {
        characterSpent[herb] = (characterSpent[herb] || 0) + 1;
      } else {
        partySpent[herb] = (partySpent[herb] || 0) + 1;
      }
    });
    return { characterSpent, partySpent };
  }

  canBrewPotion(
    recipe: LootType[],
    target: Character,
    brewer: Character | undefined = undefined,
    characterSpent: Partial<Record<LootType, number>> = {},
    partySpent: Partial<Record<LootType, number>> = {},
    force: boolean = false
  ): boolean {
    const item = this.brewedItem(recipe);
    if (
      !item ||
      !this.game.figures.includes(target) ||
      (brewer && !this.game.figures.includes(brewer)) ||
      recipe.length > (this.brewingHerbs() || 3) ||
      this.owned(item, target)
    ) {
      return false;
    }
    if (force) {
      return true;
    }
    return (
      !this.brewingDisabled() &&
      herbResourceLootTypes.every((herb) => {
        const characterValue = characterSpent[herb] || 0;
        const partyValue = partySpent[herb] || 0;
        return (
          characterValue >= 0 &&
          partyValue >= 0 &&
          characterValue + partyValue === recipe.filter((value) => value === herb).length &&
          (!characterValue || (!!brewer && characterValue <= (brewer.progress.loot[herb] || 0))) &&
          partyValue <= (this.game.party.loot[herb] || 0)
        );
      })
    );
  }

  brewPotion(
    recipe: LootType[],
    target: Character,
    brewer: Character | undefined = undefined,
    characterSpent: Partial<Record<LootType, number>> = {},
    partySpent: Partial<Record<LootType, number>> = {},
    force: boolean = false
  ): ItemData | undefined {
    const item = this.brewedItem(recipe);
    if (!item || !this.canBrewPotion(recipe, target, brewer, characterSpent, partySpent, force)) {
      return undefined;
    }
    if (!force) {
      herbResourceLootTypes.forEach((herb) => {
        if (partySpent[herb]) {
          this.game.party.loot[herb] = (this.game.party.loot[herb] || 0) - (partySpent[herb] || 0);
        }
        if (brewer && characterSpent[herb]) {
          brewer.progress.loot[herb] = (brewer.progress.loot[herb] || 0) - (characterSpent[herb] || 0);
        }
      });
    }
    this.setItemUnlocked(item, true);
    this.grantItem(item, target);
    return item;
  }

  brewingHerbs(): number {
    if (gameManager.fhRules() && this.game.party.campaignMode && this.game.party.buildings) {
      const alchemist = this.game.party.buildings.find((buildingModel) => buildingModel.name === 'alchemist');
      if (alchemist && alchemist.level) {
        return alchemist.level < 3 ? 2 : 3;
      }
    }
    return 0;
  }

  itemUsable(itemData: ItemData) {
    if (itemData.requiredBuilding === 'alchemist' && this.brewingDisabled()) {
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
        Object.keys(itemData.resources).forEach((key) => {
          const lootType = key as LootType;
          gold += (itemData.resources[lootType] || 0) * 2;
        });
      }

      if (itemData.requiredItems) {
        itemData.requiredItems.forEach(() => {
          gold += 2;
        });
      }
      return gold;
    }
  }

  grantItem(item: ItemData, character: Character) {
    if (!!item.specialFh && item.specialFh.length) {
      this.game.party.specialItems = this.game.party.specialItems || [];
      this.game.party.specialItems.push(new Identifier(item.id, item.edition));
    } else {
      character.progress.items.push(new Identifier(item.id, item.edition));
      gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.item, '' + item.id);
      if (item.slot) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.itemType, item.slot as string);
      }
    }
  }

  canAddItem(item: ItemData, character: Character, force: boolean = false): boolean {
    return this.game.figures.includes(character) && (force ? !this.owned(item, character) : this.canAdd(item, character));
  }

  addItem(item: ItemData, character: Character, force: boolean = false): boolean {
    if (!this.canAddItem(item, character, force)) {
      return false;
    }
    this.grantItem(item, character);
    return true;
  }

  buyItem(item: ItemData, character: Character): boolean {
    if (!this.canBuy(item, character)) {
      return false;
    }
    character.progress.gold -= item.cost + this.pricerModifier();
    this.grantItem(item, character);
    return true;
  }

  craftItemResources(item: ItemData, character: Character) {
    if (item.resources) {
      Object.keys(item.resources).forEach((key) => {
        const lootType = key as LootType;
        const requiredResource = item.resources[lootType] || 0;
        if (
          getLootClass(lootType) === LootClass.herb_resources ||
          (settingsManager.settings.fhShareResources && getLootClass(lootType) === LootClass.material_resources)
        ) {
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

    if (item.resourcesAny) {
      let requiredResource = 0;
      item.resourcesAny.forEach((value) => {
        if (!!value[LootClass.herb_resources]) {
          requiredResource += value[LootClass.herb_resources];
        }
      });

      if (requiredResource > 0) {
        let herb: LootType | undefined;
        herbResourceLootTypes.forEach((lootType) => {
          const lootTypeValue = ((!!character && character.progress.loot[lootType]) || 0) + (this.game.party.loot[lootType] || 0);
          const herbTypeValue = (!!herb && ((!!character && character.progress.loot[herb]) || 0) + (this.game.party.loot[herb] || 0)) || 0;
          if (lootTypeValue >= requiredResource && lootTypeValue > herbTypeValue) {
            herb = lootType;
          }
        });

        if (!!herb) {
          if ((character.progress.loot[herb] || 0) < requiredResource) {
            requiredResource -= character.progress.loot[herb] || 0;
            character.progress.loot[herb] = 0;
            this.game.party.loot[herb] = (this.game.party.loot[herb] || 0) - requiredResource;
          } else {
            character.progress.loot[herb] = (character.progress.loot[herb] || 0) - requiredResource;
          }
        }
      }
    }

    if (item.requiredItems) {
      item.requiredItems.forEach((itemId) => {
        if (itemId !== item.id) {
          const requiredItem = this.getItem(itemId, item.edition, true);
          if (!requiredItem) {
            console.error("Missing required item '" + itemId + "' for item '" + item.id + "' (" + item.name + ')');
          } else if (requiredItem) {
            const charItem = character.progress.items.find(
              (identifier) => identifier.name === '' + requiredItem.id && identifier.edition === requiredItem.edition
            );
            if (charItem) {
              const index = character.progress.items.indexOf(charItem);
              character.progress.items.splice(index, 1);
              character.progress.equippedItems = character.progress.equippedItems.filter(
                (identifier) => identifier.name !== '' + requiredItem.id || identifier.edition !== requiredItem.edition
              );
            } else if (this.canBuy(requiredItem, character)) {
              character.progress.gold -= requiredItem.cost + this.pricerModifier();
            } else {
              this.craftItemResources(requiredItem, character);
            }
          }
        }
      });
    }
  }

  craftItem(item: ItemData, character: Character): boolean {
    if (!this.canCraft(item, character)) {
      return false;
    }
    this.craftItemResources(item, character);
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.craftableItems);
    this.grantItem(item, character);
    return true;
  }

  canRemoveItem(itemData: ItemData, character: Character): boolean {
    return this.owned(itemData, character);
  }

  removeItem(itemData: ItemData, character: Character): boolean {
    if (!this.canRemoveItem(itemData, character)) {
      return false;
    }
    character.progress.items = character.progress.items.filter(
      (identifier, index, self) =>
        index !== self.findIndex((other) => other.name === '' + itemData.id && other.edition === itemData.edition)
    );
    character.progress.equippedItems = character.progress.equippedItems.filter(
      (identifier) => identifier.name !== '' + itemData.id || identifier.edition !== itemData.edition
    );
    return true;
  }

  canSellItem(itemData: ItemData, character: Character): boolean {
    return this.owned(itemData, character) && this.itemSellValue(itemData) > 0;
  }

  sellItem(itemData: ItemData, character: Character): boolean {
    if (!this.canSellItem(itemData, character)) {
      return false;
    }
    const sellValue = this.itemSellValue(itemData);
    this.removeItem(itemData, character);
    character.progress.gold += sellValue;
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.gold, undefined, sellValue);
    return true;
  }

  distillResources(item: ItemData): LootType[] {
    if (item.resourcesAny && item.resourcesAny.length) {
      return herbResourceLootTypes;
    }
    return Object.keys(item.resources || {}).map((resource) => resource as LootType);
  }

  canDistillItem(item: ItemData, character: Character, resource: LootType): boolean {
    return this.owned(item, character) && this.canDistill(item) && this.distillResources(item).includes(resource);
  }

  distillItem(item: ItemData, character: Character, resource: LootType): boolean {
    if (!this.canDistillItem(item, character, resource)) {
      return false;
    }
    this.removeItem(item, character);
    character.progress.loot[resource] = (character.progress.loot[resource] || 0) + 1;
    return true;
  }

  canShareItem(item: ItemData, character: Character, target: Character): boolean {
    return (
      settingsManager.settings.characterItemsShareHouseRule &&
      character !== target &&
      this.game.figures.includes(target) &&
      this.owned(item, character) &&
      !this.owned(item, target)
    );
  }

  shareItem(item: ItemData, character: Character, target: Character): boolean {
    if (!this.canShareItem(item, character, target)) {
      return false;
    }
    this.removeItem(item, character);
    this.grantItem(item, target);
    return true;
  }

  addItemCount(itemData: ItemData) {
    if (this.game.party.campaignMode) {
      const assigend = gameManager.itemManager.assigned(itemData);
      const countAvailable = gameManager.itemManager.countAvailable(itemData);
      if (countAvailable + assigend < itemData.count) {
        const unlocked = this.game.party.unlockedItems.find(
          (identifier) => +identifier.name === itemData.id && identifier.edition === itemData.edition
        );
        if (!unlocked) {
          this.game.party.unlockedItems.push(new CountIdentifier(itemData.id, itemData.edition, 1));
        } else {
          unlocked.count += 1;
          if (unlocked.count === itemData.count) {
            unlocked.count = -1;
          }
        }
      }
    }
  }

  countAvailable(item: ItemData): number {
    const assigned = this.assigned(item);
    if (!this.isItemAvailable(item, item.edition, false)) {
      const unlocked = this.game.party.unlockedItems.find(
        (identifier) => +identifier.name === item.id && identifier.edition === item.edition
      );
      if (unlocked && unlocked.count > 0) {
        if (unlocked.count - assigned < 0) {
          console.warn('More items assigend than available:', item);
        }
        return unlocked.count - assigned;
      } else if (!unlocked) {
        return -1;
      }
    }

    if (item.count - assigned < 0) {
      console.warn('More items assigend than available:', item);
    }

    return item.count - assigned;
  }

  unlockedItem(item: ItemData): CountIdentifier | undefined {
    return (this.game.party.unlockedItems || []).find(
      (identifier) => identifier.name === '' + item.id && identifier.edition === item.edition
    );
  }

  setItemUnlocked(item: ItemData, unlocked: boolean) {
    this.game.party.unlockedItems = this.game.party.unlockedItems || [];
    const unlockedItem = this.unlockedItem(item);
    if (unlockedItem && !unlocked) {
      this.game.party.unlockedItems = this.game.party.unlockedItems.filter(
        (identifier) => identifier.name !== '' + item.id || identifier.edition !== item.edition
      );
    } else if (!unlockedItem && unlocked) {
      this.game.party.unlockedItems.push(new CountIdentifier(item.id, item.edition));
    }
  }

  // -1: all copies of the item are available
  canSetUnlockedItemCount(item: ItemData, count: number): boolean {
    const unlockedItem = this.unlockedItem(item);
    return !!unlockedItem && unlockedItem.count !== count && Number.isInteger(count) && (count === -1 || (count > 0 && count < item.count));
  }

  setUnlockedItemCount(item: ItemData, count: number): boolean {
    const unlockedItem = this.unlockedItem(item);
    if (!unlockedItem || !this.canSetUnlockedItemCount(item, count)) {
      return false;
    }
    unlockedItem.count = count;
    return true;
  }

  nextUnlockedItemCount(item: ItemData): number {
    const unlockedItem = this.unlockedItem(item);
    const next = !unlockedItem || unlockedItem.count < 0 ? 1 : unlockedItem.count + 1;
    return next >= item.count ? -1 : next;
  }

  itemFiltered(item: ItemData): boolean {
    return this.game.party.filteredItems.some((identifier) => identifier.edition === item.edition && identifier.name === '' + item.id);
  }

  setItemFiltered(item: ItemData, filtered: boolean) {
    if (this.itemFiltered(item) === filtered) {
      return;
    }
    if (filtered) {
      this.game.party.filteredItems.push(new Identifier(item.id, item.edition));
    } else {
      this.game.party.filteredItems = this.game.party.filteredItems.filter(
        (identifier) => identifier.edition !== item.edition || identifier.name !== '' + item.id
      );
    }
  }

  equippedItem(item: ItemData, character: Character): AdditionalIdentifier | undefined {
    return character.progress.equippedItems.find((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition);
  }

  equipBlocked(item: ItemData, character: Character): boolean {
    return (
      gameManager.bbRules() &&
      !this.isEquipped(item, character) &&
      typeof item.id === 'number' &&
      character.progress.equippedItems.some(
        (identifier) => +identifier.name === (+item.id % 2 === 0 ? +item.id - 1 : +item.id + 1) && identifier.edition === item.edition
      )
    );
  }

  brewingBlocked(): boolean {
    return this.brewingDisabled() || gameManager.scenarioManager.scenarioRunning();
  }

  canToggleEquippedItem(item: ItemData, character: Character, force: boolean = false): boolean {
    if (force) {
      return true;
    }
    if (gameManager.scenarioManager.scenarioRunning()) {
      return false;
    }
    return (
      this.isEquipped(item, character) || this.owned(item, character) || (gameManager.bbRules() && !this.equipBlocked(item, character))
    );
  }

  toggleEquippedItemWithOwnership(item: ItemData, character: Character, force: boolean = false): boolean {
    const owned = this.owned(item, character);
    if (!this.toggleEquippedItem(item, character, force)) {
      return false;
    }
    if (gameManager.bbRules()) {
      if (!this.isEquipped(item, character) && owned) {
        this.removeItem(item, character);
      } else if (this.isEquipped(item, character) && !owned) {
        this.grantItem(item, character);
      }
    }
    return true;
  }

  itemFlagCount(item: ItemData, character: Character, flag: ItemFlags): number {
    const equipped = this.equippedItem(item, character);
    return (equipped && equipped.tags && equipped.tags.filter((tag) => tag === flag).length) || 0;
  }

  itemFlagBlocked(item: ItemData, force: boolean = false): boolean {
    return (
      !force && gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1502, 'fh') && item.slot === ItemSlot.small
    );
  }

  setItemFlag(item: ItemData, character: Character, flag: ItemFlags, value: boolean, force: boolean = false) {
    const equipped = this.equippedItem(item, character);
    if (!equipped || this.itemFlagBlocked(item, force)) {
      return;
    }
    equipped.tags = equipped.tags || [];
    if (equipped.tags.includes(flag) === value) {
      return;
    }
    if (value) {
      const wasConsumed = equipped.tags.includes(ItemFlags.consumed);
      if (!force && gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1507, 'fh') && flag === ItemFlags.spent) {
        equipped.tags.push(ItemFlags.consumed);
      } else {
        equipped.tags.push(flag);
      }
      if (!wasConsumed && equipped.tags.includes(ItemFlags.consumed) && item.slot) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(
          character,
          PersonalQuestAutotrackType.itemConsumed,
          item.slot as string
        );
      }
    } else {
      equipped.tags = equipped.tags.filter((tag) => tag !== flag);
      if (flag === ItemFlags.spent) {
        equipped.tags = equipped.tags.filter((tag) => tag !== ItemFlags.slot && tag !== ItemFlags.slotBack);
      }
    }

    if (
      (flag === ItemFlags.consumed || flag === ItemFlags.spent) &&
      equipped.tags.includes(flag) &&
      settingsManager.settings.characterItemsApply
    ) {
      this.applyItemEffects(character, item, true);
    }
  }

  setItemFlagCount(item: ItemData, character: Character, flag: ItemFlags, index: number) {
    const equipped = this.equippedItem(item, character);
    if (!equipped) {
      return;
    }
    equipped.tags = equipped.tags || [];
    const count = this.itemFlagCount(item, character, flag);
    if (count <= index) {
      for (let i = count; i <= index; i++) {
        equipped.tags.push(flag);
      }
      if (flag === ItemFlags.slot && this.itemFlagCount(item, character, flag) === item.slots) {
        if (item.spent && !this.itemFlagCount(item, character, ItemFlags.spent)) {
          equipped.tags.push(ItemFlags.spent);
        } else if (item.consumed && !this.itemFlagCount(item, character, ItemFlags.consumed)) {
          equipped.tags.push(ItemFlags.consumed);
        }
      }
    } else {
      for (let i = index; i < count; i++) {
        equipped.tags.splice(equipped.tags.indexOf(flag), 1);
      }
    }
  }

  isEquipped(item: ItemData, character: Character): boolean {
    return (
      character.progress.equippedItems.find((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition) !=
      undefined
    );
  }

  toggleEquippedItem(item: ItemData, character: Character, force: boolean = false): boolean {
    if (!this.canToggleEquippedItem(item, character, force)) {
      return false;
    }
    let equippedItems: ItemData[] = character.progress.equippedItems
      .map((identifier) => this.getItem(identifier.name, identifier.edition, true))
      .filter((itemData) => itemData)
      .map((itemData) => itemData as ItemData);
    const equipIndex = equippedItems.indexOf(item);
    if (force && equipIndex === -1) {
      equippedItems.push(item);
    } else if (force) {
      equippedItems.splice(equipIndex, 1);
    } else if (equipIndex !== -1) {
      equippedItems.splice(equipIndex, 1);
      const allowed = Math.ceil(character.level / 2);
      const smallEquipped = equippedItems.filter((itemData) => itemData.slot === ItemSlot.small).length;
      if (item.id === 16 && item.edition === 'gh' && smallEquipped >= allowed) {
        for (let i = 0; i < smallEquipped - allowed; i++) {
          const equipped = equippedItems.find((itemData) => itemData.slot === ItemSlot.small);
          if (equipped) {
            equippedItems.splice(equippedItems.indexOf(equipped), 1);
          }
        }
      }
    } else {
      const drifterAdditionalHand = character.name === 'drifter' && character.edition === 'fh' && character.progress.perks[11];
      if (item.slot === ItemSlot.small) {
        let allowed = Math.ceil(character.level / 2);
        if (
          equippedItems.find(
            (itemData) => (itemData.id === 16 && itemData.edition === 'gh') || (itemData.id === 60 && itemData.edition === 'fh')
          )
        ) {
          allowed += 2;
        }
        if (equippedItems.find((itemData) => itemData.id === 132 && itemData.edition === 'fh')) {
          allowed += 1;
        }

        if (gameManager.trialsManager.favorsEnabled && gameManager.trialsManager.apply) {
          allowed += gameManager.trialsManager.activeFavor('fh', 'capacity');
        }

        if (equippedItems.filter((itemData) => itemData.slot === item.slot).length >= allowed) {
          const equipped = equippedItems.find((itemData) => itemData.slot === item.slot);
          if (equipped) {
            equippedItems.splice(equippedItems.indexOf(equipped), 1);
          }
        }
      } else if (item.slot === ItemSlot.onehand) {
        const twoHand = equippedItems.find((equipped) => equipped.slot === ItemSlot.twohand);
        if (twoHand && !drifterAdditionalHand) {
          equippedItems = equippedItems.filter((equipped) => equipped.slot !== ItemSlot.twohand);
        }
        if (equippedItems.filter((equipped) => equipped.slot === item.slot).length > (drifterAdditionalHand ? (twoHand ? 0 : 2) : 1)) {
          const equipped = equippedItems.find((equipped) => equipped.slot === item.slot);
          if (equipped) {
            equippedItems.splice(equippedItems.indexOf(equipped), 1);
          }
        }
      } else if (item.slot === ItemSlot.twohand) {
        equippedItems = equippedItems.filter((equipped) => equipped.slot !== item.slot);
        if (drifterAdditionalHand) {
          while (equippedItems.filter((equipped) => equipped.slot === ItemSlot.onehand).length > 1) {
            const equipped = equippedItems.find((equipped) => equipped.slot === ItemSlot.onehand);
            if (equipped) {
              equippedItems.splice(equippedItems.indexOf(equipped), 1);
            }
          }
        } else {
          equippedItems = equippedItems.filter((equipped) => equipped.slot !== ItemSlot.onehand);
        }
      } else {
        equippedItems.filter((equipped) => equipped.slot === item.slot).forEach((equipped) => this.toggleEquippedItem(equipped, character));
        equippedItems = equippedItems.filter((equipped) => equipped.slot !== item.slot);
      }

      equippedItems.push(item);
    }

    const previousIdentifiers = [...character.progress.equippedItems];
    character.progress.equippedItems = equippedItems.map((itemData) => {
      const existing = previousIdentifiers.find(
        (identifier) => '' + identifier.name === '' + itemData.id && identifier.edition === itemData.edition
      );
      if (existing) {
        previousIdentifiers.splice(previousIdentifiers.indexOf(existing), 1);
        return existing;
      }
      return new AdditionalIdentifier(itemData.id, itemData.edition);
    });

    if (item.minusOne && !gameManager.characterManager.ignoreNegativeItemEffects(character)) {
      character.attackModifierDeck = gameManager.attackModifierBuildManager.buildCharacterAttackModifierDeck(character);
      gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
    }

    if (item.id === 3 && item.edition === 'fh') {
      if (equipIndex === -1) {
        character.maxHealth += 1;
      } else {
        character.maxHealth -= 1;
      }
      character.health = character.maxHealth;
    }
    return true;
  }

  drawRandomItem(edition: string, blueprint: boolean = false, from: number = -1, to: number = -1): ItemData | undefined {
    return this.drawRandomItemsBatch(edition, 1, blueprint, from, to)[0];
  }

  drawRandomItemsBatch(edition: string, count: number, blueprint: boolean = false, from: number = -1, to: number = -1): ItemData[] {
    const ranged = from !== -1 || to !== -1;
    return gameManager.randomManager
      .shuffle(
        this.getItems(undefined, true).filter(
          (itemData) =>
            ((!blueprint && (itemData.random || ranged)) ||
              (blueprint &&
                itemData.blueprint &&
                (!itemData.requiredBuilding ||
                  this.game.party.buildings.find(
                    (buildingModel) =>
                      buildingModel.name === itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel
                  )))) &&
            (from === -1 || (typeof itemData.id === 'number' && itemData.id >= from)) &&
            (to === -1 || (typeof itemData.id === 'number' && itemData.id <= to)) &&
            !this.game.party.unlockedItems.find(
              (identifier) => identifier.name === '' + itemData.id && identifier.edition === itemData.edition
            ) &&
            gameManager.editionManager.isEditionRelevant(itemData.edition, edition)
        )
      )
      .slice(0, count);
  }

  applyEquippedItemEffects(character: Character, immunitiesOnly: boolean = false) {
    character.immunities = [];
    character.progress.equippedItems.forEach((identifier) => {
      const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
      if (item) {
        gameManager.itemManager.applyItemEffects(character, item, item.consumed === 'initial', immunitiesOnly);
        if (item.consumed === 'initial') {
          identifier.tags = [...(identifier.tags || []), ItemFlags.consumed];
        }
      }
    });
  }

  applyItemEffects(character: Character, item: ItemData, equip: boolean = false, immunitiesOnly: boolean = false) {
    if (item.effects) {
      item.effects.forEach((itemEffect) => {
        if ((!item.spent && !item.consumed) || equip || itemEffect.always) {
          if (itemEffect.type === ItemEffectType.immune || !immunitiesOnly) {
            this.applyItemEffect(character, itemEffect);
          }
        }
      });
    }

    if (equip && item.summon) {
      const summon = new Summon(
        gameManager.randomManager.uuid(),
        item.summon.name,
        item.summon.cardId,
        character.level,
        1,
        SummonColor.blue,
        item.summon
      );
      summon.init = false;
      gameManager.summonManager.addSummon(character, summon);
    }

    if (settingsManager.settings.characterItemsApply) {
      if (item.edition === 'fh' && item.id === 258 && character.health < character.maxHealth / 2) {
        character.health += 7;
        gameManager.conditionManager.addCondition(character, character, new Condition(ConditionName.curse));
      }
    }
  }

  applyItemEffect(character: Character, effect: ItemEffect) {
    switch (effect.type) {
      case ItemEffectType.heal:
        const heal = EntityValueFunction(effect.value);
        character.health += heal;
        const healCondition = new EntityCondition(ConditionName.heal, heal);
        gameManager.conditionManager.addCondition(character, character, new Condition(ConditionName.heal, heal));
        gameManager.conditionManager.applyCondition(character, character, healCondition, true);
        break;
      case ItemEffectType.damage:
        const damage = EntityValueFunction(effect.value);
        gameManager.entityManager.changeHealth(character, character, -damage, true);
        break;
      case ItemEffectType.condition:
        const condition: ConditionName = ('' + effect.value).split(':')[0] as ConditionName;
        const value: number = ('' + effect.value).split(':').length > 1 ? +('' + effect.value).split(':')[1] : 1;
        gameManager.conditionManager.addCondition(character, character, new Condition(condition, value));
        break;
      case ItemEffectType.immune:
        const immunity: ConditionName = ('' + effect.value) as ConditionName;
        if (!character.immunities.includes(immunity)) {
          character.immunities.push(immunity);
        }
        break;
      case ItemEffectType.element:
        const element: Element = ('' + effect.value) as Element;
        if (element !== Element.wild) {
          this.game.elementBoard.forEach((elementModel) => {
            if (elementModel.type === element) {
              elementModel.state = ElementState.new;
              gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.element, element);
            }
          });
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
          if (identifier.tags && identifier.tags.includes(ItemFlags.spent)) {
            identifier.tags = identifier.tags.filter((tag) => tag !== ItemFlags.spent);
          }
        });
        break;
      case ItemEffectType.removeNegativeConditions:
        const negativeConditions: ConditionName[] = gameManager.conditionManager
          .conditionsForTypes(ConditionType.negative, ConditionType.character)
          .map((condition) => condition.name);
        character.entityConditions = character.entityConditions.filter(
          (entityCondition) => !negativeConditions.includes(entityCondition.name)
        );
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
