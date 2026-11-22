import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPerkCommand extends CommandImpl {
  id: string = 'character.perk';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number): boolean {
    const character = findCharacter(number);
    return (
      !!character &&
      typeof index === 'number' &&
      !!character.perks[index] &&
      typeof value === 'number' &&
      value >= 0 &&
      value <= character.perks[index].count
    );
  }

  executeWithParameters(number: number, index: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setPerk(character, index, value);
    } else {
      this.executionError('character not found');
    }
  }
}
