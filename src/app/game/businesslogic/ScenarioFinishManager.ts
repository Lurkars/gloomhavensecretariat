import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { CountIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { fullLootDeck, LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { PetIdentifier } from 'src/app/game/model/data/PetCard';
import { ScenarioData, ScenarioFinish, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

export class ScenarioFinishApply {
  scenario: Scenario;
  success: boolean;
  conclusion: ScenarioData | undefined;
  finish: ScenarioFinish;
  characters: Character[];
  rewards: ScenarioRewards | undefined;
  rewardItems: ItemData[];
  characterProgress: boolean;
  gainRewards: boolean;
  conclusionOnly: boolean = false;
  linked: ScenarioData | undefined;
  forcedLink: boolean = false;

  constructor(
    scenario: Scenario,
    success: boolean,
    conclusion: ScenarioData | undefined,
    finish: ScenarioFinish,
    characters: Character[],
    rewards: ScenarioRewards | undefined,
    rewardItems: ItemData[],
    characterProgress: boolean,
    gainRewards: boolean
  ) {
    this.scenario = scenario;
    this.success = success;
    this.conclusion = conclusion;
    this.finish = finish;
    this.characters = characters;
    this.rewards = rewards;
    this.rewardItems = rewardItems;
    this.characterProgress = characterProgress;
    this.gainRewards = gainRewards;
  }
}

export type FinishRewardItems = { items: ItemData[]; counts: number[] };

export type FinishItemContext = {
  characters: Character[];
  items: number[][];
  rewards: ScenarioRewards | undefined;
  rewardItems: FinishRewardItems;
};

export type FinishDraft = {
  collectiveGold: number[];
  collectiveResources: Partial<Record<LootType, number>>[];
  items: number[][];
  chooseLocation: string | undefined;
  chooseUnlockCharacter: string | undefined;
  calendarSectionManual: number[];
  randomItemBlueprints: number[];
  randomItemDesigns: number[];
  randomItem: ItemData | undefined;
  randomItems: (ItemData | undefined)[];
  randomSideScenario: ScenarioData | undefined;
};

export class ScenarioFinishManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  summaryCharacters(): Character[] {
    return (this.game.figures.filter((figure) => figure instanceof Character) as Character[]).sort((a, b) => {
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

  conclusionSection(index: string): ScenarioData | undefined {
    const scenario = this.game.scenario;
    if (!scenario || !index) {
      return undefined;
    }
    return gameManager.editionManager
      .sectionData(scenario.edition)
      .find((sectionData) => sectionData.index === index && sectionData.group === scenario.group && sectionData.conclusion);
  }

  finishConclusion(finish: ScenarioFinish | undefined = this.game.finish): ScenarioData | undefined {
    if (!finish || !finish.conclusion) {
      return undefined;
    }
    const conclusion = finish.conclusion;
    return gameManager.editionManager
      .sectionData(conclusion.edition)
      .find((sectionData) => sectionData.index === conclusion.index && sectionData.group === conclusion.group && sectionData.conclusion);
  }

  currentFinishRewards(finish: ScenarioFinish | undefined = this.game.finish): ScenarioRewards | undefined {
    const scenario = this.game.scenario;
    if (!scenario || !finish) {
      return undefined;
    }
    return this.finishRewards(scenario, this.finishConclusion(finish), finish.success);
  }

  canOpenFinish(): boolean {
    return !!this.game.scenario && !this.game.finish;
  }

  openFinish(success: boolean, conclusion: ScenarioData | undefined = undefined): boolean {
    if (!this.canOpenFinish()) {
      return false;
    }
    const finish = new ScenarioFinish();
    finish.success = success;
    finish.conclusion = conclusion ? new GameScenarioModel(conclusion.index, conclusion.edition, conclusion.group) : undefined;
    finish.battleGoals = this.summaryCharacters().map(() => 0);
    this.game.finish = finish;
    return true;
  }

  canCloseFinish(): boolean {
    return !!this.game.finish;
  }

  closeFinish(): boolean {
    if (!this.canCloseFinish()) {
      return false;
    }
    gameManager.stateManager.scenarioSummary = false;
    this.game.finish = undefined;
    return true;
  }

  // defaults and random draws for the rewards of a scenario summary
  prepareFinishRewards(
    draft: FinishDraft,
    scenario: ScenarioData,
    rewards: ScenarioRewards,
    characters: Character[],
    rewardItems: ItemData[],
    rewardsOnly: boolean
  ) {
    if (rewards.collectiveGold) {
      characters.forEach((char, index) => {
        if (!draft.collectiveGold[index]) {
          draft.collectiveGold[index] = 0;
        }
      });
    }
    if (rewards.collectiveResources) {
      draft.collectiveResources = draft.collectiveResources || [];
      characters.forEach((char, index) => {
        if (!draft.collectiveResources[index]) {
          draft.collectiveResources[index] = {};
        }
      });
    }
    // add automatically on (potential) solo scenario
    const soloCharacter = characters.filter((char) => !char.absent).length === 1 && characters.find((char) => !char.absent);
    if (rewards.items && soloCharacter) {
      const soloIndex = characters.indexOf(soloCharacter);
      rewards.items.forEach((item, index) => {
        if (rewardItems[index]) {
          draft.items[soloIndex] = draft.items[soloIndex] || [];
          if (!draft.items[soloIndex].includes(index)) {
            draft.items[soloIndex].push(index);
          }
        }
      });
    }
    if (rewards.chooseLocation && rewards.chooseLocation.length > 0 && !draft.chooseLocation) {
      draft.chooseLocation = rewards.chooseLocation[0];
    }

    if (!rewardsOnly && rewards.chooseUnlockCharacter && rewards.chooseUnlockCharacter.length > 0 && !draft.chooseUnlockCharacter) {
      let index = 0;
      while (
        index < rewards.chooseUnlockCharacter.length &&
        this.game.unlockedCharacters.includes(scenario.edition + ':' + rewards.chooseUnlockCharacter[index])
      ) {
        index++;
      }
      if (index < rewards.chooseUnlockCharacter.length) {
        draft.chooseUnlockCharacter = rewards.chooseUnlockCharacter[index];
      }
    }
    if (rewards.calendarSectionManual) {
      // -1: section not added to the calendar
      rewards.calendarSectionManual.forEach((section, index) => {
        if (draft.calendarSectionManual[index] === undefined || draft.calendarSectionManual[index] === null) {
          draft.calendarSectionManual[index] = -1;
        }
      });
    }

    if (
      settingsManager.settings.drawRandomItem &&
      rewards.randomItemBlueprint &&
      draft.randomItemBlueprints.length < rewards.randomItemBlueprint
    ) {
      const blueprints = gameManager.itemManager.drawRandomItemsBatch(
        scenario.edition,
        rewards.randomItemBlueprint - draft.randomItemBlueprints.length,
        true
      );
      for (let i = draft.randomItemBlueprints.length; i < rewards.randomItemBlueprint; i++) {
        const itemData = blueprints.shift();
        const item: Identifier | undefined = itemData ? new Identifier(itemData.id, itemData.edition) : undefined;
        draft.randomItemBlueprints[i] = item ? +item.name : -1;
      }
    }

    if (settingsManager.settings.drawRandomItem && rewards.randomItemDesign && draft.randomItemDesigns.length < rewards.randomItemDesign) {
      const designs = gameManager.itemManager.drawRandomItemsBatch(
        scenario.edition,
        rewards.randomItemDesign - draft.randomItemDesigns.length,
        false
      );
      for (let i = draft.randomItemDesigns.length; i < rewards.randomItemDesign; i++) {
        const itemData = designs.shift();
        const item: Identifier | undefined = itemData ? new Identifier(itemData.id, itemData.edition) : undefined;
        draft.randomItemDesigns[i] = item ? +item.name : -1;
      }
    }

    if (settingsManager.settings.drawRandomItem && rewards.randomItem) {
      if (!draft.randomItem) {
        const from = +rewards.randomItem.split('-')[0];
        const to = +rewards.randomItem.split('-')[1];
        const itemEdition = rewards.randomItem.split('-').length > 2 ? rewards.randomItem.split('-')[2] : scenario.edition;
        const itemData = gameManager.itemManager.drawRandomItem(itemEdition, false, from, to);
        if (itemData) {
          draft.randomItem = itemData;
        }
      }
    }

    if (settingsManager.settings.drawRandomItem && rewards.randomItems) {
      if (draft.randomItems.length < characters.length && rewards.randomItems.split('-').length > 1) {
        const from = +rewards.randomItems.split('-')[0];
        const to = +rewards.randomItems.split('-')[1];
        const itemEdition = rewards.randomItems.split('-').length > 2 ? rewards.randomItems.split('-')[2] : scenario.edition;
        const items = gameManager.itemManager.drawRandomItemsBatch(itemEdition, characters.length, false, from, to);
        for (let i = draft.randomItems.length; i < characters.length; i++) {
          const character = characters[i];
          if (character.absent) {
            draft.randomItems[i] = undefined;
          } else {
            let itemData = items.pop();
            if (
              character.progress.items.find((owned) => itemData && owned.name === itemData.id + '' && owned.edition === itemData.edition)
            ) {
              itemData = undefined;
            }
            draft.randomItems[i] = itemData ? itemData : undefined;
          }
        }
      }
    }

    if (settingsManager.settings.drawRandomScenario && rewards.randomSideScenario) {
      if (!draft.randomSideScenario) {
        draft.randomSideScenario = gameManager.scenarioManager.drawRandomScenario(scenario.edition);
      }
    }
  }

  linkedScenario(index: string): ScenarioData | undefined {
    const scenario = this.game.scenario;
    if (!scenario || !index) {
      return undefined;
    }
    return gameManager.editionManager
      .scenarioData(scenario.edition)
      .find((scenarioData) => scenarioData.group === scenario.group && scenarioData.index === index);
  }

  canApplyFinish(linkedIndex: string = ''): boolean {
    return !!this.game.scenario && (!linkedIndex || !!this.linkedScenario(linkedIndex));
  }

  applyFinish(linkedIndex: string = '', forcedLink: boolean = false): boolean {
    const scenario = this.game.scenario;
    if (!scenario || !this.canApplyFinish(linkedIndex)) {
      return false;
    }
    const finish: ScenarioFinish = Object.assign(new ScenarioFinish(), this.game.finish || {});
    const success = this.game.finish ? finish.success : true;
    const conclusion = this.finishConclusion(this.game.finish);
    const rewards = this.finishRewards(scenario, conclusion, success);
    const calendarSectionManual = finish.calendarSectionManual || finish.calenderSectionManual || [];
    finish.calendarSectionManual = ((rewards && rewards.calendarSectionManual) || []).map((_, index) => calendarSectionManual[index] || 0);
    const apply = new ScenarioFinishApply(
      scenario,
      success,
      conclusion,
      finish,
      this.summaryCharacters(),
      rewards,
      this.rewardItems(scenario.edition, rewards).items,
      this.game.party.campaignMode || !gameManager.fhRules(true),
      this.game.party.campaignMode
    );
    apply.linked = this.linkedScenario(linkedIndex);
    apply.forcedLink = forcedLink;
    this.applyScenarioFinish(apply);
    gameManager.stateManager.scenarioSummary = false;
    return true;
  }

  canRestartFinish(): boolean {
    return !!this.game.scenario;
  }

  restartFinish(): boolean {
    if (!this.canRestartFinish()) {
      return false;
    }
    const finish = this.game.finish;
    this.finishScenario(
      this.game.scenario,
      finish ? finish.success : false,
      this.finishConclusion(finish),
      true,
      false,
      settingsManager.settings.scenarioRewards && (this.game.party.campaignMode || !gameManager.fhRules(true)),
      this.game.party.campaignMode,
      false
    );
    gameManager.stateManager.scenarioSummary = false;
    return true;
  }

  rewardItems(edition: string, rewards: ScenarioRewards | undefined): FinishRewardItems {
    const result: FinishRewardItems = { items: [], counts: [] };
    if (!rewards || !settingsManager.settings.scenarioRewards) {
      return result;
    }
    const resolve = (item: string, index: number): boolean => {
      const itemData = gameManager.itemManager.getItem(
        item.split(':')[0].split('-')[0],
        item.split(':')[0].split('-').slice(1).join('-') || edition,
        true
      );
      if (!itemData) {
        console.error("Unknown Item '" + item + "' for edition '" + edition + "'");
        return false;
      }
      result.items[index] = itemData;
      result.counts[index] = !item.includes(':') ? 1 : +item.split(':')[1];
      return true;
    };
    if (rewards.items) {
      rewards.items.forEach((item, index) => resolve(item, index));
    }
    if (rewards.chooseItem) {
      let index = 0;
      rewards.chooseItem.forEach((itemList) =>
        itemList.forEach((item) => {
          if (resolve(item, index)) {
            index++;
          }
        })
      );
    }
    return result;
  }

  private characterIndex(character: Character | undefined): number {
    return character ? this.summaryCharacters().indexOf(character) : -1;
  }

  private selectedBattleGoal(character: Character): BattleGoal | undefined {
    if (settingsManager.settings.battleGoals && character.battleGoal && character.battleGoals.length > 0) {
      return gameManager.battleGoalManager.getBattleGoal(character.battleGoals[0]);
    }
    return undefined;
  }

  hasTrial349(character: Character): boolean {
    return !!character.progress.trial && character.progress.trial.edition === 'fh' && character.progress.trial.name === '349';
  }

  battleGoalToggleValue(character: Character, current: number, value: number, checked: boolean): number {
    const battleGoal = this.selectedBattleGoal(character);
    if (checked && current < value) {
      return battleGoal && battleGoal.checks > value ? battleGoal.checks : value;
    } else if (current >= value) {
      return battleGoal && battleGoal.checks > value - 1 ? 0 : value - 1;
    }
    return current;
  }

  validBattleGoalValue(character: Character, value: number): boolean {
    if (!Number.isInteger(value) || value < 0) {
      return false;
    }
    if (value === 0) {
      return true;
    }
    const battleGoal = this.selectedBattleGoal(character);
    const checks = battleGoal ? battleGoal.checks : 0;
    return !character.absent && value >= checks && (this.hasTrial349(character) || value <= Math.max(2, checks));
  }

  canSetFinishBattleGoal(character: Character | undefined, value: number): boolean {
    return !!this.game.finish && !!character && this.characterIndex(character) !== -1 && this.validBattleGoalValue(character, value);
  }

  setFinishBattleGoal(character: Character | undefined, value: number): boolean {
    const finish = this.game.finish;
    if (!finish || !character || !this.canSetFinishBattleGoal(character, value)) {
      return false;
    }
    finish.battleGoals = finish.battleGoals || [];
    finish.battleGoals[this.characterIndex(character)] = value;
    return true;
  }

  canSetFinishTrial(character: Character | undefined, value: boolean): boolean {
    return (
      !!this.game.finish &&
      !!character &&
      this.characterIndex(character) !== -1 &&
      typeof value === 'boolean' &&
      (!value || (!character.absent && gameManager.trialsManager.trialsEnabled))
    );
  }

  setFinishTrial(character: Character | undefined, value: boolean): boolean {
    const finish = this.game.finish;
    if (!finish || !character || !this.canSetFinishTrial(character, value)) {
      return false;
    }
    finish.trials = finish.trials || [];
    finish.trials[this.characterIndex(character)] = value;
    return true;
  }

  finishChallengeCount(): number {
    if (gameManager.challengesManager.enabled) {
      return this.game.challengeDeck.keep.length;
    } else if (gameManager.fhRules()) {
      const townHall = this.game.party.buildings.find(
        (buildingModel) => buildingModel.name === 'town-hall' && buildingModel.level && buildingModel.state !== 'wrecked'
      );
      if (townHall) {
        if (townHall.level === 1 || townHall.level === 2) {
          return 1;
        } else if (townHall.level === 3) {
          return 2;
        }
      }
    }
    return 0;
  }

  // completing the second challenge first swaps the kept cards
  toggleChallenges(current: number, second: boolean): number {
    if (current < 1 && second && gameManager.challengesManager.enabled) {
      gameManager.challengesManager.swapKeptCards(this.game.challengeDeck);
      return 1;
    } else if (current > (second ? 1 : 0)) {
      return second ? 1 : 0;
    }
    return second ? 2 : 1;
  }

  canSetFinishChallenges(value: number): boolean {
    return !!this.game.finish && Number.isInteger(value) && value >= 0 && value <= Math.min(2, this.finishChallengeCount());
  }

  setFinishChallenges(value: number): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishChallenges(value)) {
      return false;
    }
    finish.challenges = value;
    return true;
  }

  finishItemBlocked(context: FinishItemContext, characterIndex: number, itemIndex: number, choose: boolean = true): boolean {
    const items = context.items[characterIndex] || [];
    const rewardItems = context.rewardItems.items;
    if (choose && context.rewards && context.rewards.chooseItem) {
      let startIndex = 0;
      let endIndex = 0;
      let count = 0;
      let found = false;
      context.rewards.chooseItem.forEach((itemList) => {
        if (!found && itemIndex < itemList.length + count) {
          endIndex = itemList.length + count - 1;
          found = true;
        }
        count += itemList.length;
        if (!found) {
          startIndex = count;
        }
      });
      if (
        rewardItems.some(
          (rewardItem, rewardIndex) =>
            rewardIndex !== itemIndex &&
            (rewardIndex < startIndex || rewardIndex > endIndex) &&
            context.characters.some((char, charIndex) => this.finishItemBlocked(context, charIndex, rewardIndex, false))
        )
      ) {
        return true;
      }
    }

    const itemData = rewardItems[itemIndex];
    const owned = (character: Character) =>
      character.progress.items.some((identifier) => identifier.name === '' + itemData.id && identifier.edition === itemData.edition);
    if (owned(context.characters[characterIndex])) {
      return true;
    }

    const availableItems = choose ? itemData.count - context.characters.filter((character) => owned(character)).length : 1;
    return (
      !items.includes(itemIndex) &&
      context.items.filter((list) => list && list.includes(itemIndex)).length >=
        Math.min(context.rewardItems.counts[itemIndex], availableItems)
    );
  }

  private finishItemContext(finish: ScenarioFinish): FinishItemContext | undefined {
    const scenario = this.game.scenario;
    if (!scenario) {
      return undefined;
    }
    const rewards = this.currentFinishRewards(finish);
    return {
      characters: this.summaryCharacters(),
      items: finish.items || [],
      rewards: rewards,
      rewardItems: this.rewardItems(scenario.edition, rewards)
    };
  }

  canSetFinishItem(character: Character | undefined, itemIndex: number, value: boolean): boolean {
    const finish = this.game.finish;
    const index = this.characterIndex(character);
    if (!finish || index === -1 || !Number.isInteger(itemIndex) || itemIndex < 0 || typeof value !== 'boolean') {
      return false;
    }
    const context = this.finishItemContext(finish);
    if (!context || !context.rewardItems.items[itemIndex]) {
      return false;
    }
    const included = (context.items[index] || []).includes(itemIndex);
    return included !== value && (!value || !this.finishItemBlocked(context, index, itemIndex));
  }

  setFinishItem(character: Character | undefined, itemIndex: number, value: boolean): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishItem(character, itemIndex, value)) {
      return false;
    }
    const index = this.characterIndex(character);
    finish.items = finish.items || [];
    finish.items[index] = (finish.items[index] || []).filter((item) => item !== itemIndex);
    if (value) {
      finish.items[index].push(itemIndex);
    }
    return true;
  }

  canSetFinishRandomItem(character: Character | undefined): boolean {
    return !!this.game.finish && (!character || this.characterIndex(character) !== -1);
  }

  setFinishRandomItem(character: Character | undefined): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishRandomItem(character)) {
      return false;
    }
    finish.randomItemIndex = this.characterIndex(character);
    return true;
  }

  validCollectiveGold(rewards: ScenarioRewards | undefined, collectiveGold: number[], characterIndex: number, value: number): boolean {
    if (!Number.isInteger(value) || value < 0 || !rewards || !rewards.collectiveGold) {
      return false;
    }
    const others = collectiveGold.reduce((sum, gold, index) => sum + (index !== characterIndex && gold ? gold : 0), 0);
    return others + value <= rewards.collectiveGold;
  }

  canSetFinishCollectiveGold(character: Character | undefined, value: number): boolean {
    const finish = this.game.finish;
    const index = this.characterIndex(character);
    return (
      !!finish && index !== -1 && this.validCollectiveGold(this.currentFinishRewards(finish), finish.collectiveGold || [], index, value)
    );
  }

  setFinishCollectiveGold(character: Character | undefined, value: number): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishCollectiveGold(character, value)) {
      return false;
    }
    finish.collectiveGold = finish.collectiveGold || [];
    finish.collectiveGold[this.characterIndex(character)] = value;
    return true;
  }

  validCollectiveResource(
    rewards: ScenarioRewards | undefined,
    collectiveResources: Partial<Record<LootType, number>>[],
    characterIndex: number,
    type: LootType,
    value: number
  ): boolean {
    if (!Number.isInteger(value) || value < 0 || !rewards || !rewards.collectiveResources) {
      return false;
    }
    const entries = rewards.collectiveResources.filter((resource) => resource.type === type);
    if (!entries.length) {
      return false;
    }
    const total = entries.reduce((sum, resource) => sum + EntityValueFunction(resource.value), 0);
    const others = collectiveResources.reduce(
      (sum, resources, index) => sum + (index !== characterIndex && resources && resources[type] ? resources[type] : 0),
      0
    );
    return others + value <= total;
  }

  canSetFinishCollectiveResource(character: Character | undefined, type: LootType, value: number): boolean {
    const finish = this.game.finish;
    const index = this.characterIndex(character);
    return (
      !!finish &&
      index !== -1 &&
      Object.values(LootType).includes(type) &&
      this.validCollectiveResource(this.currentFinishRewards(finish), finish.collectiveResources || [], index, type, value)
    );
  }

  setFinishCollectiveResource(character: Character | undefined, type: LootType, value: number): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishCollectiveResource(character, type, value)) {
      return false;
    }
    const index = this.characterIndex(character);
    finish.collectiveResources = finish.collectiveResources || [];
    finish.collectiveResources[index] = finish.collectiveResources[index] || {};
    finish.collectiveResources[index][type] = value;
    return true;
  }

  // -1: section not added to the calendar
  validCalendarSection(rewards: ScenarioRewards | undefined, index: number, value: number): boolean {
    return (
      !!rewards &&
      !!rewards.calendarSectionManual &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < rewards.calendarSectionManual.length &&
      Number.isInteger(value) &&
      value >= -1
    );
  }

  canSetFinishCalendarSection(index: number, value: number): boolean {
    return !!this.game.finish && this.validCalendarSection(this.currentFinishRewards(), index, value);
  }

  setFinishCalendarSection(index: number, value: number): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishCalendarSection(index, value)) {
      return false;
    }
    finish.calendarSectionManual = finish.calendarSectionManual || [];
    finish.calendarSectionManual[index] = value;
    return true;
  }

  validLocation(rewards: ScenarioRewards | undefined, location: string): boolean {
    return typeof location === 'string' && (!location || (!!rewards && (rewards.chooseLocation || []).includes(location)));
  }

  canSetFinishLocation(location: string): boolean {
    return !!this.game.finish && this.validLocation(this.currentFinishRewards(), location);
  }

  setFinishLocation(location: string): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishLocation(location)) {
      return false;
    }
    finish.chooseLocation = location || undefined;
    return true;
  }

  validUnlockCharacter(rewards: ScenarioRewards | undefined, name: string): boolean {
    return typeof name === 'string' && (!name || (!!rewards && (rewards.chooseUnlockCharacter || []).includes(name)));
  }

  canSetFinishUnlockCharacter(name: string): boolean {
    return !!this.game.finish && this.validUnlockCharacter(this.currentFinishRewards(), name);
  }

  setFinishUnlockCharacter(name: string): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishUnlockCharacter(name)) {
      return false;
    }
    finish.chooseUnlockCharacter = name || undefined;
    return true;
  }

  canSetFinishOverlayText(text: string): boolean {
    return !!this.game.finish && typeof text === 'string';
  }

  setFinishOverlayText(text: string): boolean {
    const finish = this.game.finish;
    if (!finish || !this.canSetFinishOverlayText(text)) {
      return false;
    }
    finish.overlayCustomText = text;
    return true;
  }

  // apply the rewards gained by each present character (gold, experience, perks, battle goals, resources)
  applyCharacterRewards(rewards: ScenarioRewards, restart: boolean = false, linked: boolean = false) {
    if (!settingsManager.settings.characterSheet || !settingsManager.settings.scenarioRewards) {
      return;
    }
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character && !figure.absent) {
        if (rewards.experience) {
          gameManager.characterManager.addXP(figure, rewards.experience, !restart && !linked);
        }

        if (rewards.gold) {
          figure.progress.gold += rewards.gold;
          if (rewards.gold > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.gold, undefined, rewards.gold);
          }
        }

        if (rewards.perks) {
          figure.progress.extraPerks += rewards.perks;
          if (figure.progress.extraPerks < 0) {
            figure.progress.extraPerks = 0;
          }
        }

        if (rewards.battleGoals) {
          figure.progress.battleGoals += rewards.battleGoals;
          if (figure.progress.battleGoals > 18) {
            figure.progress.battleGoals = 18;
          } else if (figure.progress.battleGoals < 0) {
            figure.progress.battleGoals = 0;
          }
          if (rewards.battleGoals > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(
              figure,
              PersonalQuestAutotrackType.battleGoals,
              undefined,
              rewards.battleGoals
            );
          }
        }

        if (rewards.resources) {
          rewards.resources.forEach((item) => {
            figure.progress.loot[item.type] = (figure.progress.loot[item.type] || 0) + EntityValueFunction(item.value);

            if ((figure.progress.loot[item.type] || 0) < 0) {
              figure.progress.loot[item.type] = 0;
            }
          });
        }
      }
    });
  }

  finishRewards(
    scenario: ScenarioData,
    conclusion: ScenarioData | undefined,
    success: boolean,
    force: boolean = false,
    repeat: boolean = false
  ): ScenarioRewards | undefined {
    if ((!this.game.party.campaignMode && !force) || !success) {
      return undefined;
    }
    let rewards: ScenarioRewards | undefined = scenario.rewards ? Object.assign(new ScenarioRewards(), scenario.rewards) : undefined;
    if (conclusion && conclusion.rewards) {
      rewards = rewards ? Object.assign(rewards, conclusion.rewards) : Object.assign(new ScenarioRewards(), conclusion.rewards);
    }
    // the scenario rewards can only be gained once in FH/GH2E
    if (!repeat && gameManager.fhRules(true) && rewards && gameManager.scenarioRequirementsManager.isSuccess(scenario)) {
      return undefined;
    }
    if (settingsManager.settings.scenarioRewards && rewards && rewards.valueMapping) {
      const valueMapping = rewards.valueMapping;
      Object.keys(valueMapping).forEach((key) => {
        const rule = valueMapping[key];
        if (rewards && rule) {
          const value = gameManager.scenarioRulesManager.presentEntitiesByFigureRule(rule, undefined).length;
          const rewardKey = rule.value as keyof ScenarioRewards;
          if (typeof rewards[rewardKey] === 'string') {
            (rewards[rewardKey] as string) = rewards[rewardKey].replaceAll(key, '' + value);
          }
        }
      });
    }
    return rewards;
  }

  private gainFinishItem(item: ItemData | undefined, character: Character) {
    if (item) {
      if (settingsManager.settings.characterItems) {
        gameManager.itemManager.grantItem(item, character);
      }
      gameManager.itemManager.addItemCount(item);
    }
  }

  // returns true if the linked scenario is blocked or locked and was not set
  applyScenarioFinish(apply: ScenarioFinishApply): boolean {
    const finish = apply.finish;
    const rewards = apply.rewards;
    const scenario = apply.scenario;
    const challenges = finish.challenges || 0;
    const collectiveResources = finish.collectiveResources || [];
    const items = finish.items || [];

    if (settingsManager.settings.scenarioRewards && apply.success && !gameManager.bbRules()) {
      apply.characters.forEach((character, index) => {
        if (!character.absent) {
          const battleGoals = (finish.battleGoals || [])[index] || 0;
          if (battleGoals > 0) {
            character.progress.battleGoals += battleGoals;
            gameManager.personalQuestManager.trackPersonalQuestProgress(
              character,
              PersonalQuestAutotrackType.battleGoals,
              undefined,
              battleGoals
            );
          }
          if ((finish.trials || [])[index]) {
            character.progress.trial = undefined;
          }
          character.progress.experience += 2 * challenges;
          if (gameManager.trialsManager.favorsEnabled && gameManager.trialsManager.apply) {
            character.progress.gold += character.loot * gameManager.trialsManager.activeFavor('fh', 'wealth');
            if (battleGoals) {
              character.progress.experience += 3 * gameManager.trialsManager.activeFavor('fh', 'knowledge');
            }
          }
        }

        const collectiveGold = (finish.collectiveGold || [])[index] || 0;
        if (collectiveGold > 0) {
          character.progress.gold += collectiveGold;
        }

        const resources = collectiveResources[index];
        if (resources) {
          Object.keys(resources).forEach((value) => {
            const lootType = value as LootType;
            character.progress.loot[lootType] = (character.progress.loot[lootType] || 0) + (resources[lootType] || 0);
          });
        }

        apply.rewardItems.forEach((item, itemIndex) => {
          if (items.every((characterItems) => !characterItems || !characterItems.includes(itemIndex))) {
            items[index] = items[index] || [];
            items[index].push(itemIndex);
          }
        });

        (items[index] || []).forEach((itemIndex) => {
          const item = apply.rewardItems[itemIndex];
          if (item) {
            this.gainFinishItem(item, character);
          }
        });

        if (settingsManager.settings.drawRandomItem) {
          const randomItem = (finish.randomItems || [])[index];
          if (randomItem) {
            this.gainFinishItem(gameManager.itemManager.getItem(randomItem.name, randomItem.edition, true), character);
          }
          if (finish.randomItem && finish.randomItemIndex === index) {
            this.gainFinishItem(gameManager.itemManager.getItem(finish.randomItem.name, finish.randomItem.edition, true), character);
          }
        }
      });

      if (rewards && rewards.collectiveResources) {
        rewards.collectiveResources.forEach((value) => {
          const assigned = collectiveResources.map((resources) => (resources && resources[value.type]) || 0).reduce((a, b) => a + b, 0);
          const available = Math.max(EntityValueFunction(value.value) - assigned, 0);
          if (available) {
            this.game.party.loot[value.type] = (this.game.party.loot[value.type] || 0) + available;
          }
        });
      }

      if (finish.chooseLocation) {
        this.game.party.manualScenarios.push(new GameScenarioModel(finish.chooseLocation, scenario.edition, scenario.group));
      }

      if (settingsManager.settings.automaticUnlocking && finish.chooseUnlockCharacter) {
        gameManager.characterManager.unlockCharacter(scenario.edition, finish.chooseUnlockCharacter);
      }

      this.game.party.townGuardPerks += challenges;

      if (apply.gainRewards) {
        [...(finish.randomItemBlueprints || []), ...(finish.randomItemDesigns || [])].forEach((itemId) => {
          if (itemId === -1) {
            if (gameManager.fhRules()) {
              this.game.party.inspiration += 1;
            }
          } else {
            this.game.party.unlockedItems.push(new CountIdentifier(itemId, scenario.edition));
          }
        });

        if (finish.randomSideScenario) {
          this.game.party.manualScenarios.push(new GameScenarioModel(finish.randomSideScenario.name, finish.randomSideScenario.edition));
        }

        if (rewards && rewards.calendarSectionManual) {
          const calendarSectionManual = finish.calendarSectionManual || [];
          rewards.calendarSectionManual.forEach((sectionManual, index) => {
            if (calendarSectionManual[index] >= 0) {
              const week = this.game.party.weeks + calendarSectionManual[index];
              this.game.party.weekSections[week] = [...(this.game.party.weekSections[week] || []), sectionManual.section];
            }
          });
        }
      }

      if (gameManager.challengesManager.enabled && challenges) {
        this.game.challengeDeck.finished += challenges;
      }

      gameManager.trialsManager.applyTrialCards();
    }

    const characterProgress = settingsManager.settings.scenarioRewards && apply.characterProgress;
    if (apply.conclusionOnly) {
      // conclusions are finished internally, so apply character rewards (gold, experience, ...) here
      if (settingsManager.settings.scenarioRewards && apply.success && rewards && apply.gainRewards && !gameManager.bbRules()) {
        this.applyCharacterRewards(rewards);
      }
      this.finishScenario(scenario, true, apply.conclusion, false, false, characterProgress, apply.gainRewards, true);
    } else {
      this.finishScenario(
        this.game.scenario,
        apply.success,
        apply.conclusion,
        false,
        apply.linked !== undefined,
        characterProgress && !gameManager.bbRules(),
        apply.gainRewards
      );
    }

    const conclusion = apply.conclusion;
    if (finish.overlayCustomText && conclusion && rewards && rewards.overlayCustomText) {
      const conclusionModel = this.game.party.conclusions.find(
        (model) => model.index === conclusion.index && model.edition === conclusion.edition && model.group === conclusion.group
      );
      if (conclusionModel) {
        conclusionModel.custom = finish.overlayCustomText;
      }
    }

    if (apply.linked) {
      if (
        !apply.forcedLink &&
        (gameManager.scenarioRequirementsManager.isBlocked(apply.linked) || gameManager.scenarioRequirementsManager.isLocked(apply.linked))
      ) {
        return true;
      }
      gameManager.scenarioManager.setScenario(new Scenario(apply.linked), true);
    } else {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          figure.absent = false;
        }
      });
    }
    return false;
  }

  // inspiration gained for playing with less than 4 characters
  inspirationBonus(scenario: ScenarioData, rewards: ScenarioRewards | undefined): number {
    const count = gameManager.characterManager.characterCount();
    if (
      count >= 4 ||
      (scenario.solo && !scenario.spotlight) ||
      (rewards && rewards.ignoredBonus && rewards.ignoredBonus.includes('inspiration'))
    ) {
      return 0;
    }
    return 4 - count;
  }

  hasForcedLinks(scenario: ScenarioData, conclusion: ScenarioData | undefined): boolean {
    return (
      (!!scenario.forcedLinks && scenario.forcedLinks.length > 0) ||
      (!!conclusion && !!conclusion.forcedLinks && conclusion.forcedLinks.length > 0)
    );
  }

  // finishing a scenario passes a week on the FH calendar
  passesWeek(
    scenario: ScenarioData,
    rewards: ScenarioRewards | undefined,
    linked: boolean,
    gainRewards: boolean,
    internal: boolean = false
  ): boolean {
    return (
      !scenario.conclusion &&
      (!rewards || !rewards.calendarIgnore) &&
      gameManager.fhRules() &&
      !linked &&
      settingsManager.settings.automaticPassTime &&
      !scenario.solo &&
      settingsManager.settings.partySheet &&
      !internal &&
      gainRewards
    );
  }

  // experience of the character after finishing, for previews
  finishExperience(character: Character, rewards: ScenarioRewards | undefined, success: boolean, challenges: number): number {
    return (
      character.progress.experience +
      challenges * 2 +
      character.experience +
      (success && rewards && rewards.experience ? rewards.experience : 0) +
      (success && (!rewards || !rewards.ignoredBonus || !rewards.ignoredBonus.includes('experience'))
        ? gameManager.levelManager.experience()
        : 0)
    );
  }

  // every 3 battle goal checks give a perk
  battleGoalPerkGained(character: Character, battleGoals: number): boolean {
    return Math.floor((character.progress.battleGoals + battleGoals) / 3) > Math.floor(character.progress.battleGoals / 3);
  }

  private conclusionModel(conclusion: ScenarioData): GameScenarioModel | undefined {
    return this.game.party.conclusions.find(
      (model) => model.index === conclusion.index && model.edition === conclusion.edition && model.group === conclusion.group
    );
  }

  // the scenario (or its conclusion) was already finished in the campaign
  alreadyFinished(scenario: ScenarioData, conclusion: ScenarioData | undefined): boolean {
    return gameManager.scenarioRequirementsManager.isSuccess(scenario) || (!!conclusion && !!this.conclusionModel(conclusion));
  }

  // the scenario has a conclusion section which was not chosen
  missingConclusion(scenario: ScenarioData, conclusion: ScenarioData | undefined): boolean {
    return (
      !conclusion &&
      gameManager.editionManager
        .sectionData(scenario.edition)
        .some(
          (sectionData) =>
            sectionData.parent === scenario.index &&
            sectionData.group === scenario.group &&
            sectionData.edition === scenario.edition &&
            sectionData.conclusion
        )
    );
  }

  conclusionCustomText(conclusion: ScenarioData): string {
    const model = this.conclusionModel(conclusion);
    return (model && model.custom) || '';
  }

  // custom overlay text of an already solved conclusion
  setConclusionCustomText(conclusion: ScenarioData, text: string): boolean {
    const model = this.conclusionModel(conclusion);
    if (!model) {
      return false;
    }
    model.custom = text;
    return true;
  }

  private sameScenario(model: GameScenarioModel, scenarioData: ScenarioData): boolean {
    return model.index === scenarioData.index && model.edition === scenarioData.edition && model.group === scenarioData.group;
  }

  finishedCount(scenarioData: ScenarioData, casual: boolean = false): number {
    return (casual ? this.game.party.casualScenarios : this.game.party.scenarios).filter((model) => this.sameScenario(model, scenarioData))
      .length;
  }

  // conclusions to choose from when manually adding a success
  successConclusions(scenarioData: ScenarioData): ScenarioData[] {
    return gameManager.editionManager
      .sectionData(scenarioData.edition)
      .filter(
        (sectionData) =>
          sectionData.edition === scenarioData.edition &&
          sectionData.parent === scenarioData.index &&
          sectionData.group === scenarioData.group &&
          sectionData.conclusion &&
          gameManager.scenarioRequirementsManager.getRequirements(sectionData).length === 0
      );
  }

  scenarioConclusion(scenarioData: ScenarioData, index: string): ScenarioData | undefined {
    return gameManager.editionManager
      .sectionData(scenarioData.edition)
      .find(
        (sectionData) =>
          sectionData.index === index &&
          sectionData.group === scenarioData.group &&
          sectionData.parent === scenarioData.index &&
          sectionData.conclusion
      );
  }

  canAddScenarioSuccess(scenarioData: ScenarioData, force: boolean = false): boolean {
    return (
      force ||
      (!gameManager.scenarioRequirementsManager.isBlocked(scenarioData) && !gameManager.scenarioRequirementsManager.isLocked(scenarioData))
    );
  }

  // manually mark a scenario as finished, rewards are only gained for the first success in campaign mode
  addScenarioSuccess(scenarioData: ScenarioData, conclusion: ScenarioData | undefined = undefined, force: boolean = false): boolean {
    if (!this.canAddScenarioSuccess(scenarioData, force)) {
      return false;
    }
    this.finishScenario(
      new Scenario(scenarioData),
      true,
      conclusion,
      false,
      false,
      false,
      this.game.party.campaignMode && this.finishedCount(scenarioData) === 0,
      true
    );
    return true;
  }

  canRemoveScenarioSuccess(scenarioData: ScenarioData, casual: boolean = false): boolean {
    return this.finishedCount(scenarioData, casual) > 0;
  }

  removeScenarioSuccess(scenarioData: ScenarioData, casual: boolean = false): boolean {
    const scenarios = casual ? this.game.party.casualScenarios : this.game.party.scenarios;
    const model = scenarios.find((value) => this.sameScenario(value, scenarioData));
    if (!model) {
      return false;
    }
    scenarios.splice(scenarios.indexOf(model), 1);
    return true;
  }

  finishScenario(
    scenario: Scenario | undefined,
    success: boolean = true,
    conclusionSection: ScenarioData | undefined,
    restart: boolean = false,
    linked: boolean = false,
    characterProgress: boolean = true,
    gainRewards: boolean = true,
    internal: boolean = false
  ) {
    this.game.finish = undefined;
    if (!scenario) {
      return;
    }
    const rewards = this.mergedFinishRewards(scenario, conclusionSection);

    if (!internal && characterProgress && settingsManager.settings.scenarioStats) {
      this.applyFinishStats(scenario, success);
    }

    if (!internal && characterProgress && settingsManager.settings.characterSheet) {
      this.applyFinishProgress(rewards, success, restart, linked);
    }

    if (success) {
      if (rewards && gainRewards) {
        this.applyFinishRewards(scenario, rewards, restart, linked, internal);
      }
      this.applyFinishCampaign(scenario, rewards, conclusionSection, gainRewards, internal);
      this.trackFinishCharacters();
    }

    this.closeFinishedScenario(scenario, rewards, success, conclusionSection, restart, linked, gainRewards, internal);

    if (success) {
      this.trackFinishParty(scenario);
    }
  }

  private mergedFinishRewards(scenario: Scenario, conclusionSection: ScenarioData | undefined): ScenarioRewards | undefined {
    let rewards: ScenarioRewards | undefined = scenario.rewards ? Object.assign(new ScenarioRewards(), scenario.rewards) : undefined;
    if (conclusionSection && conclusionSection.rewards) {
      if (!rewards) {
        rewards = Object.assign(new ScenarioRewards(), conclusionSection.rewards);
      } else {
        Object.assign(rewards, conclusionSection.rewards);
      }
    }
    return rewards;
  }

  private applyFinishStats(scenario: Scenario, success: boolean) {
    const timestamp = Date.now();
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character && !figure.absent) {
        figure.progress.scenarioStats = figure.progress.scenarioStats || [];
        gameManager.scenarioStatsManager.applyScenarioStats(figure, scenario, success);
        figure.scenarioStats.timestamp = timestamp;
        figure.progress.scenarioStats.push(figure.scenarioStats);
      }
    });
  }

  private applyFinishProgress(rewards: ScenarioRewards | undefined, success: boolean, restart: boolean, linked: boolean) {
    const scenarioXP: number =
      success && (!rewards || !rewards.ignoredBonus || !rewards.ignoredBonus.includes('experience'))
        ? gameManager.levelManager.experience()
        : 0;
    const coinValue: number = gameManager.levelManager.loot();
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character && !figure.absent) {
        const gainedXP = scenarioXP + figure.experience;
        gameManager.characterManager.addXP(figure, gainedXP, !restart && !linked);
        if (figure.experience > 0) {
          gameManager.personalQuestManager.trackPersonalQuestProgress(
            figure,
            PersonalQuestAutotrackType.abilityXP,
            undefined,
            figure.experience
          );
        }
        gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.scenarioXP, '' + gainedXP);

        if (!rewards || !rewards.ignoredBonus || !rewards.ignoredBonus.includes('gold')) {
          const goldGained = figure.loot * coinValue;
          figure.progress.gold += goldGained;
          if (goldGained > 0) {
            gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.gold, undefined, goldGained);
          }
          if (!restart && figure.lootCards) {
            figure.lootCards.forEach((index) => {
              gameManager.lootManager.addCharacterLoot(figure, this.game.lootDeck.cards[index]);
            });
          }
        }
      }
    });
  }

  private applyFinishRewards(scenario: Scenario, rewards: ScenarioRewards, restart: boolean, linked: boolean, internal: boolean) {
    if (rewards.valueMapping) {
      Object.keys(rewards.valueMapping).forEach((key) => {
        if (rewards && rewards.valueMapping && rewards.valueMapping[key]) {
          const rule = rewards.valueMapping[key];
          const value = gameManager.scenarioRulesManager.presentEntitiesByFigureRule(rule, undefined).length;
          const rewardKey = rule.value as keyof ScenarioRewards;
          if (rewards && typeof rewards[rewardKey] === 'string') {
            (rewards[rewardKey] as string) = rewards[rewardKey].replaceAll(key, '' + value);
          }
        }
      });
    }

    if (!internal) {
      this.applyCharacterRewards(rewards, restart, linked);
    }

    // always add achievements/stickers for scenario unlock
    if (rewards.globalAchievements) {
      this.game.party.globalAchievementsList.push(...rewards.globalAchievements);
    }

    if (rewards.partyAchievements) {
      this.game.party.achievementsList.push(...rewards.partyAchievements);
    }

    if (rewards.lostPartyAchievements) {
      this.game.party.achievementsList = this.game.party.achievementsList.filter(
        (achievement) => rewards && !rewards.lostPartyAchievements.includes(achievement)
      );
    }

    if (rewards.campaignSticker) {
      this.game.party.campaignStickers.push(...rewards.campaignSticker.map((sticker) => sticker.toLowerCase().replaceAll(' ', '-')));
    }

    if (rewards.eventDecks) {
      rewards.eventDecks.forEach((eventDeck) => {
        const type = eventDeck.split(':')[0];
        const events = gameManager.eventCardManager.getEventCardsForEdition(scenario.edition, type);
        const startEvent = events.find((e) => e.cardId === eventDeck.split(':')[1].split('|')[0]);
        const endEvent = events.find((e) => e.cardId === eventDeck.split(':')[1].split('|')[1]);
        if (startEvent && endEvent) {
          gameManager.eventCardManager.buildEventDeck(
            type,
            events.slice(events.indexOf(startEvent), events.indexOf(endEvent) + 1).map((e) => e.cardId)
          );
        } else {
          console.warn('Could not find start and end for: ' + eventDeck);
        }
      });
    }

    if (settingsManager.settings.partySheet) {
      this.applyFinishPartySheetRewards(scenario, rewards);
    }

    if (settingsManager.settings.automaticUnlocking && rewards.unlockCharacter) {
      gameManager.characterManager.unlockCharacter(scenario.edition, rewards.unlockCharacter);
    }

    // a retirement reward completes the personal quest, so conclude its scenario chain
    [rewards.characterRetirement, rewards.characterRetirementSkipEvents]
      .filter((cardId) => !!cardId)
      .forEach((cardId) => gameManager.personalQuestManager.completePersonalQuestScenarios(cardId, scenario.index));

    if (rewards.lootDeckCards) {
      rewards.lootDeckCards.forEach((lootDeckCard) => {
        const loot = fullLootDeck.find((loot) => loot.cardId === lootDeckCard);
        if (
          loot &&
          ((loot.type !== LootType.special1 && loot.type !== LootType.special2) || !this.game.lootDeckFixed.includes(loot.type))
        ) {
          this.game.lootDeckFixed.push(loot.type);
        }
      });
    }
  }

  private applyFinishPartySheetRewards(scenario: Scenario, rewards: ScenarioRewards) {
    if (rewards.reputation) {
      gameManager.campaignManager.changeReputation(rewards.reputation);
    }

    if (rewards.reputationFactions) {
      rewards.reputationFactions.forEach((reputationFaction) => {
        const faction = reputationFaction.split(':')[0];
        const value = +reputationFaction.split(':')[1];
        gameManager.campaignManager.changeFactionReputation(faction, value, rewards.factionUnlock === faction);
      });
    }

    if (rewards.prosperity) {
      gameManager.campaignManager.changeProsperity(rewards.prosperity);
    }

    if (rewards.morale) {
      // TODO: replace Town Guards Placeholder
      gameManager.campaignManager.changeMorale(EntityValueFunction(rewards.morale));
    }

    if (rewards.inspiration) {
      gameManager.campaignManager.changeInspiration(EntityValueFunction(rewards.inspiration));
    }

    this.applyFinishItemRewards(scenario, rewards);

    this.applyFinishCalendarRewards(rewards);

    if (rewards.pet) {
      if (this.game.party.pets.find((value) => value.edition === scenario.edition && value.name === rewards.pet) === undefined) {
        this.game.party.pets.push(new PetIdentifier(rewards.pet, scenario.edition));
      }
    }

    if (rewards.soldiers) {
      gameManager.buildingsManager.addSoldiers(rewards.soldiers);
    }

    this.applyFinishEventRewards(scenario, rewards);
  }

  private applyFinishItemRewards(scenario: Scenario, rewards: ScenarioRewards) {
    if (rewards.itemDesigns) {
      rewards.itemDesigns.forEach((item) => {
        if (item.includes('-')) {
          const from = +item.split('-')[0];
          const to = +item.split('-')[1];
          for (let i = from; i <= to; i++) {
            const itemData = gameManager.itemManager.getItem(i, scenario.edition, true);
            if (
              itemData &&
              (!itemData.unlockScenario ||
                itemData.unlockScenario.edition !== scenario.edition ||
                itemData.unlockScenario.name !== scenario.index)
            ) {
              this.game.party.unlockedItems.push(new CountIdentifier(itemData.id, scenario.edition));
              gameManager.personalQuestManager.trackPersonalQuestProgressForParty(
                PersonalQuestAutotrackType.itemBlueprint,
                '' + itemData.id
              );
            }
          }
        } else {
          let itemEdition = scenario.edition;
          if (item.includes(':')) {
            itemEdition = item.split(':')[1];
          }
          const itemData = gameManager.itemManager.getItem(item.split(':')[0], itemEdition, true);
          if (
            itemData &&
            (!itemData.unlockScenario ||
              itemData.unlockScenario.edition !== scenario.edition ||
              itemData.unlockScenario.name !== scenario.index)
          ) {
            this.game.party.unlockedItems.push(new CountIdentifier(itemData.id, itemData.edition));
            gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.itemBlueprint, '' + itemData.id);
          }
        }
      });
    }

    if (rewards.itemBlueprints) {
      rewards.itemBlueprints.forEach((item) => {
        if (item.includes('-')) {
          const from = +item.split('-')[0];
          const to = +item.split('-')[1];
          for (let i = from; i <= to; i++) {
            this.game.party.unlockedItems.push(new CountIdentifier(i, scenario.edition));
            gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.itemBlueprint, '' + i);
          }
        } else {
          let itemEdition = scenario.edition;
          if (item.includes(':')) {
            itemEdition = item.split(':')[1];
          }
          this.game.party.unlockedItems.push(new CountIdentifier(item, itemEdition));
          gameManager.personalQuestManager.trackPersonalQuestProgressForParty(
            PersonalQuestAutotrackType.itemBlueprint,
            item.includes(':') ? item.split(':')[0] : item
          );
        }
      });
    }

    if (rewards.removeItem) {
      rewards.removeItem.forEach((item) => {
        let itemEdition = scenario.edition;
        let itemId = item;
        if (item.includes(':')) {
          itemId = item.split(':')[0];
          itemEdition = item.split(':')[1];
        }
        const index = this.game.party.unlockedItems.findIndex(
          (identifier) => identifier.name === itemId && identifier.edition === itemEdition
        );
        if (index !== -1) {
          this.game.party.unlockedItems.splice(index, 1);
        }
      });
    }
  }

  private applyFinishCalendarRewards(rewards: ScenarioRewards) {
    if (rewards.calendarSection) {
      rewards.calendarSection.forEach((calendarSection) => {
        if (calendarSection.split('-').length > 1) {
          const section = calendarSection.split('-')[0];
          let week = -1;
          if (!isNaN(+calendarSection.split('-')[1])) {
            week = this.game.party.weeks + +calendarSection.split('-')[1];
          } else if (calendarSection.split('-')[1].length > 1) {
            const season = calendarSection.split('-')[1].split(':')[0];
            const seasonWeek = +calendarSection.split('-')[1].split(':')[1];
            week =
              Math.max(this.game.party.weeks, 0) - (Math.max(this.game.party.weeks, 0) % 20) + (season === 'summer' ? 20 : 10) + seasonWeek;
          }

          if (week !== -1) {
            this.game.party.weekSections[week] = [...(this.game.party.weekSections[week] || []), section];
          }
        }
      });
    }
  }

  private applyFinishEventRewards(scenario: Scenario, rewards: ScenarioRewards) {
    if (rewards.events && settingsManager.settings.events) {
      rewards.events.forEach((event) => {
        gameManager.eventCardManager.addEventReward(event, scenario.edition, true);
      });
    }

    if (rewards.returnEvents && settingsManager.settings.events) {
      rewards.returnEvents.forEach((event) => {
        gameManager.eventCardManager.returnEventReward(event, scenario.edition);
      });
    }

    if (rewards.removeEvents && settingsManager.settings.events) {
      rewards.removeEvents.forEach((event) => {
        const eventId = event.split(':');
        if (eventId.length > 1) {
          gameManager.eventCardManager.removeEvent(eventId[0], eventId[1]);
          gameManager.eventCardManager.shuffleEvents(eventId[0]);
        }
      });
    }
  }

  private applyFinishCampaign(
    scenario: Scenario,
    rewards: ScenarioRewards | undefined,
    conclusionSection: ScenarioData | undefined,
    gainRewards: boolean,
    internal: boolean
  ) {
    if (!internal && gainRewards) {
      this.game.party.inspiration += this.inspirationBonus(scenario, rewards);
    }

    if (
      conclusionSection &&
      !conclusionSection.repeatable &&
      !this.game.party.conclusions.find(
        (conclusion) =>
          conclusion.index === conclusionSection.index &&
          conclusion.edition === conclusionSection.edition &&
          conclusion.group === conclusionSection.group
      )
    ) {
      this.game.party.conclusions.push(new GameScenarioModel(conclusionSection.index, conclusionSection.edition, conclusionSection.group));
    }

    if (this.game.party.campaignMode && gainRewards) {
      if (scenario.conclusion) {
        if (
          !scenario.repeatable &&
          !this.game.party.conclusions.find(
            (conclusion) =>
              conclusion.index === scenario.index && conclusion.edition === scenario.edition && conclusion.group === scenario.group
          )
        ) {
          this.game.party.conclusions.push(new GameScenarioModel(scenario.index, scenario.edition, scenario.group));
        }
      } else if (!scenario.hideIndex && (!rewards || !rewards.repeatScenario)) {
        this.game.party.scenarios.push(
          new GameScenarioModel(
            scenario.index,
            scenario.edition,
            scenario.group,
            scenario.custom,
            scenario.custom ? scenario.name : '',
            scenario.revealedRooms
          )
        );
      }

      if (
        gameManager.imbuementManager.imbuement &&
        !internal &&
        !scenario.conclusion &&
        (!scenario.solo || scenario.spotlight) &&
        gainRewards
      ) {
        if (gameManager.imbuementManager.imbuement === 'advanced') {
          this.game.party.imbuement += 2;
        } else {
          this.game.party.imbuement += 1;
        }
      }

      const campaignData = gameManager.campaignManager.campaignData();
      if (
        rewards &&
        settingsManager.settings.partySheet &&
        rewards.townGuardAm &&
        rewards.townGuardAm.length > 0 &&
        campaignData.townGuardPerks
      ) {
        const townGuardDeck = gameManager.attackModifierBuildManager.buildTownGuardAttackModifierDeck(this.game.party, campaignData);
        gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
        townGuardDeck.active = false;
        this.game.party.townGuardDeck = townGuardDeck.toModel();
      }
    }
  }

  private trackFinishCharacters() {
    const presentCharacters = this.game.figures.filter((figure) => figure instanceof Character && !figure.absent) as Character[];
    presentCharacters.forEach((figure) => {
      if (figure.health === figure.maxHealth) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.completedHighHP);
      }
      if (!figure.exhausted && figure.health > 0 && figure.health <= 2) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.completedLowHP);
      }

      const exhaustedAllies = presentCharacters.filter((other) => other !== figure && other.exhausted).length;
      if (exhaustedAllies > 0) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(
          figure,
          PersonalQuestAutotrackType.exhaustedCharsFinish,
          undefined,
          exhaustedAllies
        );
      }
    });
  }

  private closeFinishedScenario(
    scenario: Scenario,
    rewards: ScenarioRewards | undefined,
    success: boolean,
    conclusionSection: ScenarioData | undefined,
    restart: boolean,
    linked: boolean,
    gainRewards: boolean,
    internal: boolean
  ) {
    if (restart) {
      gameManager.scenarioManager.setScenario(scenario, true);
    } else {
      if (scenario && this.passesWeek(scenario, rewards, linked, gainRewards, internal)) {
        this.game.party.weeks++;

        gameManager.buildingsManager.nextWeek();

        gameManager.campaignManager.passWeekSections(this.game.party.weeks, scenario.edition, scenario.group, gainRewards);
      }

      if (success && !scenario.hideIndex && (!this.game.party.campaignMode || (!gainRewards && !conclusionSection))) {
        this.game.party.casualScenarios.push(
          new GameScenarioModel(
            scenario.index,
            scenario.edition,
            scenario.group,
            scenario.custom,
            scenario.custom ? scenario.name : '',
            scenario.revealedRooms
          )
        );
      }

      if (!internal) {
        this.game.scenario = undefined;
        this.game.sections = [];
        gameManager.roundManager.resetScenario();
      }
    }
  }

  private trackFinishParty(scenario: Scenario) {
    gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.scenario, scenario.index, 1, true);
    gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.scenariosCompleted, undefined, 1, true);
    gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.sideScenarios, scenario.index, 1, true);

    if (!!scenario.requirements) {
      const requiredBuildings = new Set<string>();
      scenario.requirements.forEach((requirement) => {
        (requirement.buildings || []).forEach((building) => requiredBuildings.add(building));
      });
      requiredBuildings.forEach((building) => {
        gameManager.personalQuestManager.trackPersonalQuestProgressForParty(
          PersonalQuestAutotrackType.scenarioRequirements,
          building,
          1,
          true
        );
      });
    }

    const hasBossMonster = gameManager.scenarioManager.getScenarioMonster(scenario).some((monsterData) => monsterData.boss);
    if (hasBossMonster) {
      gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.bossScenarios, undefined, 1, true);
    }
  }
}
