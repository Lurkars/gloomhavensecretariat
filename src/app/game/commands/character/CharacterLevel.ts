import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterLevelCommand extends CommandImpl {
  id: string = 'character.level';
  requiredParameters: number = 2;

  validParameters(number: number, level: number): boolean {
    const character = findCharacter(number);
    return !!character && typeof level === 'number' && gameManager.characterManager.canSetLevel(character, level);
  }

  executeWithParameters(number: number, level: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setLevel(character, level);
    } else {
      this.executionError('character not found');
    }
  }
}
