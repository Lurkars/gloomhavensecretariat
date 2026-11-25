import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';
import { CountIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { TreasureData, TreasureReward, TreasureRewardType } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Game } from 'src/app/game/model/Game';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

export class TreasureManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  hasPartyTreasure(edition: string, treasure: string | number): boolean {
    return (this.game.party.treasures || []).some((identifier) => identifier.edition === edition && identifier.name === '' + treasure);
  }

  setPartyTreasure(edition: string, treasure: string | number, value: boolean) {
    if (!value) {
      this.game.party.treasures = this.game.party.treasures.filter(
        (identifier) => identifier.edition !== edition || identifier.name !== '' + treasure
      );
    } else if (!this.hasPartyTreasure(edition, treasure)) {
      this.game.party.treasures.push(new Identifier('' + treasure, edition));
    }
  }

  lootTreasure(character: Character, index: number, edition: string): string[][] {
    const rewardResults: string[][] = [];
    const editionData = gameManager.editionManager.editionData.find((editionData) => editionData.edition === edition);
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

    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.treasures);
    return rewardResults;
  }

  canLootScenarioTreasure(character: Character, treasure: 'G' | number, index: number): boolean {
    return (
      this.game.figures.includes(character) &&
      !character.absent &&
      (treasure === 'G' || typeof treasure === 'number') &&
      !this.game.figures.some((figure) => figure instanceof Character && this.hasTreasure(figure, treasure, index))
    );
  }

  lootScenarioTreasure(character: Character, treasure: 'G' | number, index: number, edition: string): string[][] {
    if (!this.canLootScenarioTreasure(character, treasure, index)) {
      return [];
    }
    let rewardResults: string[][] = [];
    if (treasure !== 'G' && settingsManager.settings.treasuresLoot) {
      rewardResults = this.lootTreasure(character, treasure - 1, edition);
    }
    character.treasures = character.treasures || [];
    character.treasures.push(
      treasure === 'G'
        ? 'G-' + index
        : rewardResults.some((rewardResult) => rewardResult.length > 0)
          ? treasure + ':' + rewardResults.map((reward) => reward.join('+')).join('|')
          : treasure
    );
    if (typeof treasure === 'number') {
      this.game.party.treasures.push(new Identifier(treasure, edition));
    }
    return rewardResults;
  }

  canRemoveScenarioTreasure(character: Character, treasure: string | number): boolean {
    return (character.treasures || []).includes(treasure);
  }

  removeScenarioTreasure(character: Character, treasure: string | number, edition: string): boolean {
    const index = character.treasures.indexOf(treasure);
    if (index === -1) {
      return false;
    }
    character.treasures.splice(index, 1);
    const parsed = this.parseScenarioTreasure(treasure);
    if (!parsed.goal && !isNaN(parsed.number)) {
      this.game.party.treasures = this.game.party.treasures.filter(
        (value) => value.edition !== edition || value.name !== '' + parsed.number
      );
    }
    return true;
  }

  parseScenarioTreasure(treasure: string | number): { goal: boolean; goalIndex: number; number: number } {
    if (typeof treasure === 'number') {
      return { goal: false, goalIndex: -1, number: treasure };
    }
    if (treasure.startsWith('G-')) {
      return { goal: true, goalIndex: +treasure.replace('G-', ''), number: NaN };
    }
    return { goal: false, goalIndex: -1, number: +treasure.split(':')[0] };
  }

  hasTreasure(character: Character, treasure: string | number, index: number): boolean {
    return character.treasures.some(
      (value) =>
        value === treasure ||
        (typeof value === 'string' && (value.startsWith(treasure + ':') || (treasure === 'G' && value === 'G-' + index)))
    );
  }

  applyTreasureReward(character: Character, reward: TreasureReward, edition: string): string[] {
    const result: string[] = [];
    switch (reward.type) {
      case TreasureRewardType.gold:
      case TreasureRewardType.goldFh:
        if (typeof reward.value === 'number') {
          character.progress.gold += reward.value;
          if (reward.value > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(
              character,
              PersonalQuestAutotrackType.gold,
              undefined,
              reward.value
            );
          }
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
          if (reward.value > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(
              character,
              PersonalQuestAutotrackType.battleGoals,
              undefined,
              reward.value
            );
          }
        }
        break;
      case TreasureRewardType.damage:
        if (typeof reward.value === 'number') {
          gameManager.entityManager.changeHealth(character, character, -reward.value, true);
        } else if (reward.value === 'terrain') {
          gameManager.entityManager.changeHealth(character, character, -gameManager.levelManager.terrain(), true);
        }
        break;
      case TreasureRewardType.heal:
        if (typeof reward.value === 'number') {
          gameManager.entityManager.changeHealth(character, character, reward.value);
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
          });
        }
        break;
      case TreasureRewardType.condition:
        if (typeof reward.value === 'string') {
          reward.value.split('+').forEach((condition) => {
            gameManager.conditionManager.addCondition(character, character, new Condition(condition as ConditionName));
          });
        }
        break;
      case TreasureRewardType.item:
      case TreasureRewardType.itemDesign:
      case TreasureRewardType.itemBlueprint:
      case TreasureRewardType.itemFh:
        if (reward.value) {
          ('' + reward.value).split('+').forEach((itemValue) => {
            let itemEdition = edition;
            let itemId = -1;
            if (isNaN(+itemValue)) {
              itemId = +itemValue.split('-')[0];
              itemEdition = itemValue.split('-')[1];
            } else {
              itemId = +itemValue;
            }
            const item = gameManager.itemManager.getItem(itemId, itemEdition, true);
            if (item) {
              const identifier = new CountIdentifier(item.id, item.edition);
              if (reward.type === TreasureRewardType.item || reward.type === TreasureRewardType.itemFh) {
                if (settingsManager.settings.characterItems || settingsManager.settings.characterSheet) {
                  if (
                    character.progress.items.find(
                      (existing) => existing.name === identifier.name && existing.edition === identifier.edition
                    )
                  ) {
                    const sellValue = gameManager.itemManager.itemSellValue(item);
                    character.progress.gold += sellValue;
                    gameManager.personalQuestManager.trackPersonalQuestProgress(
                      character,
                      PersonalQuestAutotrackType.gold,
                      undefined,
                      sellValue
                    );
                  } else {
                    gameManager.itemManager.grantItem(item, character);
                  }
                }
                gameManager.itemManager.addItemCount(item);
              } else {
                this.game.party.unlockedItems.push(identifier);
              }
            }
          });
        }
        break;
      case TreasureRewardType.calendarSection:
        if (reward.value && typeof reward.value === 'string' && reward.value.split('-').length > 1) {
          const section = reward.value.split('-')[0];
          const week = this.game.party.weeks + +reward.value.split('-')[1];
          this.game.party.weekSections[week] = [...(this.game.party.weekSections[week] || []), section];
        }
        break;
      case TreasureRewardType.campaignSticker:
        if (reward.value && typeof reward.value === 'string') {
          this.game.party.campaignStickers.push(reward.value);
        }
        break;
      case TreasureRewardType.partyAchievement:
        if (reward.value && typeof reward.value === 'string') {
          this.game.party.achievementsList.push(reward.value);
        }
        break;
      case TreasureRewardType.lootCards:
        if (typeof reward.value === 'number') {
          this.game.lootDeck.active = true;
          for (let i = 0; i < reward.value; i++) {
            gameManager.lootManager.drawCard(this.game.lootDeck, character);
            gameManager.triggerUiChange(false);
          }
        }
        break;
      case TreasureRewardType.scenario:
        if (reward.value) {
          const scenario = new GameScenarioModel('' + reward.value, edition);
          if (
            !this.game.party.manualScenarios.find(
              (scenarioModel) =>
                scenarioModel.index === scenario.index &&
                scenarioModel.edition === scenario.edition &&
                scenarioModel.group === scenario.group &&
                !scenarioModel.custom
            ) &&
            !this.game.party.scenarios.find(
              (scenarioModel) =>
                scenarioModel.index === scenario.index &&
                scenarioModel.edition === scenario.edition &&
                scenarioModel.group === scenario.group &&
                !scenarioModel.custom
            )
          ) {
            this.game.party.manualScenarios.push(scenario);
          }
        }
        break;
      case TreasureRewardType.randomScenario:
        if (settingsManager.settings.drawRandomScenario) {
          const scenarioData = gameManager.scenarioManager.drawRandomScenario(edition);
          if (scenarioData) {
            this.game.party.manualScenarios.push(new GameScenarioModel('' + scenarioData.index, scenarioData.edition, scenarioData.group));
            result.push(scenarioData.index, gameManager.scenarioManager.scenarioTitle(scenarioData));
          }
        }
        break;
      case TreasureRewardType.randomScenarioFh:
        if (settingsManager.settings.drawRandomScenario) {
          const sectionData = gameManager.scenarioManager.drawRandomScenarioSection(edition);
          if (sectionData) {
            this.game.party.conclusions.push(new GameScenarioModel('' + sectionData.index, sectionData.edition, sectionData.group));
            result.push(
              sectionData.index,
              gameManager.scenarioManager.scenarioTitle(sectionData, true),
              sectionData.unlocks ? sectionData.unlocks.map((unlock) => '%data.scenarioNumber:' + unlock + '%').join(', ') : ''
            );
          } else if (gameManager.fhRules()) {
            this.game.party.inspiration += 1;
          }
        }
        break;
      case TreasureRewardType.randomItem:
      case TreasureRewardType.randomItemDesign:
      case TreasureRewardType.randomItemBlueprint:
        if (settingsManager.settings.drawRandomItem) {
          let from = -1;
          let to = -1;
          if (typeof reward.value === 'string' && reward.value.includes('-')) {
            from = +reward.value.split('-')[0];
            to = +reward.value.split('-')[1];
          }

          const itemData: ItemData | undefined = gameManager.itemManager.drawRandomItem(
            edition,
            reward.type === TreasureRewardType.randomItemBlueprint,
            from,
            to
          );

          if (itemData) {
            if (reward.type === TreasureRewardType.randomItem) {
              gameManager.itemManager.grantItem(itemData, character);
            } else {
              this.game.party.unlockedItems.push(new CountIdentifier(itemData.id, itemData.edition));
            }
            result.push('' + itemData.id, 'data.items.' + itemData.name, itemData.edition);
          } else if (gameManager.fhRules()) {
            this.game.party.inspiration += 1;
          }
        }
        break;
    }

    return result;
  }

  getTreasures(scenario: Scenario, sections: Scenario[], unlooted: boolean = false, all: boolean = false): ('G' | number)[] {
    let treasures: ('G' | number)[] = [];
    if (scenario.rooms) {
      if (all) {
        scenario.rooms.forEach((room) => {
          if (room.treasures) {
            treasures.push(...room.treasures);
          }
        });
      } else if (scenario.revealedRooms) {
        scenario.revealedRooms.forEach((roomNumber) => {
          const room = scenario.rooms.find((room) => room.roomNumber === roomNumber);
          if (room && room.treasures) {
            treasures.push(...room.treasures);
          }
        });
      }
    }

    sections.forEach((section) => {
      if (section.rooms) {
        if (all) {
          section.rooms.forEach((room) => {
            if (room.treasures) {
              treasures.push(...room.treasures);
            }
          });
        } else if (section.revealedRooms) {
          section.revealedRooms.forEach((roomNumber) => {
            const room = section.rooms.find((room) => room.roomNumber === roomNumber);
            if (room && room.treasures) {
              treasures.push(...room.treasures);
            }
          });
        }
      }
    });

    treasures = treasures.filter(
      (treasure, index) =>
        !unlooted || !this.game.figures.some((figure) => figure instanceof Character && this.hasTreasure(figure, treasure, index))
    );

    if (unlooted) {
      treasures = treasures.filter(
        (treasure) =>
          !this.game.party.treasures.find((identifier) => identifier.name === '' + treasure && identifier.edition === scenario.edition)
      );
    }

    return treasures;
  }

  getAllTreasures(scenario: ScenarioData): ('G' | number)[] {
    const treasures: ('G' | number)[] = [];
    if (scenario.rooms) {
      scenario.rooms.forEach((room) => {
        if (room.treasures) {
          treasures.push(...room.treasures);
        }
      });
    }

    gameManager.scenarioManager.getSections(scenario).forEach((section) => {
      if (section.rooms) {
        section.rooms.forEach((room) => {
          if (room.treasures) {
            treasures.push(...room.treasures);
          }
        });
      }
    });

    return treasures;
  }

  treasureRewardsFromString(treasure: string): string[][] {
    if (treasure.split(':').length < 2) {
      return [];
    } else {
      return treasure
        .split(':')
        .slice(1)
        .join(':')
        .split('|')
        .map((value) => value.split('+'));
    }
  }
}
