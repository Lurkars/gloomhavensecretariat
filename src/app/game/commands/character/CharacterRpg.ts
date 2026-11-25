import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterRpgCommand extends CommandImpl {
  id: string = 'character.rpg';
  requiredParameters: number = 3;

  validParameters(number: number, path: string, value: string | number | boolean): boolean {
    const character = findCharacter(number);
    return !!character && typeof path === 'string' && gameManager.characterRpgManager.canSetRpgValue(character, path, value);
  }

  executeWithParameters(number: number, path: string, value: string | number | boolean) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterRpgManager.setRpgValue(character, path, value);
    } else {
      this.executionError('character not found');
    }
  }
}
