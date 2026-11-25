import { CharacterProgressField } from 'src/app/game/businesslogic/CharacterManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterProgressSetCommand extends CommandImpl {
  id: string = 'character.progress.set';
  requiredParameters: number = 3;

  validParameters(number: number, field: string, value: string | number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterManager.canSetProgressValue(character, field as CharacterProgressField, value);
  }

  executeWithParameters(number: number, field: string, value: string | number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setProgressValue(character, field as CharacterProgressField, value);
    } else {
      this.executionError('character not found');
    }
  }
}
