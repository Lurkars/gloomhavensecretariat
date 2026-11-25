import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPersonalQuestAutotrackCommand extends CommandImpl {
  id: string = 'character.personalQuest.autotrack';
  requiredParameters: number = 2;

  validParameters(number: number, autotrack: boolean): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.personalQuestManager.canSetAutotrack(character, autotrack);
  }

  executeWithParameters(number: number, autotrack: boolean) {
    const character = findCharacter(number);
    if (character) {
      gameManager.personalQuestManager.setAutotrack(character, autotrack);
    } else {
      this.executionError('character not found');
    }
  }
}
