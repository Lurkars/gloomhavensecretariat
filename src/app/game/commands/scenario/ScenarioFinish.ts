import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { CountIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData, ScenarioFinish, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

export function summaryCharacters(): Character[] {
  return (gameManager.game.figures.filter((figure) => figure instanceof Character) as Character[]).sort((a, b) => {
    if (!a.absent && b.absent) {
      return -1;
    } else if (a.absent && !b.absent) {
      return 1;
    }
    const aName = gameManager.characterManager.characterName(a).toLowerCase();
    const bName = gameManager.characterManager.characterName(b).toLowerCase();
    return aName > bName ? 1 : aName < bName ? -1 : 0;
  });
}

export function openScenarioFinish(success: boolean, conclusion: ScenarioData | undefined = undefined) {
  const finish = new ScenarioFinish();
  finish.success = success;
  finish.conclusion = conclusion ? new GameScenarioModel(conclusion.index, conclusion.edition, conclusion.group) : undefined;
  finish.battleGoals = summaryCharacters().map(() => 0);
  gameManager.game.finish = finish;
}

function finishConclusion(finish: ScenarioFinish | undefined): ScenarioData | undefined {
  if (!finish || !finish.conclusion) {
    return undefined;
  }
  const conclusion = finish.conclusion;
  return gameManager
    .sectionData(conclusion.edition)
    .find((sectionData) => sectionData.index === conclusion.index && sectionData.group === conclusion.group && sectionData.conclusion);
}

export class ScenarioFinishOpenCommand extends CommandImpl {
  id: string = 'scenario.finish.open';
  requiredParameters: number = 1;

  conclusion(index: BASE_TYPE): ScenarioData | undefined {
    const scenario = gameManager.game.scenario;
    if (!scenario || !index) {
      return undefined;
    }
    return gameManager
      .sectionData(scenario.edition)
      .find((sectionData) => sectionData.index === index && sectionData.group === scenario.group && sectionData.conclusion);
  }

  validParameters(success: boolean, conclusionIndex: string = ''): boolean {
    return (
      typeof success === 'boolean' &&
      !!gameManager.game.scenario &&
      !gameManager.game.finish &&
      (!conclusionIndex || !!this.conclusion(conclusionIndex))
    );
  }

  executeWithParameters(success: boolean, conclusionIndex: string = '') {
    openScenarioFinish(success, this.conclusion(conclusionIndex));
  }
}

export class ScenarioFinishCloseCommand extends CommandImpl {
  id: string = 'scenario.finish.close';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return !!gameManager.game.finish;
  }

  executeWithParameters() {
    gameManager.stateManager.scenarioSummary = false;
    gameManager.game.finish = undefined;
  }
}

abstract class ScenarioFinishCommandImpl extends CommandImpl {
  finish(): ScenarioFinish | undefined {
    return gameManager.game.finish;
  }

  characterIndex(number: BASE_TYPE): number {
    const character = findCharacter(number);
    return character ? summaryCharacters().indexOf(character) : -1;
  }
}

export class ScenarioFinishBattleGoalCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.battleGoal';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    return !!this.finish() && this.characterIndex(number) !== -1 && typeof value === 'number' && value >= 0;
  }

  executeWithParameters(number: number, value: number) {
    const finish = this.finish();
    if (finish) {
      finish.battleGoals = finish.battleGoals || [];
      finish.battleGoals[this.characterIndex(number)] = value;
    }
  }
}

export class ScenarioFinishTrialCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.trial';
  requiredParameters: number = 2;

  validParameters(number: number, value: boolean): boolean {
    return !!this.finish() && this.characterIndex(number) !== -1 && typeof value === 'boolean';
  }

  executeWithParameters(number: number, value: boolean) {
    const finish = this.finish();
    if (finish) {
      finish.trials = finish.trials || [];
      finish.trials[this.characterIndex(number)] = value;
    }
  }
}

export class ScenarioFinishChallengesCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.challenges';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return !!this.finish() && typeof value === 'number' && value >= 0 && value <= 2;
  }

  executeWithParameters(value: number) {
    const finish = this.finish();
    if (finish) {
      finish.challenges = value;
    }
  }
}

export class ScenarioFinishItemCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.item';
  requiredParameters: number = 3;

  validParameters(number: number, itemIndex: number, value: boolean): boolean {
    return (
      !!this.finish() && this.characterIndex(number) !== -1 && typeof itemIndex === 'number' && itemIndex >= 0 && typeof value === 'boolean'
    );
  }

  executeWithParameters(number: number, itemIndex: number, value: boolean) {
    const finish = this.finish();
    if (finish) {
      const index = this.characterIndex(number);
      finish.items = finish.items || [];
      finish.items[index] = (finish.items[index] || []).filter((item) => item !== itemIndex);
      if (value) {
        finish.items[index].push(itemIndex);
      }
    }
  }
}

export class ScenarioFinishRandomItemCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.randomItem';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    return !!this.finish() && (number === -1 || this.characterIndex(number) !== -1);
  }

  executeWithParameters(number: number) {
    const finish = this.finish();
    if (finish) {
      finish.randomItemIndex = number === -1 ? -1 : this.characterIndex(number);
    }
  }
}

export class ScenarioFinishCollectiveGoldCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.collectiveGold';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    return !!this.finish() && this.characterIndex(number) !== -1 && typeof value === 'number' && value >= 0;
  }

  executeWithParameters(number: number, value: number) {
    const finish = this.finish();
    if (finish) {
      finish.collectiveGold = finish.collectiveGold || [];
      finish.collectiveGold[this.characterIndex(number)] = value;
    }
  }
}

export class ScenarioFinishCollectiveResourceCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.collectiveResource';
  requiredParameters: number = 3;

  validParameters(number: number, type: string, value: number): boolean {
    return (
      !!this.finish() &&
      this.characterIndex(number) !== -1 &&
      Object.values(LootType).includes(type as LootType) &&
      typeof value === 'number' &&
      value >= 0
    );
  }

  executeWithParameters(number: number, type: LootType, value: number) {
    const finish = this.finish();
    if (finish) {
      const index = this.characterIndex(number);
      finish.collectiveResources = finish.collectiveResources || [];
      finish.collectiveResources[index] = finish.collectiveResources[index] || {};
      finish.collectiveResources[index][type] = value;
    }
  }
}

export class ScenarioFinishCalendarSectionCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.calendarSection';
  requiredParameters: number = 2;

  validParameters(index: number, value: number): boolean {
    return !!this.finish() && typeof index === 'number' && index >= 0 && typeof value === 'number' && value >= -1;
  }

  executeWithParameters(index: number, value: number) {
    const finish = this.finish();
    if (finish) {
      finish.calendarSectionManual = finish.calendarSectionManual || [];
      finish.calendarSectionManual[index] = value;
    }
  }
}

export class ScenarioFinishLocationCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.location';
  requiredParameters: number = 1;

  validParameters(location: string): boolean {
    return !!this.finish() && typeof location === 'string';
  }

  executeWithParameters(location: string) {
    const finish = this.finish();
    if (finish) {
      finish.chooseLocation = location || undefined;
    }
  }
}

export class ScenarioFinishUnlockCharacterCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.unlockCharacter';
  requiredParameters: number = 1;

  validParameters(name: string): boolean {
    return !!this.finish() && typeof name === 'string';
  }

  executeWithParameters(name: string) {
    const finish = this.finish();
    if (finish) {
      finish.chooseUnlockCharacter = name || undefined;
    }
  }
}

export class ScenarioFinishOverlayTextCommand extends ScenarioFinishCommandImpl {
  id: string = 'scenario.finish.overlayText';
  requiredParameters: number = 1;

  validParameters(text: string): boolean {
    return !!this.finish() && typeof text === 'string';
  }

  executeWithParameters(text: string) {
    const finish = this.finish();
    if (finish) {
      finish.overlayCustomText = text;
    }
  }
}

export class ScenarioFinishApplyCommand extends CommandImpl {
  id: string = 'scenario.finish.apply';
  requiredParameters: number = 1;

  linkedScenarioData(linkedIndex: BASE_TYPE): ScenarioData | undefined {
    const scenario = gameManager.game.scenario;
    if (!scenario || !linkedIndex) {
      return undefined;
    }
    return gameManager
      .scenarioData(scenario.edition)
      .find((scenarioData) => scenarioData.group === scenario.group && scenarioData.index === linkedIndex);
  }

  rewards(scenario: Scenario, conclusion: ScenarioData | undefined, success: boolean): ScenarioRewards | undefined {
    let rewards: ScenarioRewards | undefined;
    if (gameManager.game.party.campaignMode && success) {
      if (scenario.rewards) {
        rewards = Object.assign(new ScenarioRewards(), scenario.rewards);
      }
      if (conclusion && conclusion.rewards) {
        rewards = rewards ? Object.assign(rewards, conclusion.rewards) : Object.assign(new ScenarioRewards(), conclusion.rewards);
      }
      if (gameManager.fhRules(true) && rewards && gameManager.scenarioManager.isSuccess(scenario)) {
        rewards = undefined;
      }
    }
    return rewards;
  }

  rewardItems(scenario: Scenario, rewards: ScenarioRewards | undefined): ItemData[] {
    const rewardItems: ItemData[] = [];
    if (rewards && settingsManager.settings.scenarioRewards) {
      const itemData = (item: string) =>
        gameManager.itemManager.getItem(
          item.split(':')[0].split('-')[0],
          item.split(':')[0].split('-').slice(1).join('-') || scenario.edition,
          true
        );
      if (rewards.items) {
        rewards.items.forEach((item, index) => {
          const data = itemData(item);
          if (data) {
            rewardItems[index] = data;
          }
        });
      }
      if (rewards.chooseItem) {
        let index = 0;
        rewards.chooseItem.forEach((itemList) =>
          itemList.forEach((item) => {
            const data = itemData(item);
            if (data) {
              rewardItems[index] = data;
              index++;
            }
          })
        );
      }
    }
    return rewardItems;
  }

  validParameters(seed: number, linkedIndex: string = ''): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!gameManager.game.scenario && (!linkedIndex || !!this.linkedScenarioData(linkedIndex));
  }

  executeWithParameters(seed: number, linkedIndex: string = '', forcedLink: boolean = false) {
    gameManager.game.seed = seed;
    const scenario = gameManager.game.scenario;
    if (!scenario) {
      this.executionError('no scenario');
      return;
    }
    const finish: ScenarioFinish = gameManager.game.finish || new ScenarioFinish();
    const success = gameManager.game.finish ? finish.success : true;
    const conclusion = finishConclusion(gameManager.game.finish);
    const linkedScenarioData = this.linkedScenarioData(linkedIndex);
    const characters = summaryCharacters();
    const rewards = this.rewards(scenario, conclusion, success);
    const rewardItems = this.rewardItems(scenario, rewards);
    const gainRewards = gameManager.game.party.campaignMode;
    const characterProgress = gameManager.game.party.campaignMode || !gameManager.fhRules(true);
    const battleGoals = finish.battleGoals || [];
    const trials = finish.trials || [];
    const challenges = finish.challenges || 0;
    const collectiveGold = finish.collectiveGold || [];
    const collectiveResources = finish.collectiveResources || [];
    const items: number[][] = finish.items || [];
    const calendarSectionManual = finish.calendarSectionManual || finish.calenderSectionManual || [];

    if (settingsManager.settings.scenarioRewards && success && !gameManager.bbRules()) {
      characters.forEach((character, index) => {
        if (!character.absent) {
          if (battleGoals[index] > 0) {
            character.progress.battleGoals += battleGoals[index];
            gameManager.personalQuestManager.trackPersonalQuestProgress(
              character,
              PersonalQuestAutotrackType.battleGoals,
              undefined,
              battleGoals[index]
            );
          }
          if (trials[index]) {
            character.progress.trial = undefined;
          }
          character.progress.experience += 2 * challenges;
          if (gameManager.trialsManager.favorsEnabled && gameManager.trialsManager.apply) {
            character.progress.gold += character.loot * gameManager.trialsManager.activeFavor('fh', 'wealth');
            if (battleGoals[index]) {
              character.progress.experience += 3 * gameManager.trialsManager.activeFavor('fh', 'knowledge');
            }
          }
        }

        if (collectiveGold[index] > 0) {
          character.progress.gold += collectiveGold[index];
        }

        if (collectiveResources[index]) {
          Object.keys(collectiveResources[index]).forEach((value) => {
            const lootType = value as LootType;
            character.progress.loot[lootType] = (character.progress.loot[lootType] || 0) + (collectiveResources[index][lootType] || 0);
          });
        }

        rewardItems.forEach((item, itemIndex) => {
          if (items.every((characterItems) => !characterItems || !characterItems.includes(itemIndex))) {
            items[index] = items[index] || [];
            items[index].push(itemIndex);
          }
        });

        (items[index] || []).forEach((itemIndex) => {
          const item = rewardItems[itemIndex];
          if (item) {
            if (settingsManager.settings.characterItems) {
              gameManager.itemManager.addItem(item, character);
            }
            gameManager.itemManager.addItemCount(item);
          }
        });
      });

      if (rewards && rewards.collectiveResources) {
        rewards.collectiveResources.forEach((value) => {
          const assigned = collectiveResources.length
            ? collectiveResources.map((resources) => (resources && resources[value.type]) || 0).reduce((a, b) => a + b)
            : 0;
          const available = Math.max(EntityValueFunction(value.value) - assigned, 0);
          if (available) {
            gameManager.game.party.loot[value.type] = (gameManager.game.party.loot[value.type] || 0) + available;
          }
        });
      }

      if (finish.chooseLocation) {
        gameManager.game.party.manualScenarios.push(new GameScenarioModel(finish.chooseLocation, scenario.edition, scenario.group));
      }

      if (
        settingsManager.settings.automaticUnlocking &&
        finish.chooseUnlockCharacter &&
        !gameManager.game.unlockedCharacters.includes(scenario.edition + ':' + finish.chooseUnlockCharacter)
      ) {
        gameManager.game.unlockedCharacters.push(scenario.edition + ':' + finish.chooseUnlockCharacter);
      }

      gameManager.game.party.townGuardPerks += challenges;

      if (gainRewards) {
        [...(finish.randomItemBlueprints || []), ...(finish.randomItemDesigns || [])].forEach((itemId) => {
          if (itemId === -1) {
            if (gameManager.fhRules()) {
              gameManager.game.party.inspiration += 1;
            }
          } else {
            gameManager.game.party.unlockedItems.push(new CountIdentifier(itemId, scenario.edition));
          }
        });

        if (finish.randomSideScenario) {
          gameManager.game.party.manualScenarios.push(
            new GameScenarioModel(finish.randomSideScenario.name, finish.randomSideScenario.edition)
          );
        }

        if (rewards && rewards.calendarSectionManual) {
          rewards.calendarSectionManual.forEach((sectionManual, index) => {
            if ((calendarSectionManual[index] || 0) >= 0) {
              const week = gameManager.game.party.weeks + (calendarSectionManual[index] || 0);
              gameManager.game.party.weekSections[week] = [...(gameManager.game.party.weekSections[week] || []), sectionManual.section];
            }
          });
        }
      }

      if (gameManager.challengesManager.enabled && challenges) {
        gameManager.game.challengeDeck.finished += challenges;
      }

      gameManager.trialsManager.applyTrialCards();
    }

    gameManager.scenarioManager.finishScenario(
      scenario,
      success,
      conclusion,
      false,
      linkedScenarioData !== undefined,
      settingsManager.settings.scenarioRewards && !gameManager.bbRules() && characterProgress,
      gainRewards
    );

    if (finish.overlayCustomText && conclusion && rewards && rewards.overlayCustomText) {
      const conclusionModel = gameManager.game.party.conclusions.find(
        (model) => model.index === conclusion.index && model.edition === conclusion.edition && model.group === conclusion.group
      );
      if (conclusionModel) {
        conclusionModel.custom = finish.overlayCustomText;
      }
    }

    if (
      linkedScenarioData &&
      (forcedLink ||
        (!gameManager.scenarioManager.isBlocked(linkedScenarioData) && !gameManager.scenarioManager.isLocked(linkedScenarioData)))
    ) {
      gameManager.scenarioManager.setScenario(new Scenario(linkedScenarioData), true);
    } else if (!linkedScenarioData) {
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          figure.absent = false;
        }
      });
    }
    gameManager.stateManager.scenarioSummary = false;
  }
}

export class ScenarioFinishRestartCommand extends CommandImpl {
  id: string = 'scenario.finish.restart';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return !!gameManager.game.scenario;
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    const finish = gameManager.game.finish;
    gameManager.scenarioManager.finishScenario(
      gameManager.game.scenario,
      finish ? finish.success : false,
      finishConclusion(finish),
      true,
      false,
      settingsManager.settings.scenarioRewards && (gameManager.game.party.campaignMode || !gameManager.fhRules(true)),
      gameManager.game.party.campaignMode,
      false
    );
    gameManager.stateManager.scenarioSummary = false;
  }
}
