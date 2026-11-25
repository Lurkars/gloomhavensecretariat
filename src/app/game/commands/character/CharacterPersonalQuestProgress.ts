import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPersonalQuestProgressCommand extends CommandImpl {
  id: string = 'character.personalQuest.progress';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number): boolean {
    const character = findCharacter(number);
    return (
      !!character &&
      typeof index === 'number' &&
      typeof value === 'number' &&
      gameManager.personalQuestManager.canSetProgress(character, index, value)
    );
  }

  executeWithParameters(number: number, index: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.personalQuestManager.setProgress(character, index, value);
    } else {
      this.executionError('character not found');
    }
  }
}
