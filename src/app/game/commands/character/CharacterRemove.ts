import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterRemoveCommand extends CommandImpl {
  id: string = 'character.remove';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    return !!findCharacter(number);
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.removeCharacter(character);
    } else {
      this.executionError('character not found');
    }
  }
}
