import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { SelectResourceResult } from "../model/data/BuildingData";
import { Condition, ConditionName } from "../model/data/Condition";
import { CountIdentifier, Identifier } from "../model/data/Identifier";
import { ItemData } from "../model/data/ItemData";
import { appliableLootTypes, fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "../model/data/Loot";
import { TreasureData, TreasureReward, TreasureRewardType } from "../model/data/RoomData";
import { Game } from "../model/Game";
import { GameScenarioModel } from "../model/Scenario";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class LootManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  drawCard(deck: LootDeck, character: Character | undefined = undefined): ItemData | undefined {
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
    } else if (loot.type == LootType.random_item && this.game.scenario && this.game.party.campaignMode && settingsManager.settings.characterItems && settingsManager.settings.applyLootRandomItem) {
      result = gameManager.itemManager.drawRandomItem(this.game.scenario.edition);
      if (!result) {
        character.loot += 3;
      }
    }

    character.lootCards.push(index);

    if (gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled) {
      const trialCharacter = this.game.figures.find((figure) => figure instanceof Character && figure != character && figure.progress.trial && figure.progress.trial.edition == 'fh' && figure.progress.trial.name == '351') as Character;
      if (trialCharacter) {
        gameManager.entityManager.changeHealth(trialCharacter, trialCharacter, - Math.ceil(this.game.level / 3));
      }
    }

    return result;
  }

  shuffleDeck(deck: LootDeck, onlyUpcoming: boolean = false) {
    const current = deck.current;
    let restoreCards: Loot[] = onlyUpcoming && current > -1 ? deck.cards.splice(0, current + 1) : [];
    deck.current = -1;
    ghsShuffleArray(deck.cards);
    if (onlyUpcoming) {
      deck.current = current;
      deck.cards.unshift(...restoreCards);
    }
  }

  getTotal(deck: LootDeck, type: LootType): number {
    const cards = deck.cards.filter((loot) => loot.type == type);
    if (cards.length == 0) {
      return 0;
    }
    return cards.map((loot) => this.getValue(loot)).reduce((a, b) => a + b);
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
      index = index < 0 ? index : index - (editionData.treasureOffset || 0);
      if (index >= 0 && index < editionData.treasures.length) {
        const tresureString = editionData.treasures[index];
        const treasure = new TreasureData(tresureString, index);
        if (treasure.rewards) {
          treasure.rewards.forEach((reward) => {
            rewardResults.push(this.applyTreasureReward(character, reward, edition));
          });
        }
      } else if (index < 0 && editionData.treasures.length + index + 1 > 0) {
        const tresureString = editionData.treasures[editionData.treasures.length + index + 1];
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
              gameManager.entityManager.addCondition(character, character, new Condition(condition as ConditionName));
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
            const item = gameManager.itemManager.getItem(itemId, itemEdition, true);
            if (item) {
              const identifier = new CountIdentifier('' + item.id, item.edition);
              if (reward.type == TreasureRewardType.item || reward.type == TreasureRewardType.itemFh) {
                if (settingsManager.settings.characterItems || settingsManager.settings.characterSheet) {
                  if (character.progress.items.find((existing) => existing.name == identifier.name && existing.edition == identifier.edition)) {
                    character.progress.gold += gameManager.itemManager.itemSellValue(item);
                  } else {
                    character.progress.items.push(identifier);
                  }
                }
                gameManager.itemManager.addItemCount(item);
              } else {
                gameManager.game.party.unlockedItems.push(identifier);
              }
            }
          })
        }
        break;
      case TreasureRewardType.calendarSection:
        if (reward.value && typeof reward.value === 'string' && reward.value.split('-').length > 1) {
          const section = reward.value.split('-')[0];
          const week = gameManager.game.party.weeks + (+reward.value.split('-')[1]);
          gameManager.game.party.weekSections[week] = [...(gameManager.game.party.weekSections[week] || []), section];
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
            this.drawCard(gameManager.game.lootDeck);
          }
          gameManager.uiChange.emit();
        }
        break;
      case TreasureRewardType.scenario:
        if (reward.value) {
          const scenario = new GameScenarioModel('' + reward.value, edition);
          if (!gameManager.game.party.manualScenarios.find((scenarioModel) => scenarioModel.index == scenario.index && scenarioModel.edition == scenario.edition && scenarioModel.group == scenario.group && !scenarioModel.custom) && !gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == scenario.index && scenarioModel.edition == scenario.edition && scenarioModel.group == scenario.group && !scenarioModel.custom)) {
            gameManager.game.party.manualScenarios.push(scenario);
          }
        }
        break;
      case TreasureRewardType.randomScenario:
        if (settingsManager.settings.treasuresLootScenario) {
          let scenarioData = gameManager.scenarioManager.drawRandomScenario(edition);
          if (scenarioData) {
            gameManager.game.party.manualScenarios.push(new GameScenarioModel('' + scenarioData.index, scenarioData.edition, scenarioData.group));
            result.push(scenarioData.index, gameManager.scenarioManager.scenarioTitle(scenarioData));
          }
        }
        break;
      case TreasureRewardType.randomScenarioFh:
        if (settingsManager.settings.treasuresLootScenario) {
          let sectionData = gameManager.scenarioManager.drawRandomScenarioSection(edition);
          if (sectionData) {
            gameManager.game.party.conclusions.push(new GameScenarioModel('' + sectionData.index, sectionData.edition, sectionData.group));
            result.push(sectionData.index, gameManager.scenarioManager.scenarioTitle(sectionData, true), sectionData.unlocks ? sectionData.unlocks.map((unlock) => '%data.scenarioNumber:' + unlock + '%').join(', ') : '');
          }
        }
        break;
      case TreasureRewardType.randomItem:
      case TreasureRewardType.randomItemDesign:
      case TreasureRewardType.randomItemBlueprint:
        if (settingsManager.settings.treasuresLootItem) {
          let from = -1;
          let to = -1;
          if (typeof reward.value === 'string' && reward.value.indexOf('-') != -1) {
            from = + reward.value.split('-')[0];
            to = + reward.value.split('-')[1];
          }

          let itemData: ItemData | undefined = gameManager.itemManager.drawRandomItem(edition, reward.type == TreasureRewardType.randomItemBlueprint, from, to);

          if (itemData) {
            if (reward.type == TreasureRewardType.randomItem) {
              character.progress.items.push(new Identifier('' + itemData.id, itemData.edition));
            } else {
              gameManager.game.party.unlockedItems.push(new CountIdentifier('' + itemData.id, itemData.edition));
            }
            result.push('' + itemData.id, 'data.items.' + itemData.name, itemData.edition);
          } else {
            gameManager.game.party.inspiration += 1;
          }
        }
        break;
    }

    return result;
  }

  getValue(loot: Loot, enhancements: boolean = true): number {
    const charCount = gameManager.characterManager.characterCount();
    let value = loot.value4P;
    if (charCount <= 2) {
      value = loot.value2P;
    } else if (charCount == 3) {
      value = loot.value3P;
    }

    if (enhancements) {
      value += loot.enhancements;
    }

    return value;
  }

  firstRound(): void {
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
        if (this.game.lootDeckFixed.indexOf(loot.type) == -1 && (type != LootType.special2 || !this.game.party.conclusions.find((value) => value.edition == 'fh' && value.index == '128.5')) && (type != LootType.special1 || !this.game.party.conclusions.find((value) => value.edition == 'fh' && value.index == '133.4'))) {
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

  applySelectResources(result: SelectResourceResult) {
    result.characters.forEach((character, index) => {
      if (result.characterSpent[index].gold) {
        character.progress.gold -= result.characterSpent[index].gold;
      }
      if (result.characterSpent[index].hide) {
        character.progress.loot[LootType.hide] = (character.progress.loot[LootType.hide] || 0) - (result.characterSpent[index].hide);
      }
      if (result.characterSpent[index].lumber) {
        character.progress.loot[LootType.lumber] = (character.progress.loot[LootType.lumber] || 0) - (result.characterSpent[index].lumber);
      }
      if (result.characterSpent[index].metal) {
        character.progress.loot[LootType.metal] = (character.progress.loot[LootType.metal] || 0) - (result.characterSpent[index].metal);
      }
    })
    if (result.fhSupportSpent.hide) {
      gameManager.game.party.loot[LootType.hide] = (gameManager.game.party.loot[LootType.hide] || 0) - (result.fhSupportSpent.hide);
    }
    if (result.fhSupportSpent.lumber) {
      gameManager.game.party.loot[LootType.lumber] = (gameManager.game.party.loot[LootType.lumber] || 0) - (result.fhSupportSpent.lumber);
    }
    if (result.fhSupportSpent.metal) {
      gameManager.game.party.loot[LootType.metal] = (gameManager.game.party.loot[LootType.metal] || 0) - (result.fhSupportSpent.metal);
    }
  }

}