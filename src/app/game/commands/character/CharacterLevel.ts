import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterLevelCommand extends CommandImpl {
  id: string = 'character.level';
  requiredParameters: number = 2;

  validParameters(number: number, level: number): boolean {
    return !!findCharacter(number) && typeof level === 'number' && level >= 1 && level <= 9;
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
