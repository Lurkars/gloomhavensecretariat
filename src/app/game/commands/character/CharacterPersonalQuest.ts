import { gameManager } from 'src/app/game/businesslogic/Managers';
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
      gameManager.personalQuestManager.setPersonalQuest(character, cardId);
    } else {
      this.executionError('character not found');
    }
  }
}
