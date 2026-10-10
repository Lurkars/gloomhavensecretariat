import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterRetireCommand extends CommandImpl {
  id: string = 'character.retire';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    const character = findCharacter(number);
    return !!character && !character.progress.retired;
  }

  executeWithParameters(number: number) {
    const character = findCharacter(number);
    if (character) {
      character.progress.retired = true;
      if (gameManager.game.party.campaignMode) {
        gameManager.game.party.retirements.push(character.toModel());
        gameManager.characterManager.removeCharacter(character, true);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
