import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuest, PersonalQuestAutotrackType, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

// Scenario chain requirements (`scenario` autotrack) store the number of completed chain scenarios in the progress value,
// the conclusion of the chain is stored as additional flag bit.
export const PERSONAL_QUEST_SCENARIO_CONCLUDED = 1 << 10;
const SCENARIO_CHAIN_MIGRATION_TAG = 'pq-scenario-chain-migration';

export class PersonalQuestManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  personalQuestByCard(edition: string, cardId: string): PersonalQuest | undefined {
    return gameManager.editionData
      .filter((editionData) => gameManager.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.personalQuests)
      .find((pq) => pq.cardId === cardId || pq.cardId === '0' + cardId || pq.altId === cardId || pq.altId === '0' + cardId);
  }

  personalQuestsForEdition(edition: string): PersonalQuest[] {
    return gameManager.editionData
      .filter((editionData) => gameManager.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.personalQuests);
  }

  personalQuestUnlocked(personalQuest: PersonalQuest): boolean {
    // a manual unlock (see `unlockPersonalQuest`) always wins, regardless of how this PQ is normally gated
    if (this.game.unlockedPersonalQuests.includes(personalQuest.edition + ':' + personalQuest.cardId)) {
      return true;
    }

    if (personalQuest.unlockBuilding) {
      const buildingData = gameManager.campaignManager
        .campaignData(personalQuest.edition)
        .buildings.find((building) => building.id === personalQuest.unlockBuilding);
      return !!buildingData && this.game.party.buildings.some((building) => building.name === buildingData.name);
    }

    const targets = this.personalQuestsForEdition(personalQuest.edition)
      .map((pq) => pq.unlockPQ)
      .filter((unlockPQ): unlockPQ is string => !!unlockPQ);

    return !targets.includes(personalQuest.cardId) && !targets.includes(personalQuest.altId);
  }

  personalQuestPicked(personalQuest: PersonalQuest): boolean {
    return this.game.figures.some(
      (figure) =>
        figure instanceof Character &&
        !!figure.progress.personalQuest &&
        (figure.progress.personalQuest === personalQuest.cardId || figure.progress.personalQuest === personalQuest.altId)
    );
  }

  personalQuestFulfilled(personalQuest: PersonalQuest): boolean {
    return this.game.party.retirements.some(
      (retirement) =>
        retirement.edition === personalQuest.edition &&
        retirement.progress &&
        (retirement.progress.personalQuest === personalQuest.cardId || retirement.progress.personalQuest === personalQuest.altId)
    );
  }

  availablePersonalQuests(edition: string): PersonalQuest[] {
    return this.personalQuestsForEdition(edition).filter(
      (personalQuest) =>
        this.personalQuestUnlocked(personalQuest) && !this.personalQuestPicked(personalQuest) && !this.personalQuestFulfilled(personalQuest)
    );
  }

  unlockPersonalQuest(edition: string, cardIdOrAltId: string) {
    const target = this.personalQuestByCard(edition, cardIdOrAltId);
    const key = edition + ':' + (target ? target.cardId : cardIdOrAltId);
    if (!this.game.unlockedPersonalQuests.includes(key)) {
      this.game.unlockedPersonalQuests.push(key);
    }
  }

  // Undoes a manual unlock. A PQ that is unlocked by its own rules (no unlockBuilding/unlockPQ gate, or
  // its gate is independently met) stays unlocked - this only removes the manual override itself.
  lockPersonalQuest(edition: string, cardIdOrAltId: string) {
    const target = this.personalQuestByCard(edition, cardIdOrAltId);
    const key = edition + ':' + (target ? target.cardId : cardIdOrAltId);
    const index = this.game.unlockedPersonalQuests.indexOf(key);
    if (index !== -1) {
      this.game.unlockedPersonalQuests.splice(index, 1);
    }
  }

  personalQuestAutotrackSupported(personalQuest: PersonalQuest, index: number): boolean {
    const requirement: PersonalQuestRequirement | undefined = personalQuest.requirements[index];
    return !!requirement && !!this.personalQuestAutotrackKind(requirement);
  }

  trackPersonalQuestProgress(character: Character, type: PersonalQuestAutotrackType, arg?: string, value: number = 1) {
    if (!character.progress.personalQuest || !character.progress.personalQuestAutotrack) {
      return;
    }

    const personalQuest = this.personalQuestByCard(character.edition, character.progress.personalQuest);
    if (!personalQuest) {
      return;
    }

    if (!character.progress.personalQuestProgress) {
      character.progress.personalQuestProgress = [];
    }

    const progressBefore = character.progress.personalQuestProgress.join(',');

    personalQuest.requirements.forEach((requirement, i) => {
      if (this.personalQuestAutotrackKind(requirement) !== type) {
        return;
      }

      const tagArg = requirement.autotrack && requirement.autotrack.includes(':') ? requirement.autotrack.split(':')[1] : undefined;
      const current = character.progress.personalQuestProgress[i] || 0;
      const counter = EntityValueFunction(requirement.counter);

      if (type === PersonalQuestAutotrackType.scenarioXP) {
        const threshold = tagArg ? +tagArg : undefined;
        if (threshold === undefined || arg === undefined || +arg < threshold) {
          return;
        }
      } else if (type === PersonalQuestAutotrackType.sideScenarios || type === PersonalQuestAutotrackType.bossScenarios) {
        if (tagArg) {
          const [from, to] = tagArg.split('-').map(Number);
          const index = arg !== undefined ? +arg : NaN;
          if (isNaN(from) || isNaN(to) || isNaN(index) || index < from || index > to) {
            return;
          }
        }
      } else if (type === PersonalQuestAutotrackType.scenario) {
        if (arg === undefined || !this.scenarioRequirementMatches(requirement, arg)) {
          return;
        }
        // count independent of the conclusion, which may be applied by scenario rewards before
        let concluded = current & PERSONAL_QUEST_SCENARIO_CONCLUDED;
        const count = Math.max(0, (current & (PERSONAL_QUEST_SCENARIO_CONCLUDED - 1)) + value);
        // a single scenario (no chain range) is concluded by completing it
        if (!this.scenarioChainRange(requirement)) {
          concluded = count > 0 ? PERSONAL_QUEST_SCENARIO_CONCLUDED : 0;
        }
        character.progress.personalQuestProgress[i] = concluded | count;
        return;
      } else {
        const values = tagArg ? tagArg.split('|') : [];
        if (values.length && (arg === undefined || !values.includes(arg))) {
          return;
        }
      }

      if (requirement.checkbox && requirement.checkbox.length) {
        if (type === PersonalQuestAutotrackType.differentHerbs && arg) {
          const bit = herbResourceLootTypes.indexOf(arg as LootType);
          if (bit >= 0 && (current & (1 << bit)) === 0) {
            character.progress.personalQuestProgress[i] = current | (1 << bit);
          }
        }
        return;
      }

      if (value < 0) {
        character.progress.personalQuestProgress[i] = Math.max(0, current + value);
      } else if (current < counter) {
        character.progress.personalQuestProgress[i] = Math.min(counter, current + value);
      }
    });

    if (character.progress.personalQuestProgress.join(',') !== progressBefore) {
      this.unlockPersonalQuestScenarios(character);
    }
  }

  // concludes the `scenario` requirement of a personal quest matching the given scenario (chain end with "quest complete" reward)
  completePersonalQuestScenarios(cardId: string, scenarioIndex: string) {
    this.game.figures.forEach((figure) => {
      if (!(figure instanceof Character) || !figure.progress.personalQuest || !figure.progress.personalQuestAutotrack) {
        return;
      }

      const personalQuest = this.personalQuestByCard(figure.edition, figure.progress.personalQuest);
      if (!personalQuest || (personalQuest.cardId !== cardId && personalQuest.altId !== cardId)) {
        return;
      }

      if (!figure.progress.personalQuestProgress) {
        figure.progress.personalQuestProgress = [];
      }

      personalQuest.requirements.forEach((requirement, i) => {
        if (
          this.personalQuestAutotrackKind(requirement) === PersonalQuestAutotrackType.scenario &&
          this.scenarioRequirementMatches(requirement, scenarioIndex)
        ) {
          figure.progress.personalQuestProgress[i] = (figure.progress.personalQuestProgress[i] || 0) | PERSONAL_QUEST_SCENARIO_CONCLUDED;
        }
      });
    });
  }

  trackMoneyTokens(character: Character, value: number) {
    if (value !== 0 && !gameManager.fhRules()) {
      this.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.looted, LootType.money, value);
    }
  }

  trackPersonalQuestProgressForParty(type: PersonalQuestAutotrackType, arg?: string, value: number = 1) {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.trackPersonalQuestProgress(figure, type, arg, value);
      }
    });
  }

  // `scenario:from|to` (numeric) matches every scenario of the chain within the range (incl. lettered variants like 74A),
  // otherwise the listed scenario indexes must match exactly
  private scenarioRequirementMatches(requirement: PersonalQuestRequirement, scenarioIndex: string): boolean {
    const range = this.scenarioChainRange(requirement);
    if (range) {
      const index = parseInt(scenarioIndex);
      return !isNaN(index) && index >= range[0] && index <= range[1];
    }
    const tagArg = requirement.autotrack && requirement.autotrack.includes(':') ? requirement.autotrack.split(':')[1] : undefined;
    return !!tagArg && tagArg.split('|').includes(scenarioIndex);
  }

  private scenarioChainRange(requirement: PersonalQuestRequirement): [number, number] | undefined {
    const tagArg = requirement.autotrack && requirement.autotrack.includes(':') ? requirement.autotrack.split(':')[1] : undefined;
    const values = tagArg ? tagArg.split('|') : [];
    if (values.length === 2 && /^\d+$/.test(values[0]) && /^\d+$/.test(values[1]) && +values[0] < +values[1]) {
      return [+values[0], +values[1]];
    }
    return undefined;
  }

  isScenarioChainRequirement(requirement: PersonalQuestRequirement | undefined): boolean {
    return !!requirement && this.personalQuestAutotrackKind(requirement) === PersonalQuestAutotrackType.scenario;
  }

  personalQuestRequirementConcluded(character: Character, index: number): boolean {
    return ((character.progress.personalQuestProgress[index] || 0) & PERSONAL_QUEST_SCENARIO_CONCLUDED) !== 0;
  }

  personalQuestCompleted(character: Character): boolean {
    if (!character.progress.personalQuest) {
      return false;
    }
    const personalQuest = this.personalQuestByCard(character.edition, character.progress.personalQuest);
    return (
      !!personalQuest &&
      personalQuest.requirements.length > 0 &&
      personalQuest.requirements.every((_, i) => this.personalQuestRequirementFulfilled(character, personalQuest, i))
    );
  }

  personalQuestRequirementFulfilled(character: Character, personalQuest: PersonalQuest, index: number): boolean {
    const requirement = personalQuest.requirements[index];
    if (!requirement) {
      return false;
    }
    if (this.isScenarioChainRequirement(requirement)) {
      return this.personalQuestRequirementConcluded(character, index);
    }
    return this.personalQuestRequirementCount(character, personalQuest, index) >= EntityValueFunction(requirement.counter);
  }

  // call after a personal quest got assigned to a character
  personalQuestAssigned(character: Character) {
    if (!character.tags.includes(SCENARIO_CHAIN_MIGRATION_TAG)) {
      character.tags.push(SCENARIO_CHAIN_MIGRATION_TAG);
    }
    this.unlockPersonalQuestScenarios(character);
  }

  // migrates progress of scenario requirements from counter semantics (all were counter 1) to chain semantics
  migrateScenarioChainProgress(character: Character) {
    if (!character.progress.personalQuest || character.tags.includes(SCENARIO_CHAIN_MIGRATION_TAG)) {
      return;
    }
    const personalQuest = this.personalQuestByCard(character.edition, character.progress.personalQuest);
    if (!personalQuest) {
      return;
    }
    character.tags.push(SCENARIO_CHAIN_MIGRATION_TAG);
    personalQuest.requirements.forEach((requirement, i) => {
      const value = character.progress.personalQuestProgress[i] || 0;
      if (this.isScenarioChainRequirement(requirement) && value > 0 && value < PERSONAL_QUEST_SCENARIO_CONCLUDED) {
        character.progress.personalQuestProgress[i] = value | PERSONAL_QUEST_SCENARIO_CONCLUDED;
      }
    });
  }

  unlockPersonalQuestScenarios(character: Character): boolean {
    if (!character.progress.personalQuest || !this.game.party.campaignMode || !settingsManager.settings.automaticUnlocking) {
      return false;
    }

    const personalQuest = this.personalQuestByCard(character.edition, character.progress.personalQuest);
    if (!personalQuest) {
      return false;
    }

    let unlocked = false;
    personalQuest.requirements.forEach((requirement) => {
      if (this.personalQuestAutotrackKind(requirement) !== PersonalQuestAutotrackType.scenario || !requirement.autotrack) {
        return;
      }

      const index = requirement.autotrack.split(':')[1]?.split('|')[0];
      if (!index) {
        return;
      }

      const fulfilled = (requirement.requires || []).every((j) => this.personalQuestRequirementFulfilled(character, personalQuest, j - 1));

      if (fulfilled && this.unlockScenario(personalQuest.edition, index)) {
        unlocked = true;
      }
    });
    return unlocked;
  }

  private unlockScenario(edition: string, index: string): boolean {
    const scenarioData = gameManager.scenarioManager
      .scenarioData(edition, true)
      .find((scenarioData) => scenarioData.index === index && !scenarioData.group);
    if (!scenarioData) {
      return false;
    }

    const alreadyAvailable = gameManager.scenarioManager
      .scenarioData(edition)
      .some((available) => available.edition === scenarioData.edition && !available.group && available.index === scenarioData.index);
    if (alreadyAvailable) {
      return false;
    }

    this.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
    return true;
  }

  private personalQuestAutotrackKind(requirement: PersonalQuestRequirement): PersonalQuestAutotrackType | undefined {
    const type = requirement.autotrack && requirement.autotrack.split(':')[0];
    return type && (Object.values(PersonalQuestAutotrackType) as string[]).includes(type)
      ? (type as PersonalQuestAutotrackType)
      : undefined;
  }

  personalQuestRequirementCount(character: Character, personalQuest: PersonalQuest, index: number): number {
    const requirement = personalQuest.requirements[index];
    const value = character.progress.personalQuestProgress[index] || 0;
    if (this.isScenarioChainRequirement(requirement)) {
      return value & (PERSONAL_QUEST_SCENARIO_CONCLUDED - 1);
    }
    if (!requirement || !requirement.checkbox || !requirement.checkbox.length) {
      return value;
    }

    let count = 0;
    let n = value;
    while (n > 0) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }
}
