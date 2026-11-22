import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterSetAsideCommand extends CommandImpl {
  id: string = 'character.setAside';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    return !!findCharacter(number);
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setAsideCharacter(character);
    } else {
      this.executionError('character not found');
    }
  }
}
