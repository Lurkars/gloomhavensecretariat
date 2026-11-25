import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterPlayerNumberCommand extends CommandImpl {
  id: string = 'character.playerNumber';
  requiredParameters: number = 2;

  validParameters(number: number, newNumber: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterManager.canSetPlayerNumber(character, newNumber);
  }

  executeWithParameters(number: number, newNumber: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.setPlayerNumber(character, newNumber);
    } else {
      this.executionError('character not found');
    }
  }
}
