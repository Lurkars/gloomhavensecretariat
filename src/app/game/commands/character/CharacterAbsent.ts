import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterAbsentCommand extends CommandImpl {
  id: string = 'character.absent';
  requiredParameters: number = 2;

  validParameters(number: number, absent: boolean): boolean {
    const character = findCharacter(number);
    return !!character && typeof absent === 'boolean' && (!absent || character.absent || gameManager.characterManager.characterCount() > 1);
  }

  executeWithParameters(number: number, absent: boolean) {
    const character = findCharacter(number);
    if (character) {
      character.absent = absent;
      if (character.absent && character.active) {
        gameManager.roundManager.toggleFigure(character);
      }
    } else {
      this.executionError('character not found');
    }
  }
}
