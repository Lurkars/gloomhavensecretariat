import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterRetirementDismissCommand extends CommandImpl {
  id: string = 'character.retirement.dismiss';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.personalQuestManager.canDismissRetirement(character);
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.personalQuestManager.dismissRetirement(character);
    } else {
      this.executionError('character not found');
    }
  }
}
