import { ghsShuffleArray } from "src/app/ui/helper/Static";
import { Character } from "../model/Character";
import { ConditionName } from "../model/Condition";
import { TreasureData, TreasureReward, TreasureRewardType } from "../model/data/RoomData";
import { Game } from "../model/Game";
import { Identifier } from "../model/Identifier";
import { appliableLootTypes, fullLootDeck, Loot, LootDeck, LootDeckConfig, LootType } from "../model/Loot";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class LootManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  drawCard(deck: LootDeck, character: Character | undefined) {
    deck.current++;
    if (deck.current >= deck.cards.length) {
      deck.current = deck.cards.length - 1;
    }

    if (settingsManager.settings.applyLoot && character) {
      const loot = deck.cards[deck.current];
      if (loot) {
        character.lootCards = character.lootCards || [];
        if (loot.type == LootType.money || loot.type == LootType.special1 || loot.type == LootType.special2) {
          character.loot += this.getValue(loot);
        }
        character.lootCards.push(deck.current);
      }
    }
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

  lootTreasure(character: Character, index: number, edition: string): string[] {
    let rewardResults: string[] = [];
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == edition);
    if (editionData && editionData.treasures) {
      index = index - (editionData.treasureOffset || 0);
      if (index >= 0 && index < editionData.treasures.length) {
        const tresureString = editionData.treasures[index];
        const treasure = new TreasureData(tresureString, index);
        if (treasure.rewards) {
          treasure.rewards.forEach((reward) => {
            this.applyTreasureReward(character, reward, edition)
          });
        }
      } else {
        console.warn("Invalid treasure index: '" + index + "' for Edition " + edition);
      }
    }
    return rewardResults;
  }

  applyTreasureReward(character: Character, reward: TreasureReward, edition: string): string {
    let result = "";
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
            gameManager.entityManager.applyCondition(character, condition as ConditionName)
          })
        }
        break;
      case TreasureRewardType.item:
      case TreasureRewardType.itemDesign:
        if (reward.value) {
          ('' + reward.value).split('+').forEach((itemValue) => {
            let itemEdition = edition;
            let itemId = -1
            if (isNaN(+itemValue)) {
              itemEdition = itemValue.split('-')[0];
              itemId = +itemValue.split('-')[1]
            } else {
              itemId = +itemValue;
            }
            const item = gameManager.item(itemId, itemEdition);
            if (item) {
              const identifier = new Identifier('' + item.id, item.edition);
              if (reward.type == "item") {
                character.progress.items.push(identifier);
                // TODO: sell duplicate item!
              } else {
                gameManager.game.party.unlockedItems.push(identifier);
              }
            }
          })
        }
        break;
      case TreasureRewardType.itemBlueprint:
      case TreasureRewardType.itemFh:
        if (reward.value) {
          const item = gameManager.item(+reward.value, edition);
          if (item) {
            const identifier = new Identifier('' + item.id, item.edition);
            if (reward.type == "itemFh") {
              character.progress.items.push(identifier);
              // TODO: sell duplicate item!
            } else {
              gameManager.game.party.unlockedItems.push(identifier);
            }
          }
        }
        break;
      case TreasureRewardType.calenderSection:
        if (reward.value && typeof reward.value === 'string' && reward.value.split('-').length > 1) {
          const section = reward.value[0];
          const week = gameManager.game.party.weeks + (+reward.value[1]);
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
          for (let i = 0; i < reward.value; i++) {
            this.drawCard(gameManager.game.lootDeck, character);
          }
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
          deck.cards.push(loot);
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
