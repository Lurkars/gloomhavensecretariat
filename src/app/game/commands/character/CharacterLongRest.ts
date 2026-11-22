import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterLongRestCommand extends CommandImpl {
  id: string = 'character.longRest';
  requiredParameters: number = 2;

  validParameters(number: number, longRest: boolean): boolean {
    return !!findCharacter(number) && typeof longRest === 'boolean';
  }

  executeWithParameters(number: number, longRest: boolean) {
    const character = findCharacter(number);
    if (character) {
      gameManager.roundManager.setLongRest(character, longRest);
    } else {
      this.executionError('character not found');
    }
  }
}
