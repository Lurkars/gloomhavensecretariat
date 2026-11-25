import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterMasteryCommand extends CommandImpl {
  id: string = 'character.mastery';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: boolean): boolean {
    const character = findCharacter(number);
    return !!character && typeof index === 'number' && gameManager.characterManager.canSetMastery(character, index, value);
  }

  executeWithParameters(number: number, index: number, value: boolean) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setMastery(character, index, value);
    } else {
      this.executionError('character not found');
    }
  }
}
