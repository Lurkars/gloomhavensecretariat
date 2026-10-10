import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPersonalQuestCommand extends CommandImpl {
  id: string = 'character.personalQuest';
  requiredParameters: number = 2;

  validParameters(number: number, cardId: string): boolean {
    return !!findCharacter(number) && typeof cardId === 'string';
  }

  executeWithParameters(number: number, cardId: string) {
    const character = findCharacter(number);
    if (character) {
      character.progress.personalQuest = cardId;
      character.progress.personalQuestProgress = [];
      character.progress.personalQuestAutotrack = false;
      const personalQuest = gameManager.personalQuestManager.personalQuestByCard(gameManager.currentEdition(), cardId);
      if (personalQuest) {
        character.progress.personalQuest = personalQuest.cardId;
      }
    } else {
      this.executionError('character not found');
    }
  }
}
