import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuest, PersonalQuestAutotrackType, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';

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

      if (current < counter) {
        character.progress.personalQuestProgress[i] = Math.min(counter, current + value);
      }
    });
  }

  trackPersonalQuestProgressForParty(type: PersonalQuestAutotrackType, arg?: string, value: number = 1) {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.trackPersonalQuestProgress(figure, type, arg, value);
      }
    });
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
