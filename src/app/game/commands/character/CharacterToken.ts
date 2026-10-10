import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterTokenCommand extends CommandImpl {
  id: string = 'character.token';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    return !!findCharacter(number) && typeof value === 'number' && value !== 0;
  }

  executeWithParameters(number: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      character.token = Math.max(0, character.token + value);
    } else {
      this.executionError('character not found');
    }
  }
}
