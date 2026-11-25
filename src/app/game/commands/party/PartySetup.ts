import { gameManager } from 'src/app/game/businesslogic/Managers';
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
    return (
      gameManager.editionManager.editions().includes(edition) && !gameManager.editionRules(edition, false) && typeof value === 'boolean'
    );
  }

  executeWithParameters(edition: string, value: boolean) {
    gameManager.battleGoalManager.setBattleGoalEdition(edition, value);
  }
}

export class PartyBattleGoalFilterCommand extends CommandImpl {
  id: string = 'party.battleGoalFilter';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, value: boolean): boolean {
    return !!gameManager.battleGoalManager.getBattleGoal(new Identifier(name, edition)) && typeof value === 'boolean';
  }

  executeWithParameters(edition: string, name: string, value: boolean) {
    gameManager.battleGoalManager.setBattleGoalFilter(edition, name, value);
  }
}
