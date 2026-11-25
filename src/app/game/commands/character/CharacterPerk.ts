import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPerkCommand extends CommandImpl {
  id: string = 'character.perk';
  requiredParameters: number = 3;

  validParameters(number: number, index: number, value: number, force: boolean = false): boolean {
    const character = findCharacter(number);
    return (
      !!character &&
      typeof index === 'number' &&
      typeof value === 'number' &&
      typeof force === 'boolean' &&
      gameManager.characterManager.canSetPerk(character, index, value, force)
    );
  }

  executeWithParameters(number: number, index: number, value: number, force: boolean = false) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setPerk(character, index, value, force);
    } else {
      this.executionError('character not found');
    }
  }
}
