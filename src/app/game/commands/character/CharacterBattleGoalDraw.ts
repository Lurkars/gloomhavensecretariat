import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';

export class CharacterBattleGoalDrawCommand extends CommandImpl {
  id: string = 'character.battleGoal.draw';
  requiredParameters: number = 2;

  validParameters(number: number, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const character = findCharacter(number);
    return (
      settingsManager.settings.battleGoals && !!character && gameManager.battleGoalManager.getUnrevealedBattleGoals(character).length > 0
    );
  }

  executeWithParameters(number: number, seed: number) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    if (character) {
      gameManager.battleGoalManager.drawBattleGoals(character);
    } else {
      this.executionError('character not found');
    }
  }
}
