import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterMasteryCommand extends CommandImpl {
  id: string = 'character.mastery';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: boolean): boolean {
    const character = findCharacter(number);
    return !!character && typeof index === 'number' && index >= 0 && index < character.masteries.length && typeof value === 'boolean';
  }

  executeWithParameters(number: number, index: number, value: boolean) {
    const character = findCharacter(number);
    if (character) {
      character.progress.masteries = character.progress.masteries.filter((mastery) => mastery !== index);
      if (value) {
        character.progress.masteries.push(index);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
