import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';

export class PartyPersonalQuestCommand extends CommandImpl {
  id: string = 'party.personalQuest';
  requiredParameters: number = 3;

  personalQuest(edition: BASE_TYPE, cardId: BASE_TYPE): PersonalQuest | undefined {
    return typeof edition === 'string' && typeof cardId === 'string'
      ? gameManager.personalQuestManager.personalQuestByCard(edition, cardId)
      : undefined;
  }

  validParameters(edition: string, cardId: string, unlocked: boolean): boolean {
    return !!this.personalQuest(edition, cardId) && typeof unlocked === 'boolean';
  }

  executeWithParameters(edition: string, cardId: string, unlocked: boolean) {
    const personalQuest = this.personalQuest(edition, cardId);
    if (personalQuest) {
      if (gameManager.personalQuestManager.personalQuestUnlocked(personalQuest) === unlocked) {
        return;
      }
      if (!unlocked) {
        gameManager.personalQuestManager.lockPersonalQuest(personalQuest.edition, personalQuest.cardId);
      } else {
        gameManager.personalQuestManager.unlockPersonalQuest(personalQuest.edition, personalQuest.cardId);
      }
    } else {
      this.executionError('personal quest not found');
    }
  }
}

export class PartyBattleGoalEditionCommand extends CommandImpl {
  id: string = 'party.battleGoalEdition';
  requiredParameters: number = 2;

  validParameters(edition: string, value: boolean): boolean {
    return gameManager.editions().includes(edition) && !gameManager.editionRules(edition, false) && typeof value === 'boolean';
  }

  executeWithParameters(edition: string, value: boolean) {
    gameManager.game.battleGoalEditions = gameManager.game.battleGoalEditions || [];
    gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals || [];
    if (gameManager.game.battleGoalEditions.includes(edition) === value) {
      return;
    }
    if (value) {
      gameManager.game.battleGoalEditions.push(edition);
    } else {
      gameManager.game.battleGoalEditions = gameManager.game.battleGoalEditions.filter((other) => other !== edition);
      gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals.filter((other) => other.edition !== edition);
    }
  }
}

export class PartyBattleGoalFilterCommand extends CommandImpl {
  id: string = 'party.battleGoalFilter';
  requiredParameters: number = 3;

  filtered(edition: BASE_TYPE, name: BASE_TYPE): boolean {
    return (gameManager.game.filteredBattleGoals || []).some((identifier) => identifier.edition === edition && identifier.name === name);
  }

  validParameters(edition: string, name: string, value: boolean): boolean {
    return !!gameManager.battleGoalManager.getBattleGoal(new Identifier(name, edition)) && typeof value === 'boolean';
  }

  executeWithParameters(edition: string, name: string, value: boolean) {
    gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals || [];
    if (this.filtered(edition, name) === value) {
      return;
    }
    if (!value) {
      gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals.filter(
        (identifier) => identifier.edition !== edition || identifier.name !== name
      );
    } else {
      gameManager.game.filteredBattleGoals.push(new Identifier(name, edition));
    }
  }
}
