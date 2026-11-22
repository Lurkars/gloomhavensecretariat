import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterDonateCommand extends CommandImpl {
  id: string = 'character.donate';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterManager.canDonate(character);
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.donate(character);
    } else {
      this.executionError('character not found');
    }
  }
}
