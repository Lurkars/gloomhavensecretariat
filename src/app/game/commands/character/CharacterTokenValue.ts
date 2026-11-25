import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterTokenValueCommand extends CommandImpl {
  id: string = 'character.tokenValue';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterManager.canChangeTokenValue(character, index, value);
  }

  executeWithParameters(number: number, index: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.changeTokenValue(character, index, value);
    } else {
      this.executionError('character not found');
    }
  }
}
