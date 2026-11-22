import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterExhaustedCommand extends CommandImpl {
  id: string = 'character.exhausted';
  requiredParameters: number = 2;

  validParameters(number: number, exhausted: boolean): boolean {
    return !!findCharacter(number) && typeof exhausted === 'boolean';
  }

  executeWithParameters(number: number, exhausted: boolean) {
    const character = findCharacter(number);
    if (character) {
      gameManager.entityManager.setExhausted(character, exhausted);
    } else {
      this.executionError('character not found');
    }
  }
}
