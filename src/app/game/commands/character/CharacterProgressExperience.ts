import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterProgressExperienceCommand extends CommandImpl {
  id: string = 'character.progress.experience';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    const character = findCharacter(number);
    return !!character && typeof value === 'number' && value !== 0 && character.progress.experience + value >= 0;
  }

  executeWithParameters(number: number, value: number) {
    const character = findCharacter(number);
    if (character) {
      gameManager.characterManager.addXP(character, value, !gameManager.game.scenario && gameManager.roundManager.firstRound);
    } else {
      this.executionError('character not found');
    }
  }
}
