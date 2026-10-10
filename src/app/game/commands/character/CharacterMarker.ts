import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterMarkerCommand extends CommandImpl {
  id: string = 'character.marker';
  requiredParameters: number = 2;

  validParameters(number: number, marker: boolean): boolean {
    return !!findCharacter(number) && typeof marker === 'boolean';
  }

  executeWithParameters(number: number, marker: boolean) {
    const character = findCharacter(number);
    if (character) {
      character.marker = marker;
    } else {
      this.executionError('character not found');
    }
  }
}
