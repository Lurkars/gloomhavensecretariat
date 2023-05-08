import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { Condition, ConditionName } from "../model/Condition";
import { ItemData } from "../model/data/ItemData";
import { TreasureData, TreasureReward, TreasureRewardType } from "../model/data/RoomData";
import { Game } from "../model/Game";
import { Identifier } from "../model/data/Identifier";
import { appliableLootTypes, fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "../model/data/Loot";
import { GameScenarioModel } from "../model/Scenario";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class LootManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  drawCard(deck: LootDeck, character: Character | undefined): ItemData | undefined {
    let result: ItemData | undefined = undefined;
    deck.current++;
    if (deck.current >= deck.cards.length) {
      deck.current = deck.cards.length - 1;
    }

    const loot = deck.cards[deck.current];
    if (loot) {
      if (settingsManager.settings.applyLoot && character) {
        result = this.applyLoot(loot, character, deck.current);
      }

      if (loot.type == LootType.random_item && this.game.scenario && this.game.party.campaignMode) {
        this.game.party.randomItemLooted.push(new GameScenarioModel(this.game.scenario.index, this.game.scenario.edition, this.game.scenario.group));
      }
    }

    return result;
  }

  applyLoot(loot: Loot, character: Character, index: number): ItemData | undefined {
    let result: ItemData | undefined = undefined;
    character.lootCards = character.lootCards || [];
    if (loot.type == LootType.money || loot.type == LootType.special1 || loot.type == LootType.special2) {
      character.loot += this.getValue(loot);
    } else if (loot.type == LootType.random_item && this.game.scenario && this.game.party.campaignMode) {
      let availableItems = gameManager.itemData(this.game.scenario.edition).filter((itemData) => itemData.random && !gameManager.game.party.unlockedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition));

      if (availableItems.length > 0) {
        let itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
        let item: Identifier | undefined = new Identifier('' + itemData.id, itemData.edition);
        while (availableItems.length > 0 && gameManager.game.party.unlockedItems.find((unlocked) => item && unlocked.name == item.name && unlocked.edition == item.edition)) {
          availableItems = availableItems.filter((available) => item && (available.id + '' != item.name || available.edition != item.edition));
          if (availableItems.length > 0) {
            itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
            item = new Identifier('' + itemData.id, itemData.edition);
          } else {
            item = undefined;
          }
        }
        if (item) {
          if (character.progress.items.find((existing) => item && existing.name == item.name && existing.edition == item.edition)) {
            character.progress.gold += this.itemSellValue(itemData);
          } else {
            character.progress.items.push(item);
          }
          result = itemData;
        }
      }
      if (availableItems.length == 0) {
        character.loot += 3;
      }
    }

    character.lootCards.push(index);

    return result;
  }

  shuffleDeck(deck: LootDeck) {
    deck.current = -1;
    ghsShuffleArray(deck.cards);
  }

  addCharacterLoot(character: Character, loot: Loot) {
    const value = this.getValue(loot);
    if (loot.type == LootType.money || loot.type == LootType.special1 || loot.type == LootType.special2) {
      character.loot += value;
    } else if (appliableLootTypes.indexOf(loot.type) != -1) {
      const current = character.progress.loot[loot.type] || 0;
      if (current + value >= 0) {
        character.progress.loot[loot.type] = current + value;
      }
    }
  }

  lootTreasure(character: Character, index: number, edition: string): string[][] {
    let rewardResults: string[][] = [];
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == edition);
    if (editionData && editionData.treasures) {
      index = index - (editionData.treasureOffset || 0);
      if (index >= 0 && index < editionData.treasures.length) {
        const tresureString = editionData.treasures[index];
        const treasure = new TreasureData(tresureString, index);
        if (treasure.rewards) {
          treasure.rewards.forEach((reward) => {
            rewardResults.push(this.applyTreasureReward(character, reward, edition));
          });
        }
      } else {
        console.warn("Invalid treasure index: '" + index + "' for Edition " + edition);
      }
    }
    return rewardResults;
  }

  hasTreasure(character: Character, treasure: string | number, index: number): boolean {
    return character.treasures.some((value) => value == treasure || typeof value === 'string' && (value.startsWith(treasure + ':') || treasure == 'G' && value == 'G-' + index));
  }

  applyTreasureReward(character: Character, reward: TreasureReward, edition: string): string[] {
    let result: string[] = [];
    switch (reward.type) {
      case TreasureRewardType.gold:
      case TreasureRewardType.goldFh:
        if (typeof reward.value === 'number') {
          character.progress.gold += reward.value;
        }
        break;
      case TreasureRewardType.experience:
      case TreasureRewardType.experienceFh:
        if (typeof reward.value === 'number') {
          character.progress.experience += reward.value;
        }
        break;
      case TreasureRewardType.battleGoal:
        if (typeof reward.value === 'number') {
          character.progress.battleGoals += reward.value;
        }
        break;
      case TreasureRewardType.damage:
        if (typeof reward.value === 'number') {
          character.health -= reward.value;
        } else if (reward.value == "terrain") {
          character.health -= gameManager.levelManager.terrain();
        }
        if (character.health <= 0) {
          character.exhausted = true;
          character.off = true;
          character.active = false;
        }
        break;
      case TreasureRewardType.heal:
        if (typeof reward.value === 'number') {
          character.health += reward.value;
          if (character.health > character.maxHealth) {
            character.health = character.maxHealth;
          }
        }
        break;
      case TreasureRewardType.loot:
        if (typeof reward.value === 'number') {
          character.loot += reward.value;
        }
        break;
      case TreasureRewardType.resource:
        if (typeof reward.value === 'string') {
          reward.value.split('+').forEach((resourceValue) => {
            const resource = resourceValue.split('-')[0] as LootType;
            const value = +resourceValue.split('-')[1];
            character.progress.loot[resource] = (character.progress.loot[resource] || 0) + value;
          })
        }
        break;
      case TreasureRewardType.condition:
        if (typeof reward.value === 'string') {
          reward.value.split('+').forEach((condition) => {
            if (!gameManager.entityManager.hasCondition(character, new Condition(condition as ConditionName))) {
              gameManager.entityManager.addCondition(character, new Condition(condition as ConditionName), character.active, character.off);
            }
          })
        }
        break;
      case TreasureRewardType.item:
      case TreasureRewardType.itemDesign:
      case TreasureRewardType.itemBlueprint:
      case TreasureRewardType.itemFh:
        if (reward.value) {
          ('' + reward.value).split('+').forEach((itemValue) => {
            let itemEdition = edition;
            let itemId = -1
            if (isNaN(+itemValue)) {
              itemId = +itemValue.split('-')[0]
              itemEdition = itemValue.split('-')[1];
            } else {
              itemId = +itemValue;
            }
            const item = gameManager.item(itemId, itemEdition, true);
            if (item) {
              const identifier = new Identifier('' + item.id, item.edition);
              if (reward.type == TreasureRewardType.item || reward.type == TreasureRewardType.itemFh) {
                if (character.progress.items.find((existing) => existing.name == identifier.name && existing.edition == identifier.edition)) {
                  character.progress.gold += this.itemSellValue(item);
                } else {
                  character.progress.items.push(identifier);
                }
              } else {
                gameManager.game.party.unlockedItems.push(identifier);
              }
            }
          })
        }
        break;
      case TreasureRewardType.calenderSection:
        if (reward.value && typeof reward.value === 'string' && reward.value.split('-').length > 1) {
          const section = reward.value.split('-')[0];
          const week = gameManager.game.party.weeks + (+reward.value.split('-')[1]);
          if (!gameManager.game.party.weekSections[week]) {
            gameManager.game.party.weekSections[week] = [];
          }
          gameManager.game.party.weekSections[week]?.push(section);
        }
        break;
      case TreasureRewardType.campaignSticker:
        if (reward.value && typeof reward.value === 'string') {
          gameManager.game.party.campaignStickers.push(reward.value);
        }
        break;
      case TreasureRewardType.partyAchievement:
        if (reward.value && typeof reward.value === 'string') {
          gameManager.game.party.achievementsList.push(reward.value);
        }
        break;
      case TreasureRewardType.lootCards:
        if (typeof reward.value === 'number') {
          gameManager.game.lootDeck.active = true;
          for (let i = 0; i < reward.value; i++) {
            this.drawCard(gameManager.game.lootDeck, character);
          }
          gameManager.uiChange.emit();
        }
        break;
      case TreasureRewardType.scenario:
        if (reward.value) {
          const scenario = new GameScenarioModel('' + reward.value, edition, undefined, false, "", []);
          if (!gameManager.game.party.manualScenarios.find((scenarioModel) => scenarioModel.index == scenario.index && scenarioModel.edition == scenario.edition && scenarioModel.group == scenario.group && !scenarioModel.custom) && !gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == scenario.index && scenarioModel.edition == scenario.edition && scenarioModel.group == scenario.group && !scenarioModel.custom)) {
            gameManager.game.party.manualScenarios.push(scenario);
          }
        }
        break;
      case TreasureRewardType.randomScenario:
        let availableScenarios = gameManager.scenarioData(edition).filter((scenarioData) => scenarioData.random && !gameManager.game.party.manualScenarios.find((scenarioModel) => scenarioModel.index == scenarioData.index && scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && !scenarioModel.custom) && !gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == scenarioData.index && scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && !scenarioModel.custom));
        if (availableScenarios.length > 0) {
          let scenarioData = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
          let scenario: GameScenarioModel | undefined = {} = new GameScenarioModel('' + scenarioData.index, scenarioData.edition, scenarioData.group, false, "", []);
          while (availableScenarios.length > 0 && gameManager.game.party.manualScenarios.find((manual) => scenario && manual.index == scenario.index && manual.edition == scenario.edition && manual.group == scenario.group)) {
            availableScenarios = availableScenarios.filter((available) => scenario && (available.edition != scenario.edition || available.index != scenario.edition || available.group != scenario.group));
            if (availableScenarios.length > 0) {
              scenarioData = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
              scenario = new GameScenarioModel('' + scenarioData.index, scenarioData.edition, scenarioData.group, false, "", []);
            } else {
              scenario = undefined;
            }
          }
          if (scenario) {
            gameManager.game.party.manualScenarios.push(scenario);
            result.push(scenarioData.index, scenarioData.name);
          }
        }

        if (availableScenarios.length == 0 && gameManager.fhRules()) {
          gameManager.game.party.inspiration += 1;
        }
        break;
      case TreasureRewardType.randomItemDesign:
      case TreasureRewardType.randomItemBlueprint:
        let availableItems = gameManager.itemData(edition, true).filter((itemData) => (reward.type == TreasureRewardType.randomItemDesign && itemData.random || reward.type == TreasureRewardType.randomItemBlueprint && itemData.blueprint && (!itemData.requiredBuilding || gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel))) && !gameManager.game.party.unlockedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition));
        if (typeof reward.value === 'string' && reward.value.indexOf('-') != -1) {
          const from = + reward.value.split('-')[0];
          const to = + reward.value.split('-')[1];
          availableItems = availableItems.filter((itemData) => itemData.id >= from && itemData.id <= to);
        }

        if (availableItems.length > 0) {
          let itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
          let item: Identifier | undefined = new Identifier('' + itemData.id, itemData.edition);
          while (availableItems.length > 0 && gameManager.game.party.unlockedItems.find((unlocked) => item && unlocked.name == item.name && unlocked.edition == item.edition)) {
            availableItems = availableItems.filter((available) => item && (available.id + '' != item.name || available.edition != item.edition));
            if (availableItems.length > 0) {
              itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
              item = new Identifier('' + itemData.id, itemData.edition);
            } else {
              item = undefined;
            }
          }
          if (item) {
            gameManager.game.party.unlockedItems.push(item);
            result.push('' + itemData.id, itemData.name);
          }
        }

        if (availableItems.length == 0 && reward.type == TreasureRewardType.randomItemBlueprint) {
          gameManager.game.party.inspiration += 1;
        }
        break;
    }

    return result;
  }

  getValue(loot: Loot): number {
    const charCount = gameManager.characterManager.characterCount();
    let value = loot.value4P;
    if (charCount <= 2) {
      value = loot.value2P;
    } else if (charCount == 3) {
      value = loot.value3P;
    }

    value += loot.enhancements;

    return value;
  }

  itemSellValue(itemData: ItemData): number {
    if (itemData.cost) {
      return Math.ceil(itemData.cost / 2);
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

  draw(): void {
    this.shuffleDeck(this.game.lootDeck);
  }

  fullLootDeck(): Loot[] {
    let availableCards: Loot[] = JSON.parse(JSON.stringify(fullLootDeck));

    this.game.lootDeckEnhancements.forEach((loot) => {
      if (loot.enhancements > 0) {
        const replacement = availableCards.find((other) => other.type == loot.type && other.value2P == loot.value2P && other.value3P == loot.value3P && other.value4P == loot.value4P && other.enhancements == 0);
        if (!replacement) {
          console.warn('Enhancement of non-available loot card: ' + loot.type + ':' + loot.value4P + ':' + loot.value3P + ':' + loot.value2P);
          return;
        }

        availableCards.splice(availableCards.indexOf(replacement), 1, JSON.parse(JSON.stringify(loot)));
      }
    })

    return availableCards;
  }

  apply(deck: LootDeck, config: LootDeckConfig = {}) {
    deck.cards = [];
    Object.values(LootType).forEach((type) => {
      const availableTypes: Loot[] = ghsShuffleArray(this.fullLootDeck().filter((loot) => loot.type == type)) as Loot[];
      const count = Math.min(Math.max(config[type] || 0), availableTypes.length);
      if (type != LootType.special1 && type != LootType.special2) {
        for (let i = 0; i < count; i++) {
          const loot: Loot = availableTypes[i];
          if (type != LootType.random_item || !this.randomItemLooted()) {
            deck.cards.push(loot);
          }
        }
      } else if (count > 0) {
        const loot: Loot = availableTypes[0];
        deck.cards.push(loot);
        if (this.game.lootDeckFixed.indexOf(loot.type) == -1) {
          this.game.lootDeckFixed.push(loot.type);
        }
      } else {
        this.game.lootDeckFixed = this.game.lootDeckFixed.filter((lootType) => lootType != type);
        deck.cards = deck.cards.filter((loot) => loot.type != type);
      }
    })
    this.shuffleDeck(deck);
  }

  randomItemLooted(): boolean {
    return gameManager.game.party.randomItemLooted.find((model) => this.game.scenario && model.index == this.game.scenario.index && model.edition == this.game.scenario.edition && model.group == this.game.scenario.group) != undefined;
  }

  valueLabel(loot: Loot): string {
    if (loot.value4P == loot.value3P && loot.value3P == loot.value2P) {
      return "" + (loot.value4P > 0 ? loot.value4P : "")
    } else if (loot.value4P == loot.value3P && loot.value3P != loot.value2P) {
      return "%game.loot.player.3-4% +" + loot.value4P + "/%game.loot.player.2% +" + loot.value2P;
    } else if (loot.value4P != loot.value3P && loot.value3P == loot.value2P) {
      return "%game.loot.player.4% +" + loot.value4P + "/%game.loot.player.2-3% +" + loot.value2P;
    } else {
      return "%game.loot.player.4% +" + loot.value4P + "/%game.loot.player.3% +" + loot.value3P + "/%game.loot.player.2% +" + loot.value2P;
    }
  }

}
