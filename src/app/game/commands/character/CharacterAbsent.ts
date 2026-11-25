import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterAbsentCommand extends CommandImpl {
  id: string = 'character.absent';
  requiredParameters: number = 2;

  validParameters(number: number, absent: boolean): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterManager.canSetAbsent(character, absent);
  }

  executeWithParameters(number: number, absent: boolean) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setAbsent(character, absent);
    } else {
      this.executionError('character not found');
    }
  }
}
