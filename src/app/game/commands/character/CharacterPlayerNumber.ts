import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPlayerNumberCommand extends CommandImpl {
  id: string = 'character.playerNumber';
  requiredParameters: number = 2;

  validParameters(number: number, newNumber: number): boolean {
    return !!findCharacter(number) && typeof newNumber === 'number' && newNumber > 0 && newNumber !== number;
  }

  executeWithParameters(number: number, newNumber: number) {
    const character = findCharacter(number);
    if (character) {
      const existing = findCharacter(newNumber);
      if (existing) {
        existing.number = character.number;
      }
      character.number = newNumber;
    } else {
      this.executionError('character not found');
    }
  }
}
