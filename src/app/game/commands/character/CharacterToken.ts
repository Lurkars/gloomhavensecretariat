import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterTokenCommand extends CommandImpl {
  id: string = 'character.token';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    return !!findCharacter(number) && gameManager.characterManager.canChangeToken(value);
  }

  executeWithParameters(number: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.changeToken(character, value);
    } else {
      this.executionError('character not found');
    }
  }
}
